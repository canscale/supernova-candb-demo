import * as React from "react"
import { ActorClient } from "candb-client-typescript-dev-testing/dist/ActorClient";
import { Comment } from "../../declarations/comment/comment.did";
import { IndexCanister } from "../../declarations/index/index.did";
import { Button } from "@mui/material";
import { getCommentCanisterMetrics, ReducedMetricsResult } from "../api";
import CanisterMetricsTable from "../components/CanisterMetricsTable";

export interface PKMetrics {
  [pk: string]: ReducedMetricsResult;
}

function CanisterMonitoringPage(
  commentClient: ActorClient<IndexCanister, Comment>,
  pkToCanisterMapping: {[pk: string]: string[]},
) {
  const [pkMetrics, setPKMetrics] = React.useState<PKMetrics>({});

  console.log('pkMetrics', pkMetrics)

  async function updateAllCanisterMetrics() {
    let settledMetrics = await Promise.allSettled(Object.keys(pkToCanisterMapping).map(getMetricsForPK));
    let pkMetrics = settledMetrics.reduce((acc: PKMetrics, settled) => {
      if (settled.status == 'rejected') return acc

      return {
        ...acc,
        ...settled.value
      }
    }, {})
    setPKMetrics(pkMetrics)
  }

  async function getMetricsForPK(pk: string) {
    let canisterIdToMetricsMap = await getCommentCanisterMetrics(commentClient, pk)
    return { [pk]: canisterIdToMetricsMap}
  }

  return (
    <div>
      <h1>Monitor Application Canisters</h1>
      {CanisterMetricsTable(pkMetrics)}
      <Button variant="contained" onClick={updateAllCanisterMetrics}>Get Canister Metrics</Button>
    </div>
  )

}

export default CanisterMonitoringPage;