export const idlFactory = ({ IDL }) => {
  const Tree = IDL.Rec();
  const Color = IDL.Variant({ 'B' : IDL.Null, 'R' : IDL.Null });
  const InterCanisterActionResult = IDL.Variant({
    'ok' : IDL.Null,
    'err' : IDL.Text,
  });
  Tree.fill(
    IDL.Variant({
      'leaf' : IDL.Null,
      'node' : IDL.Tuple(
        Color,
        Tree,
        IDL.Tuple(IDL.Text, IDL.Opt(InterCanisterActionResult)),
        Tree,
      ),
    })
  );
  const CanisterCleanupStatusMap = IDL.Record({
    'stop' : Tree,
    'delete' : Tree,
    'transfer' : Tree,
  });
  const CanisterId = IDL.Text;
  const UpgradePKRangeResult = IDL.Record({
    'nextKey' : IDL.Opt(IDL.Text),
    'upgradeCanisterResults' : IDL.Vec(
      IDL.Tuple(IDL.Text, InterCanisterActionResult)
    ),
  });
  const IndexCanister = IDL.Service({
    'createAdditionalCanisterForPK' : IDL.Func([IDL.Text], [IDL.Text], []),
    'createCommentCanisterByPK' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], []),
    'deleteCommentsByPK' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(CanisterCleanupStatusMap)],
        [],
      ),
    'getCanistersByPK' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    'getPKToCanisterMapping' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Vec(CanisterId)))],
        ['query'],
      ),
    'upgradeCommentCanisters' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Nat8)],
        [IDL.Vec(IDL.Tuple(IDL.Text, InterCanisterActionResult))],
        [],
      ),
    'upgradeCommentCanistersInPKRange' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Vec(IDL.Nat8)],
        [UpgradePKRangeResult],
        [],
      ),
  });
  return IndexCanister;
};
export const init = ({ IDL }) => { return []; };
