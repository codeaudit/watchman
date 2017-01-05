#!/bin/bash
set -x

# cd ~/apps/
git pull
slc build

slc deploy -z cpus http://localhost:8701
slc ctl -C http://localhost:8701 env-set 1 NODE_ENV=production \
API_ROOT=http://172.17.0.1:3003/api IGNORE_QCR=0
slc ctl -C http://localhost:8701 set-size 1 1

slc deploy -z cpus http://localhost:8702
slc ctl -C http://localhost:8702 env-set 1 NODE_ENV=production \
API_ROOT=http://172.17.0.1:3003/api \
WORKER_SCRIPT=./workers/start-extractor
slc ctl -C http://localhost:8702 set-size 1 1

slc deploy -z cpus http://localhost:8703
slc ctl -C http://localhost:8703 env-set 1 NODE_ENV=production \
API_ROOT=http://172.17.0.1:3003/api \
WORKER_SCRIPT=./workers/job-queue \
JOBSET_QUERYSPAN_MIN=30 \
SYSTEM_START_TIME=1481293679000
slc ctl -C http://localhost:8703 set-size 1 1

slc deploy -z cpus http://localhost:8704
slc ctl -C http://localhost:8704 env-set 1 NODE_ENV=production \
API_ROOT=http://172.17.0.1:3003/api \
WORKER_SCRIPT=./workers/event-finder \
EVENT_FINDER_INTERVAL_MIN=300 \
KAFKA_URL=r105u05.dsra.local:9092 \
KAFKA_TOPIC=dev.events.social-media
slc ctl -C http://localhost:8704 set-size 1 1
