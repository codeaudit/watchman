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
cd mitie && docker build --no-cache --force-rm -t mitie-server .
docker run -d -p 8888:8888 --name mitie mitie-server
node server/workers/extractor.js
```
