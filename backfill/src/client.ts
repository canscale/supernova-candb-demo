import { IndexClient } from "candb-client-typescript-dev-testing/dist/IndexClient";
import { ActorClient } from "candb-client-typescript-dev-testing/dist/ActorClient";

import { idlFactory as IndexCanisterIDL } from "../declarations/index/index";
import { idlFactory as CommentCanisterIDL } from "../declarations/comment/index";
import { IndexCanister } from "../declarations/index/index.did";
import { Comment } from "../declarations/comment/comment.did";
import { identityFromSeed } from "candb-client-typescript-dev-testing/dist/ClientUtil";
import { homedir } from "os";

const yourLocalIndexCanister = '...your local index canister'
const yourICIndexCanister = '...your ic index canister'

export async function initializeIndexClient(isLocal: boolean): Promise<IndexClient<IndexCanister>> {
  const host = isLocal ? "http://127.0.0.1:8000" : "https://ic0.app";
  const canisterId = isLocal ? yourLocalIndexCanister : yourICIndexCanister;
  return new IndexClient<IndexCanister>({
    IDL: IndexCanisterIDL,
    canisterId, 
    agentOptions: {
      host,
      identity: await identityFromSeed(
        // will throw an error here until the path to your seed is inserted
        // how to set up a local identity with seed https://forum.dfinity.org/t/using-dfinity-agent-in-node-js/6169/50?u=icme
        `${homedir}...your seed path here`,
      ),
    },
  })
};

export async function initializeCommentClient(isLocal: boolean, indexClient: IndexClient<IndexCanister>): Promise<ActorClient<IndexCanister, Comment>> {
  const host = isLocal ? "http://127.0.0.1:8000" : "https://ic0.app";
  return new ActorClient<IndexCanister, Comment>({
    actorOptions: {
      IDL: CommentCanisterIDL,
      agentOptions: {
        host,
        identity: await identityFromSeed(
          // will throw an error here until the path to your seed is inserted
          // how to set up a local identity with seed https://forum.dfinity.org/t/using-dfinity-agent-in-node-js/6169/50?u=icme
          `${homedir}...your seed path here`,
        ),
      }
    },
    indexClient, 
  })
};