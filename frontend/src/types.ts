
export interface CommentResult {
  permalink: string;
  commentId: string;
  subredditName: string;
  subredditId: string;
  body: string;
  sentiment: number;
  createdUTC: string;
  score: bigint,
  rowNumber: string;
}