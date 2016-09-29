'use strict'
var aws = require('aws-sdk')
var docClient = new aws.DynamoDB.DocumentClient({
  region: 'ap-southeast-2'
})
require('dotenv').config({silent: true})
module.exports.processData = (event, context, cb) => {
  let records = event.Records.filter((record) => {
    return record.eventName === 'MODIFY'
  }).filter(record => record.dynamodb.NewImage.score)
  if (records.length < 1) return
  records.forEach(record => {
    console.log(record.dynamodb.NewImage);
    var userId 
    var teamId 
    var channelId 
    var timestamp 
    var score 
    try {
       userId = record.dynamodb.NewImage.user_id.S
       teamId = record.dynamodb.NewImage.team_id.S
       channelId = record.dynamodb.NewImage.channel_id.S
       timestamp = record.dynamodb.NewImage.timestamp.N
       score = record.dynamodb.NewImage.score.N
    } catch (err) {
      console.log('There was a problem accessing record attributes')
      return cb(err)
    }
    
    console.log(`Updataing Record for User ${userId} in channel ${channelId} with score ${score}`)
    let params = {
      TableName: `brushtail-${process.env.SERVERLESS_STAGE}-Aggregate`,
      Key: {
        user_id: userId,
        channel_id: channelId
      },
      UpdateExpression: 'add  #a :val1 set #b = list_append(if_not_exists(#b, :val3), :val2), #c = :val4',
      ExpressionAttributeNames: {
        '#a': 'sum',
        '#b': 'scores',
        '#c': 'team_id'
      },
      ExpressionAttributeValues: {
        ':val1': 1,
        ':val2': [{score: +score, timestamp: +timestamp}],
        ':val3': [],
        ':val4': teamId
      },
      ReturnValues: 'UPDATED_NEW'
    }
    docClient.update(params, (err, data) => {
      if (err) {
        console.log(params)
        console.error('1. Unable to update item. Error JSON:', JSON.stringify(err, null, 2))
      } else {
        console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2))
      }
      let averageUpdate = {
        TableName: `brushtail-${process.env.SERVERLESS_STAGE}-Aggregate`,
        Key: {
          user_id: userId,
          channel_id: channelId
        },
        UpdateExpression: 'set #a = :val1 remove #b[0]',
        ConditionExpression: 'size(#b) > :val0',
        ExpressionAttributeNames: {
          '#a': 'avg',
          '#b': 'scores'
        },
        ExpressionAttributeValues: {
          ':val0': 10,
          ':val1': data.Attributes.scores.slice(-10).map(a => a.score).reduce((a, b) => +a + +b, 0) / data.Attributes.scores.length
        },
        ReturnValues: 'UPDATED_NEW'
      }
      docClient.update(averageUpdate, (err, data) => {
        if (err) {
          console.log(JSON.stringify(averageUpdate));
          console.error('2. Unable to update item. Error JSON:', JSON.stringify(err, null, 2))
          cb()
        } else {
          console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2))
          cb(null, data)
        }
      })
    })
  })
}
