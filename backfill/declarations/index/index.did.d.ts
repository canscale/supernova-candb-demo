import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface CanisterCleanupStatusMap {
  'stop' : Tree,
  'delete' : Tree,
  'transfer' : Tree,
}
export type CanisterId = string;
export type Color = { 'B' : null } |
  { 'R' : null };
export interface IndexCanister {
  'createAdditionalCanisterForPK' : ActorMethod<[string], string>,
  'createCommentCanisterByPK' : ActorMethod<[string], [] | [string]>,
  'deleteCommentsByPK' : ActorMethod<[string], [] | [CanisterCleanupStatusMap]>,
  'getCanistersByPK' : ActorMethod<[string], Array<string>>,
  'getPKToCanisterMapping' : ActorMethod<
    [],
    Array<[string, Array<CanisterId>]>,
  >,
  'upgradeCommentCanisters' : ActorMethod<
    [string, Array<number>],
    Array<[string, InterCanisterActionResult]>,
  >,
  'upgradeCommentCanistersInPKRange' : ActorMethod<
    [string, string, Array<number>],
    UpgradePKRangeResult,
  >,
}
export type InterCanisterActionResult = { 'ok' : null } |
  { 'err' : string };
export type Tree = { 'leaf' : null } |
  { 'node' : [Color, Tree, [string, [] | [InterCanisterActionResult]], Tree] };
export interface UpgradePKRangeResult {
  'nextKey' : [] | [string],
  'upgradeCanisterResults' : Array<[string, InterCanisterActionResult]>,
}
export interface _SERVICE extends IndexCanister {}
