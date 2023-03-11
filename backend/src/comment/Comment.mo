import CA "mo:candb/CanisterActions";
import CanDB "mo:candb/CanDB";
import Entity "mo:candb/Entity";
import Debug "mo:base/Debug";

import Array "mo:base/Array";
import Cycles "mo:base/ExperimentalCycles";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import Prim "mo:⛔";


/// Access Patterns
///
/// Get top n comments by score
/// Get latest n comments
/// get latest n comments by subreddit
/// Look up a specific comment (timestamp + id)


/// Split up PK by every 30 days
///
/// Get top n comments today
/// Get top n comments by last 30 days
/// Get top n comments by last 90 days
/// Get top n comments by all time


shared ({ caller = creator }) actor class Comment({
  primaryKey: Text;
  scalingOptions: CanDB.ScalingOptions;
  owners: ?[Principal];
}) = this {

  /// @required (may wrap, but must be present in some form in the canister)
  stable let db = CanDB.init({
    pk = primaryKey;
    scalingOptions = scalingOptions;
  });

  /// @recommended (not required) public API
  public query func getPK(): async Text { db.pk };

  /// @required public API (Do not delete or change)
  public query func skExists(sk: Text): async Bool { 
    CanDB.skExists(db, sk);
  };

  /// @required public API (Do not delete or change)
  public shared({ caller = caller }) func transferCycles(): async () {
    if (caller == creator) {
      return await CA.transferCycles(caller);
    };
  };

  type CommentRequestInput = {
    rowNumber: Text;
    commentId: Text;
    subredditId: Text;
    subredditName: Text;
    createdUTC: Text;
    isoString: Text;
    permalink: Text;
    body: Text;
    sentiment: Float;
    lexicographicScore: Text;
    score: Int;
  };
  

  type CommentResult = {
    rowNumber: Text;
    commentId: Text;
    subredditId: Text;
    subredditName: Text;
    createdUTC: Text;
    permalink: Text;
    body: Text;
    sentiment: Float;
    score: Int;
  };

  type ScanCommentResult = {
    comments: [CommentResult];
    nextKey: ?Text;
  };


  // Used by `backfill/` for batch processing comments
  public shared({ caller = caller }) func processComments(comments: [CommentRequestInput]): async () {
    if (not isOwner(caller)) { // basic authorization to preserve the demo for others (others can view, but not backfill comments)
      return
    };

    Debug.print("received comments of size=" # debug_show(comments.size()));
    for (c in comments.vals()) {
      // allow for query by timestamp 
      await CanDB.put(db, {
        sk = "timestamp#" # c.isoString # "#id#" # c.commentId;
        attributes = [
          ("rowNumber", #text(c.rowNumber)),
          ("commentId", #text(c.commentId)),
          ("subredditId", #text(c.subredditId)),
          ("subredditName", #text(c.subredditName)),
          ("createdUTC", #text(c.createdUTC)),
          ("permalink", #text(c.permalink)),
          ("body", #text(c.body)),
          ("sentiment", #float(c.sentiment)),
          ("score", #int(c.score)),
        ]
      });

      // allow for query by subreddit and timestamp
      await CanDB.put(db, {
        sk = "subreddit#" # c.subredditName # "#timestamp#" # c.isoString # "#id#" # c.commentId;
        attributes = [
          ("rowNumber", #text(c.rowNumber)),
          ("commentId", #text(c.commentId)),
          ("subredditId", #text(c.subredditId)),
          ("subredditName", #text(c.subredditName)),
          ("createdUTC", #text(c.createdUTC)),
          ("permalink", #text(c.permalink)),
          ("body", #text(c.body)),
          ("sentiment", #float(c.sentiment)),
          ("score", #int(c.score)),
        ]
      });
      // allow for query by score (top voted) 
      await CanDB.put(db, {
        sk = "score#" # c.lexicographicScore # "#id#" # c.commentId;
        attributes = [
          ("rowNumber", #text(c.rowNumber)),
          ("commentId", #text(c.commentId)),
          ("subredditId", #text(c.subredditId)),
          ("subredditName", #text(c.subredditName)),
          ("createdUTC", #text(c.createdUTC)),
          ("permalink", #text(c.permalink)),
          ("body", #text(c.body)),
          ("sentiment", #float(c.sentiment)),
          ("score", #int(c.score)),
        ]
      })
    }
  };

  // Helper method to help gate access control to actor canister methods beyond just the principal that created the canister
  func isOwner(caller: Principal): Bool {
    switch(owners) {
      case null { false };
      case (?arrayOwners) {
        for (owner in arrayOwners.vals()) {
          if (caller == owner) { return true };
        };
        return false;
      }
    }
  }; 

  // Flexibly scan CanDB by sort key range, limit, and ascending or descending order
  public query func scanComments(skLowerBound: Text, skUpperBound: Text, limit: Nat, ascending: ?Bool): async ScanCommentResult {
    // cap the amount of entries one can return from the database to reduce load and incentive use of pagination
    let cappedLimit = if (limit > 10) { 10 } else { limit };

    let { entities; nextKey } = CanDB.scan(db, {
      skLowerBound = skLowerBound;
      skUpperBound = skUpperBound;
      limit = cappedLimit;
      ascending = ascending;
    });
    
    {
      comments = unwrapValidComments(entities);
      nextKey = nextKey;
    }
  };

  type CanisterMetrics = {
    heapSize: Nat;
    cycles: Nat;
    entityCount: Nat;
    scalingStatus: { #not_started; #started; #complete };
  };

  // Retrieves Canister and database metrics for the specific canister
  public query func getCanisterMetrics(): async CanisterMetrics {
    {
      heapSize = Prim.rts_heap_size();
      cycles = Cycles.balance();
      entityCount = db.count;
      scalingStatus = db.scalingStatus;
    }
  };

  // Retrieves the scaling options that have been set on this instance of CanDB
  public query func getScalingOptions(): async CanDB.ScalingOptions {
    db.scalingOptions
  };

  // Helper function for unwrapping and validating commment entities from CanDB before returning them to the frontend
  func unwrapValidComments(entities: [Entity.Entity]): [CommentResult] {
    Array.mapFilter<Entity.Entity, CommentResult>(entities, func(e) {
      let { sk; attributes; } = e;
      let rowNumber = Entity.getAttributeMapValueForKey(attributes, "rowNumber");
      let commentId = Entity.getAttributeMapValueForKey(attributes, "commentId");
      let subredditId = Entity.getAttributeMapValueForKey(attributes, "subredditId");
      let subredditName = Entity.getAttributeMapValueForKey(attributes, "subredditName");
      let createdUTC = Entity.getAttributeMapValueForKey(attributes, "createdUTC");
      let permalink = Entity.getAttributeMapValueForKey(attributes, "permalink");
      let body = Entity.getAttributeMapValueForKey(attributes, "body");
      let sentiment = Entity.getAttributeMapValueForKey(attributes, "sentiment");
      let score = Entity.getAttributeMapValueForKey(attributes, "score");
      switch(rowNumber, commentId, subredditId, subredditName, createdUTC, permalink,
        body, sentiment, score
      ) {
        case (
          ?(#text(rowNumber)),
          ?(#text(commentId)),
          ?(#text(subredditId)),
          ?(#text(subredditName)),
          ?(#text(createdUTC)),
          ?(#text(permalink)),
          ?(#text(body)),
          ?(#float(sentiment)),
          ?(#int(score)),
        ) {
          ?{
            rowNumber = rowNumber;
            commentId = commentId;
            subredditId = subredditId;
            subredditName = subredditName;
            createdUTC;
            permalink;
            body;
            sentiment;
            score;
          }
        };
        case _ { 
          Debug.print("invalid comment");
          null
        }
      }
    })
  };

  // Used to pass new scaling options to the db through an upgrade from the IndexCanister if desired
  system func postupgrade() {
    db.scalingOptions := scalingOptions;
  };
}