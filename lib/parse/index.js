import {isString} from 'lodash-es'
import isBuffer from 'is-buffer'
import {parseBundleBuffer} from './readers/buffer.js'
import {parseBundleDirectory} from './readers/directory.js'
import {parseBundleFile} from './readers/file.js'

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

export default parse
