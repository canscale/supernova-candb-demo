import { Comment } from "../../declarations/comment/comment.did"
import { formatRowsFromFile } from "./loader";
import * as glob from "glob";
import { initializeCommentClient, initializeIndexClient } from "../client";

async function getDatedDirectories() {
  let datedDirectories = await new Promise<string[]>((resolve, reject) => {
    glob.glob("chunks" + "/*/", function(err, res) {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  });
  console.log("datedDirectories", datedDirectories)
  return datedDirectories;
};

async function getFilesInDirectory(datedDirectory: string) {
  let filesInDirectory = await new Promise<string[]>((resolve, reject) => {
    glob.glob(datedDirectory + "*.csv", function(err, res) {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  });
  console.log(`directory ${datedDirectory} has files:`, filesInDirectory)
  return filesInDirectory;
}


async function go(isLocal: boolean) {
  const indexClient = await initializeIndexClient(isLocal)

  console.log("isLocal", isLocal)
  console.log("test pk", await indexClient.getCanistersForPK("test"))

  let commentActorClient = await initializeCommentClient(isLocal, indexClient);

  let datedDirectories = await getDatedDirectories(); 
  // If want to load all csvs from the same process
  // for (let i=0; i<datedDirectories.length; i+=1) {

  // I would manually update/change the "i" start/stop to have a process load 5 days of csvs into the application
  for (let i=80; i<85; i+=1) {
    const datedDirectory = datedDirectories[i]
    console.log(`i=${i}, datedDirectory`, datedDirectory)
    const pk = `comment#${datedDirectory.split("/")[1]}`;
    const files = await getFilesInDirectory(datedDirectory);
    const createdCommentCanisterForDatePK = await indexClient.indexCanisterActor.createCommentCanisterByPK(pk);
    console.log(`For pk=${pk}, canisterId=${createdCommentCanisterForDatePK}`)
    for (let j=0; j<files.length; j+=1) {
      const filePath = files[j];
      console.log(`j=${j}, formatting and uploading ${filePath}`)
      const rows = await formatRowsFromFile(filePath)
      console.log(`rows.length = ${rows.length}`)
      await commentActorClient.update<Comment["processComments"]>(
        pk,
        "TODO",
        (actor) => actor.processComments(rows)
      );
      console.log(`finished uploading ${filePath}`)
    }
  }
};

go(false)
