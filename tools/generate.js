const { generateTemplateFiles, CaseConverterEnum } = require('generate-template-files');

// const config = require('../package.json');

generateTemplateFiles([
  {
    option: 'Create CanDB Actor Canister From Template',
    defaultCase: CaseConverterEnum.PascalCase,
    entry: {
      folderPath: './tools/templates/ActorCanister.mo',
    },
    stringReplacers: ['{{actor_class_name}}' ],
    output: {
      path: './src/{{actor_class_name}}(lowerCase)/{{actor_class_name}}.mo',
      pathAndFileNameDefaultCase: CaseConverterEnum.PascalCase,
    },
    onComplete: (results) => { console.log("results", results) }
  },
  {
    option: 'Create CanDB IndexCanister Actor Canister From Template',
    defaultCase: CaseConverterEnum.PascalCase,
    entry: {
      folderPath: './tools/templates/IndexCanister.mo',
    },
    dynamicReplacers: [{ slot: '{{name}}', slotValue: 'IndexCanister'}],
    output: {
      path: './src/index/IndexCanister.mo',
    },
    onComplete: (results) => { console.log("results", results) }
  },
]);