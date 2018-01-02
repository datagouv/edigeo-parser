const {isString} = require('lodash')
const isBuffer = require('is-buffer')
const {parseBundleBuffer} = require('./io/buffer')
const {parseBundleDirectory} = require('./io/directory')

function parse(input) {
  if (isString(input)) {
    return parseBundleDirectory(input) // Use input string as path
  }
  if (isBuffer(input)) {
    return parseBundleBuffer(input)
  }
  throw new Error('Parse input type not supported')
}

module.exports = {parse}
