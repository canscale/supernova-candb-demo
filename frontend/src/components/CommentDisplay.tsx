import { Link } from "@mui/material";
import * as React from "react";
import { CommentResult } from "../types";

function CommentDisplay(comment: CommentResult, orderedBy: 'timestamp' | 'score') {
  let { body, createdUTC, permalink, subredditName, score, sentiment } = comment;
  let scoreText = score >= 0 ? 'upvoted' : 'downvoted';
  let date = new Date(Number(createdUTC) * 1000);
  let utcString = date.toUTCString();
  let orderedByField = orderedBy === 'timestamp' ? utcString : score.toString();
  return (
    <div className="comment-item-container" key={comment.commentId}>
      <div className="comment-item-order-container">
        {orderedByField}
      </div>
      <div className="comment-metadata">
        <div className="comment-item-header-container">
          <div className="comment-item-header-subreddit-name">r/{subredditName}</div>
          <div className="comment-item-header-datetime">local datetime: {date.toLocaleString()}</div>
          <Link className="comment-link" href={permalink}> comment link</Link>
        </div>
        <div className="comment-text-container">
          <div className="comment-text">{body}</div>
        </div>
        <div className="comment-scoring-container">
          <div>{scoreText} count: {score.toString()} </div>
          <div>sentiment: {sentiment}</div>
        </div>
        
      </div>
    </div>
  )
}

export default CommentDisplay;