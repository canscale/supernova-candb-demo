import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface CanisterMetrics {
  'heapSize' : bigint,
  'cycles' : bigint,
  'entityCount' : bigint,
  'scalingStatus' : { 'started' : null } |
    { 'complete' : null } |
    { 'not_started' : null },
}
export interface Comment {
  'getCanisterMetrics' : ActorMethod<[], CanisterMetrics>,
  'getPK' : ActorMethod<[], string>,
  'getScalingOptions' : ActorMethod<[], ScalingOptions>,
  'processComments' : ActorMethod<[Array<CommentRequestInput>], undefined>,
  'scanComments' : ActorMethod<
    [string, string, bigint, [] | [boolean]],
    ScanCommentResult
  >,
  'skExists' : ActorMethod<[string], boolean>,
  'transferCycles' : ActorMethod<[], undefined>,
}
export interface CommentRequestInput {
  'permalink' : string,
  'commentId' : string,
  'subredditName' : string,
  'subredditId' : string,
  'body' : string,
  'sentiment' : number,
  'lexicographicScore' : string,
  'createdUTC' : string,
  'score' : bigint,
  'isoString' : string,
  'rowNumber' : string,
}
export interface CommentResult {
  'permalink' : string,
  'commentId' : string,
  'subredditName' : string,
  'subredditId' : string,
  'body' : string,
  'sentiment' : number,
  'createdUTC' : string,
  'score' : bigint,
  'rowNumber' : string,
}
export type ScalingLimitType = { 'heapSize' : null } |
  { 'count' : null };
export interface ScalingOptions {
  'limitType' : ScalingLimitType,
  'limit' : bigint,
  'autoScalingCanisterId' : string,
}
export interface ScanCommentResult {
  'nextKey' : [] | [string],
  'comments' : Array<CommentResult>,
}
export interface _SERVICE extends Comment {}
