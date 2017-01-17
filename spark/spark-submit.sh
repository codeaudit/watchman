#!/usr/bin/env bash

# exit immediately on error
abort() {
  exit 1
}
trap abort ERR

if [ -z "$1" ]; then
  echo "missing arg: script name"
  exit 1
fi

compose_files="-f spark/docker-compose.yml"

# append overrides.yml file if present, for prod or dev conf.
if [ -f spark/docker-compose.override.yml ]; then
  compose_files=$compose_files" -f spark/docker-compose.override.yml"
fi
echo "⇨ Using conf flags: $compose_files"

set -x

docker-compose $compose_files up -d

docker-compose $compose_files exec master spark-submit \
--packages org.mongodb.spark:mongo-spark-connector_2.11:2.0.0 \
/app/$1
