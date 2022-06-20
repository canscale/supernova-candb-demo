import { loadWasm } from "candb-client-typescript-dev-testing/dist/ClientUtil";
import { initializeIndexClient } from "../client"


async function go(isLocal: boolean) {
  console.log("isLocal", isLocal)
  const indexClient = await initializeIndexClient(isLocal)
  let userWasmPath = `${process.cwd()}/../backend/.dfx/local/canisters/comment/comment.wasm`;
  let userWasm = loadWasm(userWasmPath);
  const result = await indexClient.indexCanisterActor.upgradeCommentCanistersInPKRange("comment#2021-08-26", "comment#~", userWasm);
  console.log("result", JSON.stringify(result))


  console.log("upgrade complete")
}

go(false)