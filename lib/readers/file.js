const decompress = require('decompress')
const {parseStream} = require('../blocks/parse')
const {bufferToStream} = require('../util')
const {parseBundle} = require('./common')

async function extractFiles(bundleFileName) {
  const files = await decompress(bundleFileName, {strip: 10})

  return {
    thf: files.find(f => f.path.endsWith('.THF')),
    geo: files.find(f => f.path.endsWith('.GEO')),
    t1: files.find(f => f.path.endsWith('T1.VEC')),
    t2: files.find(f => f.path.endsWith('T2.VEC')),
    t3: files.find(f => f.path.endsWith('T3.VEC')),
    s1: files.find(f => f.path.endsWith('S1.VEC'))
  }
}

function parseBuffer(buffer) {
  return parseStream(bufferToStream(buffer))
}

function parseBundleFile(path) {
  return parseBundle(path, extractFiles, file => parseBuffer(file.data))
}

module.exports = {parseBuffer, parseBundleFile}
