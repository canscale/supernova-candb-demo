import { loadWasm } from "candb-client-typescript-dev-testing/dist/ClientUtil";
import { initializeIndexClient } from "../client"

/** Script for performing rolling upgrades for all canisters in a partition key range - see the go() method */

async function go(isLocal: boolean) {
  console.log("isLocal", isLocal)
  const indexClient = await initializeIndexClient(isLocal)
  let commentWasmPath = `${process.cwd()}/../backend/.dfx/local/canisters/comment/comment.wasm`;
  let commentWasm = loadWasm(commentWasmPath);
  let nextKey = "comment#2021-07-14";
  while (nextKey != null) {
    const result = await indexClient.indexCanisterActor.upgradeCommentCanistersInPKRange(nextKey, "comment#~", commentWasm);
    console.log(result, JSON.stringify(result));
    // @ts-ignore
    nextKey = result["nextKey"]?.[0];
  }

  console.log("upgrade complete")
}

go(true)