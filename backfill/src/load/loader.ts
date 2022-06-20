import * as fs from "fs";
import * as path from "path";
import * as csv from 'fast-csv';

import { pack } from './lexigraphic-encoding'


interface CommentCsvRow {
  '': string;
  id: string;
  'subreddit.id': string;
  'subreddit.name': string;
  created_utc: string;
  body: string;
  permalink: string;
  sentiment: string;
  score: string;
};

interface CommentDataRow {
  rowNumber: string;
  commentId: string;
  subredditId: string;
  subredditName: string;
  createdUTC: string;
  isoString: string;
  body: string;
  permalink: string;
  sentiment: number;
  score: bigint;
  lexicographicScore: string;

}

function formatRow(row: CommentCsvRow): CommentDataRow {
  let lexicographicScore = pack(Number(row.score), 'hex') as string;
  let isoString;
  try {
    isoString = new Date(Number(row.created_utc)*1000).toISOString();
  } catch(err) {
    console.error(`row has invalid datetime - row:`, row);
  }
  return {
    rowNumber: row[''],
    commentId: row.id,
    subredditId: row["subreddit.id"],
    subredditName: row["subreddit.name"],
    createdUTC: row.created_utc,
    isoString: isoString === undefined ? "invalid" : isoString,
    body: row.body,
    permalink: row.permalink,
    sentiment: Number(row.sentiment),
    score: BigInt(row.score),
    lexicographicScore,
  }
}


export async function formatRowsFromFile(csvFileName: string) {
  const rows: CommentDataRow[] = [];
  const stream = new Promise<CommentDataRow[]>(function(resolve, reject) {
    fs.createReadStream(path.resolve(__dirname, '../../', csvFileName))
    .pipe(csv.parse({ headers: true }))
    .on('error', (error) => {
      console.error(error)
      reject(error)
    })
    .on('data', (row) => {
      if (row.rowCount === 1) console.log("row", row)
      if (row.isoString !== "invalid") {
        rows.push(formatRow(row))
      }
    })
    .on('end', (rowCount: number) => {
      console.log(`Parsed ${rowCount} rows`)
      console.log("done!")
      resolve(rows)
    })
  })
  return stream
}