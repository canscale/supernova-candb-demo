import * as React from "react";

import { initializeCommentClient, intializeIndexClient } from "./client";
import CommentPage from "./pages/CommentPage";
import CanisterMonitoringPage from "./pages/CanisterMonitoringPage";
import { getPKToCanisterMapping } from "./api";
import { Button } from "@mui/material";

function App() {
  const isLocal = false;
  const indexClient = intializeIndexClient(isLocal);
  const commentClient = initializeCommentClient(isLocal, indexClient);

  let [pkToCanisterMapping, setPKToCanisterMapping] = React.useState({});
  let [page, setPage] = React.useState('comments');

  async function fetchMapping() {
    let response = await getPKToCanisterMapping(indexClient)
    let mapping = response.reduce((acc: {[k: string]: string[]}, [pk, cids]) => {
      acc[pk] = cids;
      return acc
    }, {})
    setPKToCanisterMapping(mapping)
  }
  
  function renderHeader() {
    return (
      <div className="app-header">
        <Button variant='text' onClick={() => setPage('comments')}>Comments</Button>
        <Button variant='text' onClick={() => setPage('monitoring')}>Monitoring</Button>
      </div>
    )
  }

  function renderPage() {
    const commentPageClassName = page === 'comments' ? '' : 'hide-me';
    const monitoringPageClassName = page === 'monitoring' ? '' : 'hide-me';
    return (
      <div>
        <div className={commentPageClassName}>{CommentPage(commentClient)}</div>
        <div className={monitoringPageClassName}>{CanisterMonitoringPage(commentClient, pkToCanisterMapping)}</div>
      </div>
    )
  }

  React.useEffect(() => {
    fetchMapping()
  }, [])



  return (
    <div>
      {renderHeader()}
      {renderPage()}
    </div>
  )
}

export default App;