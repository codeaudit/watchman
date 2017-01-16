#!/bin/bash

if [ -z "$1" ]; then
  echo "missing arg: docker-compose filename"
  exit 1
fi
if [ -z "$2" ]; then
  echo "missing arg: script path"
  exit 1
fi

set -x

docker-compose -f $1 exec master spark-submit \
--packages org.mongodb.spark:mongo-spark-connector_2.11:2.0.0 \
/app/$2
