import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

import CA "mo:candb/CanisterActions";
import CanisterMap "mo:candb/CanisterMap";
import Admin "mo:candb/CanDBAdmin";
import Utils "mo:candb/Utils";
import Buffer "mo:stable-buffer/StableBuffer";
import RBT "mo:stable-rbtree/StableRBTree";

import Comment "../comment/Comment";

shared ({caller = owner}) actor class IndexCanister() = this {
  /// @required stable variable (Do not delete or change)
  ///
  /// Holds the CanisterMap of PK -> CanisterIdList
  stable var pkToCanisterMap = CanisterMap.init();

  /// @required API (Do not delete or change)
  ///
  /// Get all canisters for an specific PK
  ///
  /// This method is called often by the candb-client query & update methods. 
  public shared query({caller = caller}) func getCanistersByPK(pk: Text): async [Text] {
    getCanisterIdsIfExists(pk);
  };

  /// @required function (Do not delete or change)
  ///
  /// Helper method acting as an interface for returning an empty array if no canisters
  /// exist for the given PK
  func getCanisterIdsIfExists(pk: Text): [Text] {
    switch(CanisterMap.get(pkToCanisterMap, pk)) {
      case null { [] };
      case (?canisterIdsBuffer) { Buffer.toArray(canisterIdsBuffer) } 
    }
  };

  // Autoscale the a specific parition of the comment service
  public shared({caller = caller}) func autoScaleCommentServiceCanister(pk: Text): async Text {
    // Auto-Scaling Authorization - if the request to auto-scale the partition is not coming from an existing canister in the partition, reject it
    if (Utils.callingCanisterOwnsPK(caller, pkToCanisterMap, pk)) {
      Debug.print("creating an additional canister for pk=" # pk);
      await createCommentCanister(pk, ?[owner, Principal.fromActor(this)])
    } else {
      throw Error.reject("not authorized");
    };
  };

  /// Creates the provided PK and associated comment canister if the PK does not yet exist
  public shared({caller = creator}) func createCommentCanisterByPK(pk: Text): async ?Text {
    Debug.print("caller=" # debug_show(creator));
    Debug.print("owner=" # debug_show(owner));

    if (creator != owner) return ?"Not authorized to create a canister"; 
    let canisterIds = getCanisterIdsIfExists(pk);
    // does not exist
    if (canisterIds == []) {
      ?(await createCommentCanister(pk, ?[owner, Principal.fromActor(this)]));
    // already exists
    } else {
      Debug.print("already exists, not creating and returning null");
      null 
    };
  };

  // Helper function that creates comment canisters, called by both initial PK creation and auto-scaling
  func createCommentCanister(pk: Text, controllers: ?[Principal]): async Text {
    Debug.print("creating new comment canister with pk=" # pk);
    Cycles.add(500_000_000_000);
    let newUserCanister = await Comment.Comment({
      partitionKey = pk;
      scalingOptions = {
        autoScalingHook = autoScaleCommentServiceCanister;
        sizeLimit = #heapSize(10_000_000);
      };
      owners = controllers;
    });
    let newUserCanisterPrincipal = Principal.fromActor(newUserCanister);
    await CA.updateCanisterSettings({
      canisterId = newUserCanisterPrincipal;
      settings = {
        controllers = controllers;
        compute_allocation = ?0;
        memory_allocation = ?0;
        freezing_threshold = ?2592000;
      }
    });

    let newUserCanisterId = Principal.toText(newUserCanisterPrincipal);
    pkToCanisterMap := CanisterMap.add(pkToCanisterMap, pk, newUserCanisterId);

    newUserCanisterId;
  };
  
  /// Upgrade comment canisters for a specific PK
  public shared({ caller = caller }) func upgradeCommentCanisters(commentPK: Text, wasmModule: Blob): async [(Text, Admin.InterCanisterActionResult)] {
    if (caller != owner) { return [] }; // basic authorization    

    await Admin.upgradeCanistersByPK(
      pkToCanisterMap,
      commentPK, 
      wasmModule,
      {
        autoScalingHook = autoScaleCommentServiceCanister;
        sizeLimit = #heapSize(10_000_000);
      }
    );
  };

  /// Upgrade comment canisters in a PK range, i.e. rolling upgrades (limit is fixed at upgrading the canisters of 5 PKs per call)
  public shared({ caller = caller }) func upgradeCommentCanistersInPKRange(lowerCommentPK: Text, upperCommentPK: Text, wasmModule: Blob): async Admin.UpgradePKRangeResult {
    if (caller != owner) { // basic authorization
      Debug.print("not authorized");
      return {
        upgradeCanisterResults = [];
        nextKey = null;
      }
    };

    await Admin.upgradeCanistersInPKRange({
      canisterMap = pkToCanisterMap;
      lowerPK = lowerCommentPK;
      upperPK = upperCommentPK;
      limit = 5; // Fixed to upgrade all canisters for 5 PKs (max if exists) at a time
      wasmModule = wasmModule;
      scalingOptions = {
        autoScalingHook = autoScaleCommentServiceCanister;
        sizeLimit = #heapSize(10_000_000);
      };
      owners = ?[owner, Principal.fromActor(this)];
    });
  };

  /// Spins down all canisters belonging to a specific user (transfers cycles back to the index canister, and stops/deletes all canisters)
  public shared({caller = caller}) func deleteCommentsByPK(commentPK: Text): async ?Admin.CanisterCleanupStatusMap {
    if (caller != owner) return null; // authorization 

    let canisterIds = getCanisterIdsIfExists(commentPK);
    if (canisterIds == []) {
      Debug.print("canister for comment with pk=" # commentPK # " does not exist");
      null
    } else {
      // can choose to use this statusMap for to detect failures and prompt retries if desired 
      let statusMap = await Admin.transferCyclesStopAndDeleteCanisters(canisterIds);
      pkToCanisterMap := CanisterMap.delete(pkToCanisterMap, commentPK);
      ?statusMap;
    };
  };

  /// Retrieves the full PK to canisterId mapping for the application
  /// In a different application, one could implement logic to restrict this result to just the canisters a specific user has authorized access to
  public shared query({ caller = caller }) func getPKToCanisterMapping(): async [(Text, [CanisterMap.CanisterId])]{
    let canisterMapIterator = Iter.map<(Text, CanisterMap.CanisterIdList), (Text, [CanisterMap.CanisterId])>(
      RBT.entries<Text, CanisterMap.CanisterIdList>(pkToCanisterMap),
      func((pk, canisterIdsBuffer)) {
        (pk, Buffer.toArray(canisterIdsBuffer))
      }
    );

    Iter.toArray<(Text, [CanisterMap.CanisterId])>(canisterMapIterator);
  };
}