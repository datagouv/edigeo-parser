const {isString} = require('lodash')
const isBuffer = require('is-buffer')
const {parseBundleBuffer} = require('./readers/buffer')
const {parseBundleDirectory} = require('./readers/directory')
const {parseBundleFile} = require('./readers/file')

async function parse(input) {
  if (isString(input) && input.toLowerCase().endsWith('.tar.bz2')) {
    return parseBundleFile(input) // Use input string as path
  }
  if (isString(input)) {
    return parseBundleDirectory(input) // Use input string as path
  }
  if (isBuffer(input)) {
    return parseBundleBuffer(input)
  }
  throw new Error('Parse input type not supported')
}

module.exports = parse
