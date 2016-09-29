# BrushTail
[![AppVeyor](https://img.shields.io/appveyor/ci/gruntjs/grunt.svg?maxAge=2592000?style=flat-square)]()
[![Codecov branch](https://img.shields.io/codecov/c/github/codecov/example-python/master.svg?maxAge=2592000?style=flat-square)]()
[![PyPI](https://img.shields.io/pypi/dw/Django.svg?maxAge=2592000?style=flat-square)]()
[![](https://img.shields.io/badge/awesome%3F-yes-red.svg)][vote]
[![](https://img.shields.io/badge/documentation-etc-red.svg?style=flat-square)][doc]

[travis]: https://travis-ci.org/b4b4r07/dotfiles
[license]: ./doc/LICENSE-MIT.txt
[platform]: ./doc/OS_X.md
[vote]: https://voting-badge.herokuapp.com/vote?url=https://github.com/b4b4r07/dotfiles
[doc]: ./etc/README.md
[bitdeli]: https://bitdeli.com/free
[dotfiles]: http://b4b4r07.com/dotfiles
<p align="center">
<a name="top" href="http://www.nextfaze.com"><img src="http://stylecampaign.com/blog/blogimages/SVG/fox.svg"></a>
</p>

<p align="center">
<b><a href="https://drive.google.com/a/nextfaze.com/file/d/0B22Pt-mTDOHMZmpVUW9GdUtzZ1U/view?usp=sharing">Graph</a></b>
|
<b><a href="#deploying">Deploying</a></b>
|
<b><a href="#invoking">Invoking</a></b>
|
<b><a href="#logging">Logging</a></b>
|
<b><a href="#dynamo">Dynamo</a></b>
|
<b><a href="#communication">Communication</a></b>
|
<b><a href="#team">Team</a></b>
</p>

## Overview

The slackbot to end all slackbots

## deploying

    sls deploy -s prod
    
## invoking

    sls invoke -f toSlack -s prod -p ./toSlack.json
    
## logging

Either in the AWS console or

    sls logs -f toFoxType -s prod
    
## Dynamo

Communicate with dynamo via the AWS-dynamo module

See: https://www.npmjs.com/package/dynamodb

    'use strict';
    
    var doc = require('dynamodb-doc');
    var dynamo = new doc.DynamoDB();
    
    // Require Serverless ENV vars
    var ServerlessHelpers = require('serverless-helpers-js').loadEnv();
    
    // Require Logic
    var lib = require('../lib');
    
    // Lambda Handler
    module.exports.handler = function(event, context) {
      console.log('Received event:',JSON.stringify(event,null,2));
      console.log('Context:',JSON.stringify(context,null,2));
    
      var operation = event.operation;
      if(event.tableName) {
        event.payload.TableName = event.tableName;
      }
    
      switch(operation) {
        case 'create':
          var uuid = require('node-uuid');
          event.payload.Item.postId = uuid.v1();
          dynamo.putItem(event.payload,context.succeed({"postId":event.payload.Item.postId}));
          break;
        case 'read':
          dynamo.getItem(event.payload,context.done);
          break;
        case 'update':
          dynamo.updateItem(event.payload, context.done);
          break;
        case 'delete':
          dynamo.deleteItem(event.payload, context.done);
          break;
        case 'list':
            dynamo.scan(event.payload, context.done);
            break;
        default:
            context.fail(new Error('Unrecognized operation "' + operation + '"'));
      }
    
    };
    
More: https://gist.github.com/apaatsio/f9f2b408fe02e415629f
https://github.com/markusklems/serverless-node-dynamodb-example
    
## Communication

### AWS API

    var aws = require('aws-sdk');
    var lambda = new aws.Lambda({
        region: 'ap-southeast-2' //change to your region
    });
    
    lambda.invoke({
        FunctionName: 'toSlack',
        Payload: JSON.stringify(event, null, 2) // pass params
    }, function (error, data) {
        if (error) {
            cb(error);
            // context.done('error', error);
        }
        if (data.Payload) {
            cb(null, data.Payload);
            // context.succeed(data.Payload)
        }
    });


### Html

Expose endpoint in function

      - http:
          path: message/send
          method: post
          cors: true

### SQS

No idea


## Team

[<img alt="henry" src="https://avatar-cdn.atlassian.com/default/96" width="117">](https://www.google.com) |[<img alt="paul" src="https://avatar-cdn.atlassian.com/default/96" width="117">](https://www.google.com) |[<img alt="james" src="https://bitbucket-assetroot.s3.amazonaws.com/c/photos/2015/Jul/21/1981462265-5-sidewaiise-avatar.png" width="117">](https://www.google.com)
:---: |:---: |:---: |:---: |:---: |:---: |
[Henry Stevens](https://www.google.com) |[Paul Robinson](https://www.google.com) |[James Limmer](https://www.google.com) 