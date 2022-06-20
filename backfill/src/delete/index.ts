import { CanisterCleanupStatusMap, Color, InterCanisterActionResult, Tree } from "../../declarations/index/index.did";
import { initializeIndexClient } from "../client";


function parseTree(tree: Tree, step: string) {
  const t = tree as { 'node' : [Color, Tree, [string, [] | [InterCanisterActionResult]], Tree] };

  try {
    console.log(`trying to parse tree for ${step}`, t)
    console.log("t['node']", t.node)
    console.log("t['node'][2]", t.node[2])
    console.log("JSON.stringify(t['node'][2])", JSON.stringify(t.node[2]))
  } catch(err) {
    console.log("err parsing tree", t);
  }
}
async function go(isLocal: boolean) {
  const indexClient = await initializeIndexClient(isLocal)

  const commentPKToDelete = "comment#2021-07-14";
  console.log("before deleting comment canister")
  const deleteStatusResult = (await indexClient.indexCanisterActor.deleteCommentsByPK(commentPKToDelete)) as CanisterCleanupStatusMap[];
  try {
    console.log("deleteStatusResult", deleteStatusResult)
    //@ts-ignore
    console.log("deleteStatusResult.transfer", deleteStatusResult[0].transfer)
    //@ts-ignore
    console.log("deleteStatusResult.stop", deleteStatusResult[0].stop)
    //@ts-ignore
    console.log("deleteStatusResult.delete", deleteStatusResult[0].delete)
  } catch (err) {
    console.log("logging err", err)
  }

  try {
    console.log("stringified status result", JSON.stringify(deleteStatusResult))
    parseTree(deleteStatusResult[0].transfer, "transfer")
    parseTree(deleteStatusResult[0].stop, "stop")
    parseTree(deleteStatusResult[0].delete, "delete")
  } catch(err) {
    console.log("stringify err", err)
  }

  console.log("done deleting comment canister")
}

go(true)