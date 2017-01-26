#! /usr/bin/env bash

set -x

script/deploy/compose exec mongo mongo rancor --eval "db.dropDatabase()"
