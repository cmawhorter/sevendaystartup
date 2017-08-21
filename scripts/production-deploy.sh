#!/usr/bin/env bash

SCRIPT_DIR=$( cd "$(dirname "$0")" ; pwd -P )

cd $SCRIPT_DIR/../dist

# all access
echo 'User-agent: *' > ./robots.txt
echo 'Disallow: ' >> ./robots.txt

# catch-all error page
echo 'Page Error' > ./error.html

aws s3 sync . s3://www-sevendaystartup-com-intermediary --delete || { echo 'sync to intermediary failed' ; exit 1; }
node $SCRIPT_DIR/workaround-s3-rename.js www-sevendaystartup-com-intermediary || { echo 'renaming intermediary failed' ; exit 1; }
aws s3 sync s3://www-sevendaystartup-com-intermediary s3://www-sevendaystartup-com --delete || { echo 'sync to live bucket failed' ; exit 1; }

echo 'done'
