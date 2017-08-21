#!/usr/bin/env bash

SCRIPT_DIR=$( cd "$(dirname "$0")" ; pwd -P )

cd $SCRIPT_DIR/..

rm -fr ./.fancy
NODE_ENV=production node ./node_modules/.bin/fancy build -vvvv --compile --target s3 --output ./dist --stripquerystring --content ./content --assets ./assets --globals $SCRIPT_DIR/../data/globals.json

exit $?
