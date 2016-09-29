'use strict'
var aws = require('aws-sdk');
var responses = require('./responses.json');

// DynamoDb
var docClient = new aws.DynamoDB.DocumentClient({
  region: 'ap-southeast-2'
})

// Lambda
var lambda = new aws.Lambda({
  region: 'ap-southeast-2' // change to your region
})

require('dotenv').config({silent: true})

/*
 * isPolite(score) -> returns values based on politeness thresholds
 *   case 'polite' ->
 *   case 'neutral' ->
 *   case 'impolite' ->
 */

function isPolite (score) {
  let highWater = 0.66
  let lowWater = 0.33

  return score > highWater ? 'polite' : lowWater > score ? 'impolite' : 'neutral'
}
function getRandomInt (min, max) {
  return Math.random() * (max - min) + min
}

// Core processData method
module.exports.processData = (event, context, cb) => {
  console.log(JSON.stringify(event))
  event.Records.forEach(function (element) {
    console.log(JSON.stringify(element.dynamodb.NewImage, null, 2))

    if (
      element.dynamodb.NewImage && element.dynamodb.NewImage.avg &&  element.dynamodb.NewImage.sum.N > 10 &&
      (
        isPolite(element.dynamodb.NewImage.avg.N) === 'impolite' ? true : 
          isPolite(element.dynamodb.NewImage.avg.N) === 'polite' ? true : false
      )
    ) {
      console.log('--- We are now sending a response... --- ')
      console.log(element.dynamodb.NewImage.avg.N)

      let team_id = element.dynamodb.NewImage.team_id.S
      let channel_id = element.dynamodb.NewImage.channel_id.S
      let user_id = element.dynamodb.NewImage.user_id.S
      
      // Get the possible respones
      let politenessType = isPolite(element.dynamodb.NewImage.avg.N)
      console.log(politenessType);
      let politenessOptions = responses.politeness[politenessType]
      console.log(politenessOptions)
      let randomInt = Math.round(getRandomInt(0, politenessOptions.length - 1))
      console.log(randomInt)
    
      // Invoke Lambda - post message
      lambda.invoke({
        FunctionName: `brushtail-${process.env.SERVERLESS_STAGE}-toSlack`,
        Payload: JSON.stringify({
          slackCommand: 'chat.postMessage',
          team_id: team_id,
          body: {
            text: `<@${user_id}> ${politenessOptions[randomInt]}`,
            channel: channel_id,
            link_names: true,
            as_user: false,
            username: 'brushtail'
          }
        }) // pass params
      }, (err, data) => {
        if (err) {
          console.log('There was an error', JSON.stringify(err, null, 2))
          cb(err)
        // context.done('err', err)
        }

        // 1. remove the event records from db table
        // 2. set lastResponse: timestamp to the table model
        let updateLastResponse = {
          TableName: `brushtail-${process.env.SERVERLESS_STAGE}-Aggregate`,
          Key: {
            user_id: user_id,
            channel_id: channel_id
          },
          UpdateExpression: 'set #b = :val1, #e = #c remove #d',
          ExpressionAttributeNames: {
            // '#a': 'lastResponse',
            '#b': 'scores',
            '#c': 'sum',
            '#d': 'avg',
            '#e': 'lastCount'
          },
          ExpressionAttributeValues: {
            ':val0': 0.5, // sets the average back to 1/2
            ':val1': []
          },
          ReturnValues: 'UPDATED_NEW'
        }
        docClient.update(updateLastResponse, (err, data) => {
          if (err) {
            console.log(JSON.stringify(updateLastResponse));
            console.error('Update of Scores:', JSON.stringify(err, null, 2))
            cb()
          } else {
            console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2))
            cb(null, data)
          }
        })
      })
    }
  }, this)
}
