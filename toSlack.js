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
    let slack = new Slack(data.Item.access_token)

    /* Setting states for reactions
    *
    * @param token: string, Authentication token (Requires scope: `reactions:write`) **Required
    * @param name: string, Reaction Emoji name **Required
    * @param file: string?, File to add reaction to (optional)
    * @param file_comment: string?, File comment to add reaction to.
    * @param channel: string?, Channel where the message to add reaction to was posted. (optional)
    * @param timestamp: decimal/datetime?, Timestamp of the message to add reaction to.
    *
    */

    // var reactionData = {};
    // switch (element.dynamodb.NewImage.avg.N) {
    //   case 'polite':
    //     reactionData = {
    //       token: data.Item.access_token,
    //       name: 'innocent',
    //       channel: event.channel_id,
    //       timestamp: element.dynamodb.NewImage.timestamp.N
    //     }
    //   case 'neutral':
    //     reactionData = {
    //       token: data.Item.access_token,
    //       name: 'thumbsup',
    //       channel: event.channel_id,
    //       timestamp: element.dynamodb.NewImage.timestamp.N
    //     }
    //   case 'impolite':
    //     reactionData = {
    //       token: data.Item.access_token,
    //       name: 'worried',
    //       channel: event.channel_id,
    //       timestamp: element.dynamodb.NewImage.timestamp.N
    //     }
    //   default:
    //     reactionData = {
    //       token: data.Item.access_token,
    //       name: 'chilli',
    //       channel: event.channel_id,
    //       timestamp: element.dynamodb.NewImage.timestamp.N
    //     }
    // }

    // // Add the reaction
    // slack.api('reactions.add', reactionData, (err, res) => {
    //   console.log('Error:');
    //   if(err) console.log(err);
    //   console.log('Result:');
    //   console.log(res);
    // });

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
