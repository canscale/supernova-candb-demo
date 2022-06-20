import * as React from "react";
import { fetchAllCommentsByScoreForDateRange, fetchAllCommentsBySubredditForDateRange, fetchAllCommentsByTimestampForDateRange, getCommentsByScore, getCommentsBySubreddit } from "../api";
import CommentDisplay from "../components/CommentDisplay";
import { Button, Stack, TextField } from "@mui/material";
import { ActorClient } from "candb-client-typescript-dev-testing/dist/ActorClient";
import { IndexCanister } from "../../declarations/index/index.did";
import { Comment } from "../../declarations/comment/comment.did";
import BasicDateRangePicker from "../components/DateRangePicker";
import RowRadioButtonsGroup from "../components/QueryByRadioButtons";



function CommentPage(
  commentClient: ActorClient<IndexCanister, Comment>,
) {
  const [ comments, setComments ] = React.useState([]);
  const [ nextKey, setNextKey ] = React.useState("");
  const [ subreddit, setSubreddit ] = React.useState("");
  const [ queryCategory, setQueryCategory ] = React.useState("score")
  const [ startDate, setStartDate ] = React.useState(new Date(Date.UTC(2021, 6, 14)));
  const [ endDate, setEndDate ] = React.useState(new Date(Date.UTC(2021, 9, 25)));

  async function fetchComments(useNextKey: boolean) {
    if (queryCategory === "score") {
      fetchAllCommentsInDateRangeByScore(useNextKey)
    } else if (queryCategory === "subreddit") {
      fetchAllCommentsInDateRangeBySubreddit(useNextKey)
    } else if (queryCategory == "timestamp") {
      fetchAllCommentsInDateRangeByTimestamp(useNextKey)
    } else {
      throw new Error(`query category ${queryCategory} not supported`)
    }
  }

  async function fetchAllCommentsInDateRangeByScore(useNextKey?: boolean) {
    let requestNextKey = useNextKey ? nextKey : "";
    let result = await fetchAllCommentsByScoreForDateRange(commentClient, startDate, endDate, requestNextKey)
    console.log("all dates result", result);
    setComments(result.comments)
    setNextKey(result.nextKey)
  }

  async function fetchAllCommentsInDateRangeBySubreddit(useNextKey?: boolean) {
    let requestNextKey = useNextKey ? nextKey : "";
    let result = await fetchAllCommentsBySubredditForDateRange(commentClient, startDate, endDate, subreddit, requestNextKey)
    console.log("all dates result", result);
    setComments(result.comments)
    setNextKey(result.nextKey)
  }


  async function fetchAllCommentsInDateRangeByTimestamp(useNextKey?: boolean) {
    let requestNextKey = useNextKey ? nextKey : "";
    let result = await fetchAllCommentsByTimestampForDateRange(commentClient, startDate, endDate, requestNextKey)
    console.log("all dates result", result);
    setComments(result.comments)
    setNextKey(result.nextKey)
  }

  function renderComments() {
    return comments.map(c => CommentDisplay(c, 'timestamp'))
  }

  function onQueryCategoryChange(newCategory: string) {
    console.log("newCategory", newCategory)
    // reset next key
    setNextKey("")
    setQueryCategory(newCategory)
  }

  function renderQueryBar() {
    const subredditInput = queryCategory === 'subreddit'
      ? <TextField label="Subreddit" onChange={(e) => setSubreddit(e.target.value)}/> 
      : null
    return (
      <div className="query-bar">
        {RowRadioButtonsGroup(queryCategory, onQueryCategoryChange)}
        {subredditInput}
      </div>
    )
  }

  function renderDatesBar() {
    return (
      <div>
        <div className='dates-bar-header'>Filter by Dates:</div>
        <div className="dates-bar">
          {BasicDateRangePicker(startDate, setStartDate)}
          <div className='dates-bar-to'>To</div>
          {BasicDateRangePicker(endDate, setEndDate)}
        </div>
      </div>
    )
  }

  function renderCommentQueryButtons() {
    return (
      <div className='comment-query-buttons-wrapper'>
        <Button className="comment-query-button" variant="contained" onClick={() => fetchComments(false)}>Get comments</Button>
        <div>
          <Button className="comment-query-button" variant="contained" onClick={() => fetchComments(true)}>Next Page (uses the nextKey below)</Button>
          <div className='nextKey-text-wrapper'>nextKey: {nextKey}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="comments-page">
      <div>
        <h1>Comments From the Reddit COVID Dataset</h1>
        {renderQueryBar()}
        {renderDatesBar()}
        {renderCommentQueryButtons()}
      </div>
      
      <Stack className="comments-result-container">
        {renderComments()}
      </Stack>
    </div>
  )
}

export default CommentPage;