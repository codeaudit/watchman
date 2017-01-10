#!/usr/bin/env bash

SHARED_ENV_VARS="API_ROOT=http://172.17.0.1:3003/api NODE_ENV=production ${printenv SHARED_ENV_VARS}"

set -x

# cd ~/apps/
git pull
slc build

# web
SLC_HOST="http://localhost:8701"

slc deploy -z cpus $SLC_HOST
slc ctl -C $SLC_HOST env-set 1 $SHARED_ENV_VARS \
IGNORE_QCR=0
slc ctl -C $SLC_HOST set-size 1 1

# feed
SLC_HOST="http://localhost:8702"

slc deploy -z cpus $SLC_HOST
slc ctl -C $SLC_HOST env-set 1 $SHARED_ENV_VARS \
WORKER_SCRIPT=./workers/start-extractor
slc ctl -C $SLC_HOST set-size 1 1

# queue
SLC_HOST="http://localhost:8703"

slc deploy -z cpus $SLC_HOST
slc ctl -C $SLC_HOST env-set 1 $SHARED_ENV_VARS \
WORKER_SCRIPT=./workers/job-queue \
DEBUG=*job-monitor*
slc ctl -C $SLC_HOST set-size 1 1

# event-finder
SLC_HOST="http://localhost:8704"

slc deploy -z cpus $SLC_HOST
slc ctl -C $SLC_HOST env-set 1 $SHARED_ENV_VARS \
WORKER_SCRIPT=./workers/event-finder \
EVENT_FINDER_INTERVAL_MIN=10 \
KAFKA_URL=r105u05.dsra.local:9092 \
KAFKA_TOPIC=dev.events.social-media \
DEBUG=*event-finder*
slc ctl -C $SLC_HOST set-size 1 1

# job-scheduler
SLC_HOST="http://localhost:8705"

slc deploy -z cpus $SLC_HOST
slc ctl -C $SLC_HOST env-set 1 $SHARED_ENV_VARS \
WORKER_SCRIPT=./workers/job-scheduler \
JOBSET_QUERYSPAN_MIN=5 \
SYSTEM_START_TIME=1481124174000 \
DEBUG=*job-scheduler*
slc ctl -C $SLC_HOST set-size 1 1
