#!/usr/bin/env bash

SCRIPT_DIR=$( cd "$(dirname "$0")" ; pwd -P )

rm -fr ./.fancy
node ./node_modules/.bin/fancy serve -vvvv --stripquerystring --content ./content --assets ./assets

exit $?
