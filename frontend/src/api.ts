import { ActorClient } from "candb-client-typescript-dev-testing/dist/ActorClient";
import { IndexClient } from "candb-client-typescript-dev-testing/dist/IndexClient";
import { CanisterMetrics, Comment, ScanCommentResult } from "../declarations/comment/comment.did";
import { IndexCanister } from "../declarations/index/index.did";
import { pack } from "./lexicographic-encoding";
import { CommentResult } from "./types";

function getSubredditSK(comment: CommentResult) {
  let cDate = new Date(Number(comment.createdUTC) * 1000)
  // parse data format if not in millis
  if (isNaN(cDate.getTime())) { cDate = new Date(comment.createdUTC) }
  return `subreddit#${comment.subredditName}#timestamp#${cDate.toISOString()}#id${comment.commentId}` 
}

function getScoreSK(comment: CommentResult) {
  let lexicographicScore = pack(Number(comment.score), "hex") as string
  return `score#${lexicographicScore}#id#${comment.commentId}`
}

function getTimestampSK(comment: CommentResult) {
  let cDate = new Date(Number(comment.createdUTC) * 1000)
  // parse data format if not in millis
  if (isNaN(cDate.getTime())) { cDate = new Date(comment.createdUTC) }
  return `#timestamp#${cDate.toISOString()}#id${comment.commentId}` 
}

function arrangeCommentsInDescendingTimestampOrder(results: { comments: CommentResult[][], nextKeys: string[] }, limit: number, getSKForQuery: (comment: CommentResult) => string) {
  let highestNextKey: string = null;
  for (let nk of results.nextKeys) {
    if (highestNextKey === null || nk > highestNextKey) { highestNextKey = nk };
  };
  let commentLists = results.comments.filter((cl, i) => cl.length > 0).map(cl => ({ comments: cl, counter: 0 }));

  let orderedResult: CommentResult[] = []
  
  // merge sorting results by sk
  while (orderedResult.length <= limit + 1) {
    let maxSK: string = null;
    let minCommentCounter = null;
    for (let i=0; i<commentLists.length; i+=1) {
      let {comments, counter} = commentLists[i];
      if (counter >= comments.length) continue; 

      let sk = getSKForQuery(comments[counter]);
      if (maxSK === null || sk > maxSK) { 
        maxSK = sk; 
        minCommentCounter = { comments, counter, index: i };
      }
    }

    if (maxSK == null) { 
      break;
    } else {
      let { comments, counter, index } = minCommentCounter
      orderedResult.push(comments[counter]);
      commentLists[index].counter += 1;
    }
  }

  if (orderedResult.length < limit + 1)  return { comments: orderedResult, nextKey: highestNextKey }

  let nextKeyFromResults = getSKForQuery(orderedResult[orderedResult.length - 1])
  const nextKey = nextKeyFromResults > highestNextKey ? nextKeyFromResults : highestNextKey;

  return {
    comments: orderedResult.slice(0,limit),
    nextKey
  }
}

function arrangeCommentsByScoreAndNextKeys(results: { comments: CommentResult[][], nextKeys: string[] }, limit: number) {
  let highestNextKey: string = null;
  for (let nk of results.nextKeys) {
    if (highestNextKey === null || highestNextKey < nk) { highestNextKey = nk };
  };
  let commentLists = results.comments.filter((cl, i) => cl.length > 0).map(cl => ({ comments: cl, counter: 0 }));

  let orderedResult: CommentResult[] = []
  
  // merge sorting results by sk
  while (orderedResult.length <= limit + 1) {
    let maxScore: bigint = null;
    let minCommentCounter = null;
    for (let i=0; i<commentLists.length; i+=1) {
      let {comments, counter} = commentLists[i];
      if (counter >= comments.length) continue; 

      let commentScore = comments[counter].score
      if (maxScore === null || maxScore < commentScore) { 
        maxScore = commentScore;
        minCommentCounter = { comments, counter, index: i };
      }
    }

    if (maxScore == null) { 
      break;
    } else {
      let { comments, counter, index } = minCommentCounter
      orderedResult.push(comments[counter]);
      commentLists[index].counter += 1;
    }
  }

  if (orderedResult.length < limit + 1) return { comments: orderedResult, nextKey: highestNextKey };

  let nextKeyFromResults = getScoreSK(orderedResult[orderedResult.length - 1])
  const nextKey = nextKeyFromResults > highestNextKey ? nextKeyFromResults : highestNextKey;

  return {
    comments: orderedResult.slice(0,limit),
    nextKey
  }
}

interface ReducedCommentResult {
  comments: CommentResult[][];
  nextKeys: string[];
}

function settledCommentsResultReducer(acc: ReducedCommentResult, settledResult: PromiseSettledResult<ScanCommentResult>): ReducedCommentResult {
  if (settledResult.status === 'rejected') return acc;

  const { comments, nextKey } = settledResult.value;
  return {
    comments: acc.comments.concat([comments]),
    nextKeys: acc.nextKeys.concat(nextKey)
  } 
};

function formatDate(d: Date) {
  const month = d.getUTCMonth() + 1;
  const formattedMonth = `${month < 10 ? "0" : ""}${month}`;
  const day = d.getUTCDate();
  const formattedDay = `${day < 10 ? "0" : ""}${day}`

  return `${d.getUTCFullYear()}-${formattedMonth}-${formattedDay}`
}

function makeDateUTC(date: Date) {
  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();
  return new Date(Date.UTC(year, month, day))
}

function getDatesInRange(start: Date, end: Date): Date[] {
  const dateArray = [];
  let currentDate = makeDateUTC(start);
  let endDate = makeDateUTC(end);
  while (currentDate <= endDate) {
    let nextDate = makeDateUTC(currentDate)
    dateArray.push(nextDate);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  return dateArray;
}

export async function fetchAllCommentsByTimestampForDateRange(
  commentClient: ActorClient<IndexCanister, Comment>, 
  startDate: Date,
  endDate: Date,
  nextKey?: string
) {
  let limit = 10;
  let dates = getDatesInRange(startDate, endDate)
  let datedResults = await Promise.all(dates.map(d => getCommentsByTimestamp(commentClient, d, nextKey)))
  let allDateQueryResult = datedResults.reduce((acc: ReducedCommentResult, dateResult) => {
    return {
      comments: acc.comments.concat([dateResult.comments]),
      nextKeys: acc.nextKeys.concat(dateResult.nextKey)
    }
  }, {
    comments: [],
    nextKeys: [] 
  })

  console.log("allDateQueryResult", allDateQueryResult)

  return arrangeCommentsInDescendingTimestampOrder(allDateQueryResult, limit, getTimestampSK)
};

export async function fetchAllCommentsByScoreForDateRange(
  commentClient: ActorClient<IndexCanister, Comment>, 
  startDate: Date,
  endDate: Date,
  nextKey?: string
) {
  let limit = 10;
  let dates = getDatesInRange(startDate, endDate)
  let datedResults = await Promise.all(dates.map(d => getCommentsByScore(commentClient, d, nextKey)))
  let allDateQueryResult = datedResults.reduce((acc: ReducedCommentResult, dateResult) => {
    return {
      comments: acc.comments.concat([dateResult.comments]),
      nextKeys: acc.nextKeys.concat(dateResult.nextKey)
    }
  }, {
    comments: [],
    nextKeys: [] 
  })

  console.log("allDateQueryResult", allDateQueryResult)

  return arrangeCommentsByScoreAndNextKeys(allDateQueryResult, limit)
};

export async function fetchAllCommentsBySubredditForDateRange(
  commentClient: ActorClient<IndexCanister, Comment>, 
  startDate: Date,
  endDate: Date,
  subredditName: string,
  nextKey?: string
) {
  let limit = 10;
  let dates = getDatesInRange(startDate, endDate)
  let datedResults = await Promise.all(dates.map(d => getCommentsBySubreddit(commentClient, d, subredditName, nextKey)))
  let allDateQueryResult = datedResults.reduce((acc: ReducedCommentResult, dateResult) => {
    return {
      comments: acc.comments.concat([dateResult.comments]),
      nextKeys: acc.nextKeys.concat(dateResult.nextKey)
    }
  }, {
    comments: [],
    nextKeys: [] 
  })

  console.log("allDateQueryResult", allDateQueryResult)

  return arrangeCommentsInDescendingTimestampOrder(allDateQueryResult, limit, getSubredditSK)
};

export async function getCommentsBySubreddit(commentClient: ActorClient<IndexCanister, Comment>, pkDate: Date, subredditName: string, nextKey?: string) {
  let limit = 10;
  let upperBound = (nextKey === "" || nextKey === undefined) ? `subreddit#${subredditName}#~` : nextKey;
  const pk = `comment#${formatDate(pkDate)}`
  let allCanisterQueryResult = await commentClient.queryReduce<Comment["scanComments"],  ReducedCommentResult>(
    pk,
    (actor) => actor.scanComments(
      `subreddit#${subredditName}#`,
      upperBound,
      BigInt(limit),
      [false] // descending order
    ),
    settledCommentsResultReducer,
    { comments: [], nextKeys: [] }
  )

  return arrangeCommentsInDescendingTimestampOrder(allCanisterQueryResult, limit, getSubredditSK)
}

export async function getCommentsByTimestamp(commentClient: ActorClient<IndexCanister, Comment>, pkDate: Date, skUpperBound?: string) {
  let limit = 10;
  let upperBound = (skUpperBound === "" || skUpperBound === undefined) ? "timestamp#~" : skUpperBound;
  const pk = `comment#${formatDate(pkDate)}`;
  let allCanisterQueryResult = await commentClient.queryReduce<Comment["scanComments"], ReducedCommentResult>(
    pk,
    (actor) => actor.scanComments(
      `timestamp#`,
      upperBound,
      BigInt(limit),
      [false] // descending order
    ),
    settledCommentsResultReducer,
    { comments: [], nextKeys: [] }
  )

  return arrangeCommentsInDescendingTimestampOrder(allCanisterQueryResult, limit, getTimestampSK)
}

export async function getCommentsByScore(commentClient: ActorClient<IndexCanister, Comment>, pkDate: Date, skUpperBound?: string) {
  let limit = 10;
  let upperBound = (skUpperBound === "" || skUpperBound === undefined) ? "score#~" : skUpperBound;
  const pk = `comment#${formatDate(pkDate)}`;
  let allCanisterQueryResult = await commentClient.queryReduce<Comment["scanComments"], ReducedCommentResult>(
    pk,
    (actor) => actor.scanComments(
      `score#`,
      upperBound,
      BigInt(limit),
      [false] // descending order
    ),
    settledCommentsResultReducer,
    { comments: [], nextKeys: [] }
  )

  return arrangeCommentsByScoreAndNextKeys(allCanisterQueryResult, limit)
}

interface AwaitingMetricResult {
  [canisterId: string]: Promise<CanisterMetrics>
}

export interface ReducedMetricsResult {
  [canisterId: string]: CanisterMetrics 
};

async function reduceMetricResults(metricResults: PromiseSettledResult<AwaitingMetricResult>[]): Promise<ReducedMetricsResult> {
  return new Promise<ReducedMetricsResult>(async (resolve, reject) => {
    let result: ReducedMetricsResult = {};
    for (let settledResult of metricResults) {
      if (settledResult.status === 'fulfilled') {
        for (const [k, v] of Object.entries(settledResult.value)) {
          let value = await v;
          result[k] = value;
        }

      } 
    }
    resolve(result)
  })
} 

export async function getCommentCanisterMetrics(commentClient: ActorClient<IndexCanister, Comment>, pk: string) {
  let allCanisterQueryResult = await commentClient.queryWithCanisterIdMapping<Comment["getCanisterMetrics"]>(
    pk,
    (actor) => actor.getCanisterMetrics(),
  );
  console.log("all canister query result", allCanisterQueryResult)
  return reduceMetricResults(allCanisterQueryResult)
}

export async function getPKToCanisterMapping(indexClient: IndexClient<IndexCanister>): Promise<[string, string[]][]> {
  // @ts-ignore weird idl type error
  return indexClient.indexCanisterActor.getPKToCanisterMapping();
};

