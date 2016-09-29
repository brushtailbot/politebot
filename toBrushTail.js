'use strict'
var AWS = require('aws-sdk')
var docClient = new AWS.DynamoDB.DocumentClient({
  region: 'ap-southeast-2'
})
require('dotenv').config({silent: true})
module.exports.sendData = (event, context, cb) => {
    // For verifying the request url in SLACK
    // Sps://api.slack.com/events/url_verification
  console.log('about to check for gold', JSON.stringify(event, null, 2))
  let body = event.body
  try {
    var token = body.token
  } catch (err) {
    return context.fail('error')
  }
  if (event.body.challenge) {
    return cb(null, event.body)
  }
  if (!(token === process.env.SLACK_TOKEN)) return context.fail('Unauthorized')
  if (!event.body.event || event.body.event.type !== 'message') {
    return cb()
  }
  let params = {
    TableName: `brushtail-${process.env.SERVERLESS_STAGE}-SlackMessage`,
    Item: {
      user_id: event.body.event.user,
      team_id: event.body.team_id,
      timestamp: +event.body.event.ts,
      channel_id: event.body.event.channel,
      text: event.body.event.text,
      slack_data: event.body
    }
  }
  docClient.put(params, (err, data) => {
    if (err) return console.log(err, err.stack)
    console.log(`Message Received: ${JSON.stringify(data, null, 2)}`)
  })
  cb()
}
