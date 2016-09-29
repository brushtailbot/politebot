'use strict'
var aws = require('aws-sdk')

var docClient = new aws.DynamoDB.DocumentClient({
  region: 'ap-southeast-2'
})

var Slack = require('slack-node')
require('dotenv').config({ silent: true })
module.exports.sendData = (event, context) => {
  /**
   * {
   *  team_id: string,
   *  text: string,
   *  channel_id: string
   * }
   */
  console.log(JSON.stringify(event), null, 2)
  let params = {
    TableName: `brushtail-${process.env.SERVERLESS_STAGE}-SlackTeam`,
    Key: {
      id: event.team_id
    }
  }
  docClient.get(params, (err, data) => {
    if (err) {
      return console.log('There was an Error ', JSON.stringify(err, null, 2))
    }
    console.log('Found this record ', JSON.stringify(data, null, 2))
    if (!data.Item.access_token) {
      console.log('This team has no access token')
      return
    }
    let slack = new Slack(data.Item.bot_access_token)

    // Messaging service
    slack.api(event.slackCommand, event.body, (err, res) => {
      if (err) {
        console.log('An Error Occured', JSON.stringify(err, null, 2))
      } else {
        console.log('Success Message Sent', JSON.stringify(res, null, 2))
      }
    })
  })
}
