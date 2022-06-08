# candb-quickstart-template
Getting up and running with a multi-canister CanDB Backend project

## Getting up and running

1. First, clone this repo
2. Every CanDB project must have an Index Canister. To create one, inside the cloned repo run `npm run generate` and select "Create CanDB IndexCanister Actor Canister From Template", then continue through the prompts. You should now see a `src/index/IndexCanister.mo` file.
3. The Index Canister will help facilitate the spin-up and creation of canisters from a CanDB Actor. To create the bare minimum Actor that will work with CanDB, run `npm run generate` again, and then select "Create CanDB Actor Canister From Template". Fill in the `{{actor_class_name}}` of your actor, for example `User`, `Player`, or `Game`, and then continue through the prompts. You should now see a `src/{{actor_class_name}}/{{actor_class_name}}.mo` file.


TODO: 
- Next steps, example Hello World project & more complicated examples, etc.
- Decide whether this should go in the root CanDB package or be in a separate quickstart package like this (i.e. create-react-app style)


