'use strict'
var aws = require('aws-sdk')

var docClient = new aws.DynamoDB.DocumentClient({
  region: 'ap-southeast-2'
})

var request = require('superagent')

require('dotenv').config({ silent: true })

module.exports.sendData = (event, context, cb) => {
  console.log(context)
  console.log(JSON.stringify(event))
  event.Records.filter((record) => {
    return record.eventName === 'INSERT'
  })
    .forEach(record => {
      let text = record.dynamodb.NewImage.text.S

      request
        .post('https://elb-classifier.foxtype.com/v1/all')
        .send({ 'text': text, 'return_features': 1 })
        .set('Authorization', process.env.FOXTYPE_TOKEN)
        .set('Accept', 'application/json')
        .end(function (err, res) {
          if (err) return cb()
          let score = res.body.overall.politeness.scoreBinProb
          let userId = record.dynamodb.NewImage.user_id.S
          let timestamp = +record.dynamodb.NewImage.timestamp.N
          let params = {
            TableName: `brushtail-${process.env.SERVERLESS_STAGE}-SlackMessage`,
            Key: {
              user_id: userId,
              timestamp: timestamp
            },
            UpdateExpression: 'set score = :val1, foxtype_data = :val2',
            ExpressionAttributeValues: {
              ':val1': score,
              ':val2': res.body
            },
            ReturnValues: 'UPDATED_NEW'
          }
          docClient.update(params, (err, data) => {
            if (err) {
              console.error('Unable to update item. Error JSON:', JSON.stringify(err, null, 2))
              cb(err)
            } else {
              console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2))
              cb(null, data)
            }
          })
        })
    })
}
