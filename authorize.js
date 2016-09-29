'use strict'
var aws = require('aws-sdk')
var docClient = new aws.DynamoDB.DocumentClient({
  region: 'ap-southeast-2'
})
var request = require('superagent')
var Slack = require('slack-node')
require('dotenv').config({silent: true})
module.exports.events = {}
module.exports.events.authorized = (event, context, slackTeam) => {
  module.exports.Slack.setWebhook(slackTeam.incoming_webhook_url)
  module.exports.Slack.webhook({
    text: 'Wooo!  You\'ve connected me to your channel!'
  }, (error, response) => {
    if (error) {
      return module.exports.sendError(
        context,
        error,
        '1.Sorry, something went wrong with the authorization process')
    }
    return context.done(null, {
      text: 'Success!  You\'ve connected me!  ' +
        'If you set up a custom domain with API Gateway and an SSL certificate, ' +
        'you can use Slack\'s redirect_uri param to redirect the user somewhere else.'
    })
  })
}
module.exports.saveTeam = (slackTeam, cb) => {
  console.log(`Salck-Team: ${JSON.stringify(slackTeam)}`)
  var params = {
    TableName: `brushtail-${process.env.SERVERLESS_STAGE}-SlackTeam`,
    Key: {
      id: slackTeam.id
    },
    AttributeUpdates: {
      access_token: {
        Acion: 'PUT',
        Value: slackTeam.access_token
      }
    },
    ReturnValues: 'ALL_OLD'
  }
  docClient.update(params, cb)
}
module.exports.sendError = (context, error, message, inChannel) => {
  console.log(error)
  console.log(message)
  console.log(context)
  return context.done(null, {
    response_type: inChannel ? 'in_channel' : 'ephemeral',
    text: message
  })
}
module.exports.authorize = (event, ctx) => {
  console.log('Attempting Autorization', JSON.stringify(event, null, 2))
    // Check Environment Variables are defined
  console.log('With env variables', process.env)
  if (!process.env.SLACK_OAUTH_CLIENT_SECRET || !event.query.code) {
    return module.exports.sendError(
        ctx,
        'Missing required module.exports environment variables',
        '2.Sorry, something went wrong with the authorization process')
  }

  // Prepare response to get Access Token
  var SlackClientSecret = process.env.SLACK_OAUTH_CLIENT_SECRET

  // Construct URL
  var url = `https://slack.com/api/oauth.access?client_id=2437318132.83678354932&client_secret=${SlackClientSecret}&code=${event.query.code}`

  // Add redirect url, if it is set as ENV
  if (process.env.SLACK_AUTH_REDIRECT_URL) {
    console.log(`REDIRECT_URI: ${process.env.SLACK_AUTH_REDIRECT_URL}`)
    url = url + '&redirect_uri=' + process.env.SLACK_AUTH_REDIRECT_URL
  }
  console.log(url)
  // Send request to get Access Token
  return request
  .get(url, (error, response, body) => {
    // Return error
    if (error || response.status !== 200) {
      console.log(`Error Requesting Authorization ${JSON.stringify(error, null, 2)}  ${JSON.stringify(response, null, 2)}`)
      return module.exports.sendError(
        ctx,
        error,
        '3.Sorry, something went wrong with the authorization process')
    }
    console.log(JSON.stringify(response, null, 2), body)
    // Parse stringified JSON
    body = JSON.parse(response.text)
    if (!body.ok || !body.access_token) {
      console.log(`Access ${JSON.stringify(error, null, 2)}  ${JSON.stringify(response, null, 2)}`)
      return module.exports.sendError(
        ctx,
        'Sorry, no access_token',
        'Sorry, no access_token')
    }
    // Set team attributes
    var slackTeam = {
      id: body.team_id,
      name: body.team_name,
      scope: body.scope,
      access_token: body.access_token,
      bot_user_id: body.bot_user_id,
      bot_access_token: body.bot_access_token,
      incoming_webhook_url: body.incoming_webhook.url,
      incoming_webhook_channel: body.incoming_webhook.channel,
      incoming_webhook_configuration_url: body.incoming_webhook.configuration_url
    }

    // Create or Update bot
    module.exports.saveTeam(slackTeam, (error) => {
      // Return error
      if (error) {
        console.log(`Error Saving Team ${JSON.stringify(error, null, 2)}`)
        return module.exports.sendError(
          ctx,
          error,
          '4.Sorry, something went wrong with the authorization process')
      }

      // Init Slack
      module.exports.Slack = new Slack(slackTeam.access_token)

      // If event authorized hook
      if (module.exports.events.authorized) {
        return module.exports.events.authorized(event, ctx, slackTeam)
      } else {
        // Return response
        return ctx.done(null, {
          message: 'Your team has successfully connected to this bot!'
        })
      }
    })
  })
}
