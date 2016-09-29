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
'use strict'
var aws = require('aws-sdk')
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

  return score > highWater ? 'innocent' : lowWater > score ? 'worried' : 'thumbsup'
}
// Core processData method
module.exports.processData = (event, context, cb) => {
  console.log(JSON.stringify(event, null, 2))
  let records = event.Records.filter((record) => {
    return record.eventName === 'MODIFY'
  })
  if (records.length < 1) return
  records.forEach(record => {
    try {
      var teamId = record.dynamodb.NewImage.team_id.S
      var channelId = record.dynamodb.NewImage.channel_id.S
      var timestamp = record.dynamodb.NewImage.timestamp.N
      var rating = isPolite(+record.dynamodb.NewImage.score.N)
    } catch (err) {
      console.log('There was a problem parsing the New Image')
      return
    }
    console.log(`Creating reaction for channel ${channelId} comment ${timestamp} in team ${teamId} with rating ${rating}`)
    if (rating === 'thumbsup') return
    lambda.invoke({
      FunctionName: `brushtail-${process.env.SERVERLESS_STAGE}-toSlack`,
      Payload: JSON.stringify({
        slackCommand: 'reactions.add',
        team_id: teamId,
        body: {
          channel: channelId,
          timestamp: timestamp,
          name: rating,
          as_user: false,
          username: 'brushtail'
        }
      }) // pass params
    }, (err, data) => {
      if (err) {
        console.log('There was an error', JSON.stringify(err, null, 2))
      }
    })
  })
  cb()
}
