#!/usr/bin/env bash

# from root
nohup node server/workers/collector.js &
nohup node server/workers/extractor.js &

tail -f nohup.out
