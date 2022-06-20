export const idlFactory = ({ IDL }) => {
  const ScalingLimitType = IDL.Variant({
    'heapSize' : IDL.Null,
    'count' : IDL.Null,
  });
  const ScalingOptions = IDL.Record({
    'limitType' : ScalingLimitType,
    'limit' : IDL.Nat,
    'autoScalingCanisterId' : IDL.Text,
  });
  const CanisterMetrics = IDL.Record({
    'heapSize' : IDL.Nat,
    'cycles' : IDL.Nat,
    'entityCount' : IDL.Nat,
    'scalingStatus' : IDL.Variant({
      'started' : IDL.Null,
      'complete' : IDL.Null,
      'not_started' : IDL.Null,
    }),
  });
  const CommentRequestInput = IDL.Record({
    'permalink' : IDL.Text,
    'commentId' : IDL.Text,
    'subredditName' : IDL.Text,
    'subredditId' : IDL.Text,
    'body' : IDL.Text,
    'sentiment' : IDL.Float64,
    'lexicographicScore' : IDL.Text,
    'createdUTC' : IDL.Text,
    'score' : IDL.Int,
    'isoString' : IDL.Text,
    'rowNumber' : IDL.Text,
  });
  const CommentResult = IDL.Record({
    'permalink' : IDL.Text,
    'commentId' : IDL.Text,
    'subredditName' : IDL.Text,
    'subredditId' : IDL.Text,
    'body' : IDL.Text,
    'sentiment' : IDL.Float64,
    'createdUTC' : IDL.Text,
    'score' : IDL.Int,
    'rowNumber' : IDL.Text,
  });
  const ScanCommentResult = IDL.Record({
    'nextKey' : IDL.Opt(IDL.Text),
    'comments' : IDL.Vec(CommentResult),
  });
  const Comment = IDL.Service({
    'getCanisterMetrics' : IDL.Func([], [CanisterMetrics], ['query']),
    'getPK' : IDL.Func([], [IDL.Text], ['query']),
    'getScalingOptions' : IDL.Func([], [ScalingOptions], ['query']),
    'processComments' : IDL.Func([IDL.Vec(CommentRequestInput)], [], []),
    'scanComments' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat, IDL.Opt(IDL.Bool)],
        [ScanCommentResult],
        ['query'],
      ),
    'skExists' : IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'transferCycles' : IDL.Func([], [], []),
  });
  return Comment;
};
export const init = ({ IDL }) => {
  const ScalingLimitType = IDL.Variant({
    'heapSize' : IDL.Null,
    'count' : IDL.Null,
  });
  const ScalingOptions = IDL.Record({
    'limitType' : ScalingLimitType,
    'limit' : IDL.Nat,
    'autoScalingCanisterId' : IDL.Text,
  });
  return [
    IDL.Record({ 'scalingOptions' : ScalingOptions, 'primaryKey' : IDL.Text }),
  ];
};
