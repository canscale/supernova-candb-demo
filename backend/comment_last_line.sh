for f in src/declarations/*/index.js; do \
  sed -i '' -e '$s/^/\/\//' "$f"; \
done