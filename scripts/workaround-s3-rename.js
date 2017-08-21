'use strict';

if (!process.argv[2]) throw new Error('Must pass bucket as argument');

var options = {
  target: '.',
  bucket: process.argv[2],
  region: process.env.AWS_DEFAULT_REGION,
  key: process.env.AWS_ACCESS_KEY_ID,
  secret: process.env.AWS_SECRET_ACCESS_KEY,
  bucketPrefix: '',
  remove: true,
  concurrency: 12,
};

console.log('Starting with key %s...', options.key);

var http = require('http')
  , https = require('https');

var AWS = require('aws-sdk')
  , async = require('async');

http.globalAgent.maxSockets = https.globalAgent.maxSockets = 64;
AWS.config.update({ accessKeyId: options.key, secretAccessKey: options.secret, region: options.region });

AWS.events.on('httpError', function() {
  if (this.response.error && this.response.error.code === 'UnknownEndpoint') {
    this.response.error.retryable = true;
  }
});

var s3 = new AWS.S3();

function getMimeType(prefix) {
  var ext = prefix.split('.').pop();
  switch (ext.toLowerCase()) {
    default:
    case 'html':
    case 'aspx':
      return 'text/html';
    case 'js':
      return 'application/javascript';
    case 'json':
      return 'application/json';
    case 'zip':
      return 'application/zip';
    case 'pdf':
      return 'application/pdf';
  }
  return;
}

function renameObject(prefix, callback) {
  var renamedPrefix = prefix.replace('.collision.', '');
  var mimeType = getMimeType(prefix);
  console.log('renameObject %s -> %s; mime = %s', prefix, renamedPrefix, mimeType);
  var params = {
    Bucket: options.bucket,
    CopySource: options.bucket + '/' + prefix,
    Key: renamedPrefix,
    MetadataDirective: 'REPLACE',
  };
  if (mimeType) {
    params.ContentType = mimeType;
  }
  console.log('copyObject params', params);
  s3.copyObject(params, function(err, data) {
    if (err) return callback(err);
    console.log('\t-> copied (%s)', prefix);
    s3.deleteObject({
      Bucket: options.bucket,
      Key: prefix,
    }, function(err, data) {
      if (err) return callback(err);
      console.log('\t-> removed (%s)', prefix);
      callback();
    });
  });
}

function collisionsOnly(el) {
  return el.split('/').pop().indexOf('.collision.') === 0;
}

function renameAll(prefix) {
  return async.apply(renameObject, prefix);
}

var allKeys = [];
var listAllKeys = function listAllKeys(marker, cb) {
  s3.listObjects({ Bucket: options.bucket, Marker: marker }, function(err, data) {
    if (err) {
      return cb(err);
    }
    Array.prototype.push.apply(allKeys, data.Contents.map(function(el) {
      return el.Key;
    }));
    if(data.IsTruncated) {
      listAllKeys(data.Contents.slice(-1)[0].Key, cb);
    }
    else {
      cb();
    }
  });
};
listAllKeys(options.bucketPrefix, function(err) {
  if (err) {
    return callback(err);
  }
  async.parallelLimit(allKeys.filter(collisionsOnly).map(renameAll), 12, function(err) {
   if (err) throw err;
   console.log('done!');
   process.exit();
  });
});
