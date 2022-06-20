import { IndexClient } from "candb-client-typescript-dev-testing/dist/IndexClient";
import { ActorClient } from "candb-client-typescript-dev-testing/dist/ActorClient";

import { idlFactory as IndexCanisterIDL } from "../declarations/index/index";
import { idlFactory as CommentCanisterIDL } from "../declarations/comment/index";
import { IndexCanister } from "../declarations/index/index.did";
import { Comment } from "../declarations/comment/comment.did";


export function intializeIndexClient(isLocal: boolean): IndexClient<IndexCanister> {
  const host = isLocal ? "http://127.0.0.1:8000" : "https://ic0.app";
  const canisterId = isLocal ? "rdmx6-jaaaa-aaaaa-aaadq-cai" : "t2vql-eyaaa-aaaan-qajma-cai";
  return new IndexClient<IndexCanister>({
    IDL: IndexCanisterIDL,
    canisterId, 
    agentOptions: {
      host,
    },
  })
};

export function initializeCommentClient(isLocal: boolean, indexClient: IndexClient<IndexCanister>): ActorClient<IndexCanister, Comment> {
  const host = isLocal ? "http://127.0.0.1:8000" : "https://ic0.app";
  return new ActorClient<IndexCanister, Comment>({
    actorOptions: {
      IDL: CommentCanisterIDL,
      agentOptions: {
        host,
      }
    },
    indexClient, 
  })
};