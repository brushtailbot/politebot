'use strict'
var aws = require('aws-sdk')
var responses = require('./responses.json')

// DynamoDb
var docClient = new aws.DynamoDB.DocumentClient({
  region: 'ap-southeast-2'
})

// Lambda
var lambda = new aws.Lambda({
  region: 'ap-southeast-2' // change to your region
})
var POLITE_THRESHOLD = 0.66
var IMPOLITE_THRESHOLD = 0.45
require('dotenv').config({silent: true})

/*
 * isPolite(score) -> returns values based on politeness thresholds
 *   case 'polite' ->
 *   case 'neutral' ->
 *   case 'impolite' ->
 */

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}
function shouldRespond (lastResponseTime, lastResponseSum, sum, scores, resolveAvg) {
  if (!scores.length) return false
  let _scores = scores.map(score => +score.score)
  let avg = _scores.reduce((a, b) => a + b, 0) / scores.length
  console.log(`The average politeness is ${avg} after ${scores.length} comments ${sum} has been posted and brushy last responded at msg ${lastResponseSum}`)
  // have at least two messages
  if (_scores.length < 2) return false
  // Be within the boundaries for average
  if (!resolveAvg(avg)) return false
  // not responded within 3 messages
  if (lastResponseSum + 3 > sum) return false
  // last response not been within 30 seconds
  if (lastResponseTime && lastResponseTime > Date.now() - 1000 * 30) return false
  return true
}
// Core processData method
module.exports.processData = (event, context, cb) => {
  let _records = {}

  event.Records.forEach(function (element) {
    try {
      var team_id = element.dynamodb.NewImage.team_id.S
      var channel_id = element.dynamodb.NewImage.channel_id.S
      var user_id = element.dynamodb.NewImage.user_id.S
      var scores = element.dynamodb.NewImage.scores.L
      var sum = element.dynamodb.NewImage.sum ? +element.dynamodb.NewImage.sum.N : 0
      var lastResponseSum = element.dynamodb.NewImage.lastResponseSum ? +element.dynamodb.NewImage.lastResponseSum.N : 0
      var timestamp = element.dynamodb.NewImage.timestamp ? +element.dynamodb.NewImage.timestamp.N : undefined
    } catch (err) {
      console.log('Unable to Parse New Image', JSON.stringify(event, null, 2))
      return cb()
    }
    try {
      var normalizedScores = scores.map(score => {
        return {
          score: +score.M.score.N,
          timestamp: +score.M.timestamp.N
        }

        // ahould filter all responses under 2 mins
      }).filter(score => (score.timestamp * 1000) > Date.now() - 1000 * 120)
    } catch (err) {
      return cb()
    }
    console.log('About to make decision on slack response')
    if (shouldRespond(timestamp, lastResponseSum, sum, normalizedScores, (avg) => {
      return avg < IMPOLITE_THRESHOLD
    }) && !_records[channel_id + user_id]) {
      _records[channel_id + user_id] = true
      console.log('About to respond Negatively in slack')
      lambda.invoke({
        FunctionName: `brushtail-${process.env.SERVERLESS_STAGE}-toSlack`,
        Payload: JSON.stringify({
          slackCommand: 'chat.postMessage',
          team_id: team_id,
          body: {
            text: `<@${user_id}> ${responses.impolite[getRandomInt(0, responses.polite.length - 1)]}`,
            channel: channel_id,
            link_names: true,
            as_user: false,
            username: 'brushtail'
          }
        }) // pass params
      }, (err, data) => {
        if (err) console.log('There was an error triggering toSlack Lambda', JSON.stringify(data, null, 2))
        else console.log('Successfully called toSlack function')
      })
      let updateLastResponse = {
        TableName: `brushtail-${process.env.SERVERLESS_STAGE}-Aggregate`,
        Key: {
          user_id: user_id,
          channel_id: channel_id
        },
        UpdateExpression: 'set #a = :val1, #b = :val2, #c = :val3',
        ExpressionAttributeNames: {
          '#a': 'scores',
          '#b': 'lastResponseSum',
          '#c': 'timestamp'
        },
        ExpressionAttributeValues: {
          ':val1': [],
          ':val2': sum,
          ':val3': Date.now()
        },
        ReturnValues: 'UPDATED_NEW'
      }
      docClient.update(updateLastResponse, (err, data) => {
        if (err) {
          console.log(JSON.stringify(updateLastResponse))
          console.error('Update of Scores:', JSON.stringify(err, null, 2))
          cb()
        } else {
          console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2))
          cb(null, data)
        }
      })
    } else if (shouldRespond(timestamp, lastResponseSum, sum, normalizedScores, (avg) => avg > POLITE_THRESHOLD)) {
      console.log('About to respond Positively in slack')
      lambda.invoke({
        FunctionName: `brushtail-${process.env.SERVERLESS_STAGE}-toSlack`,
        Payload: JSON.stringify({
          slackCommand: 'chat.postMessage',
          team_id: team_id,
          body: {
            text: `<@${user_id}> ${responses.polite[getRandomInt(0, responses.polite.length - 1)]}`,
            channel: channel_id,
            link_names: true,
            as_user: false,
            username: 'brushtail'
          }
        }) // pass params
      }, (err, data) => {
        if (err) console.log('There was an error triggering toSlack Lambda', JSON.stringify(data, null, 2))
        else console.log('Successfully called toSlack function')
      })
      let updateLastResponse = {
        TableName: `brushtail-${process.env.SERVERLESS_STAGE}-Aggregate`,
        Key: {
          user_id: user_id,
          channel_id: channel_id
        },
        UpdateExpression: 'set #a = :val1, #b = :val2, #c = :val3',
        ExpressionAttributeNames: {
          '#a': 'scores',
          '#b': 'lastResponseSum',
          '#c': 'timestamp'
        },
        ExpressionAttributeValues: {
          ':val1': [],
          ':val2': sum,
          ':val3': Date.now()
        },
        ReturnValues: 'UPDATED_NEW'
      }
      docClient.update(updateLastResponse, (err, data) => {
        if (err) {
          console.log(JSON.stringify(updateLastResponse))
          console.error('Update of Scores:', JSON.stringify(err, null, 2))
          cb()
        } else {
          console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2))
          cb(null, data)
        }
      })
    } else {
      console.log('Not going to respond in slack')
      let updateLastResponse = {
        TableName: `brushtail-${process.env.SERVERLESS_STAGE}-Aggregate`,
        Key: {
          user_id: user_id,
          channel_id: channel_id
        },
        UpdateExpression: 'set #a = :val1',
        ExpressionAttributeNames: {
          '#a': 'scores'
        },
        ExpressionAttributeValues: {
          ':val1': normalizedScores
        },
        ReturnValues: 'UPDATED_NEW'
      }
      docClient.update(updateLastResponse, (err, data) => {
        if (err) {
          console.log(JSON.stringify(updateLastResponse))
          console.error('Update of Scores:', JSON.stringify(err, null, 2))
          cb()
        } else {
          console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2))
          cb(null, data)
        }
      })
    }
  }, this)
}
