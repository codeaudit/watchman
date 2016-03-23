# Entity Extractor

## Install

```
npm i -g strongloop bower
npm i
# only if models change...
lb-ng server/server.js client/js/lb-services.js
```

## Dev boostrap

```
./script/setup.js
npm run dev # open localhost:3001
docker run -d -p 8888:8888 --name mitie lukewendling/mitie-server
node server/workers/extractor.js
```

## Misc

```
# build mitie-server image
git clone lukewendling/mitie-server
docker build --no-cache --force-rm -t lukewendling/mitie-server .
```
