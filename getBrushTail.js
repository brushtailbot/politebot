'use strict'

module.exports.getData = (event, context, cb) => {
  console.log('in getData')
  console.log(event)
  cb(null, { body: { text: 'in the getData function' } })
}
