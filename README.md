# supernova-candb-demo
This project showcases what a simple multi-canister CanDB might look like.

## About the demo application 
The demo application leverages ["The Reddit Covid Dataset"](https://www.kaggle.com/datasets/pavellexyr/the-reddit-covid-datase) data from Kaggle in tandem with the flexibility of CanDB to provides data access patterns such as:
* get comments by subreddit name ordered by timestamp (i.e. newest posts by subreddit)
* get comments ordered by score (i.e. global top posts)
* get comments ordered by timestamp (i.e. global newest posts)

At the same time, this showcases the power of utilizing NoSQL data modeling similar to what might find with DynamoDB or Cassandra, and the similar power of the CanDB tooling in supporting pagination.


## Data used in this demo project
This demo project uses data taken from https://www.kaggle.com/datasets/pavellexyr/the-reddit-covid-dataset, which contains a comprehensive collection of posts and comments mentioning COVID in the comment body. This data contains additional metadata such as timestamp, score (upvote/downvote), and analyzed sentiment.

Some light preprocessing on the csv data was done in Python to preprocess and chunk the data into csvs of 500 rows each to ensure no limits of the IC are hit in terms of per message size or per message cycle limit; 

## Code Structure 
This project has 3 main pieces, designated by the following folders

1. `backend/` - This houses the code from which the data and apis are created. There are two types of canisters, an index canister, and a comment (Actor) canister.
  a. The index canister is responsible for things like:
    i. keeping track of PK -> canister ids
    ii. spinning up new canisters and auto-scaling existing canisters
    iii. performing rolling upgrades to canisters
  b. The comment canister contains the API logic for retrieving comments and processing new comments
2. `frontend/` - This houses the frontend code from which the demo interacts with the backend, performing requests to retrieve comments from the backend
3. `backfill/` - This houses the code used to chunk uploads to the backend through the `processComments` backend API. Larger applications with existing data models will need to think through and plan out how they will migrate their existing (large amounts of) data to CanDB, so this serves as a very rough, but practical example showcasing that large amounts of data can be backfilled and processed into a working CanDB application.



