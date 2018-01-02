const fs = require('fs')
const {promisify} = require('util')
const {join} = require('path')
const {Duplex} = require('stream')
const split = require('split2')
const decompress = require('decompress')
const debug = require('debug')('edigeo-parser')

const {parseStream} = require('./parse')
const {getFullId} = require('./ns')

const readdir = promisify(fs.readdir)

function parseFile(path) {
  debug('Start parsing %s', path)
  return parseStream(fs.createReadStream(path).pipe(split()))
}

function parseBuffer(buffer) {
  const stream = new Duplex()
  stream.push(buffer)
  stream.push(null)
  return parseStream(stream.pipe(split()))
}

async function parseBundleBuffer(buffer) {
  const files = await decompress(buffer, {strip: 10})

  const thfFile = files.find(f => f.path.endsWith('.THF'))
  const geoFile = files.find(f => f.path.endsWith('.GEO'))
  const vecT1File = files.find(f => f.path.endsWith('T1.VEC'))
  const vecT2File = files.find(f => f.path.endsWith('T2.VEC'))
  const vecT3File = files.find(f => f.path.endsWith('T3.VEC'))
  const vecS1File = files.find(f => f.path.endsWith('S1.VEC'))

  if (!thfFile || !geoFile || !vecT1File || !vecT2File || !vecT3File || !vecS1File) {
    throw new Error('Missing required files in EDIGÉO bundle')
  }

  /* eslint camelcase: off */

  const items = {
    SeTOP_1: await parseBuffer(vecT1File.data),
    SeTOP_2: await parseBuffer(vecT2File.data),
    SeTOP_3: await parseBuffer(vecT3File.data),
    SeSPA_1: await parseBuffer(vecS1File.data)
  }

  return Object.keys(items)
    .reduce((acc, ns) => {
      Object.keys(items[ns]).forEach(localItemId => {
        const item = items[ns][localItemId]
        item.ns = ns
        item.fullId = getFullId(localItemId, ns)
        acc[item.fullId] = items[ns][localItemId]
      })
      return acc
    }, {})
}

async function parseLot(path) {
  const Files = await readdir(path)

  const thfFile = Files.find(f => f.endsWith('.THF'))
  const geoFile = Files.find(f => f.endsWith('.GEO'))
  const vecT1File = Files.find(f => f.endsWith('T1.VEC'))
  const vecT2File = Files.find(f => f.endsWith('T2.VEC'))
  const vecT3File = Files.find(f => f.endsWith('T3.VEC'))
  const vecS1File = Files.find(f => f.endsWith('S1.VEC'))

  if (!thfFile || !geoFile || !vecT1File || !vecT2File || !vecT3File || !vecS1File) {
    throw new Error('Lot incomplet')
  }

  /* eslint camelcase: off */

  const items = {
    SeTOP_1: await parseFile(join(path, vecT1File)),
    SeTOP_2: await parseFile(join(path, vecT2File)),
    SeTOP_3: await parseFile(join(path, vecT3File)),
    SeSPA_1: await parseFile(join(path, vecS1File))
  }

  return Object.keys(items)
    .reduce((acc, ns) => {
      Object.keys(items[ns]).forEach(localItemId => {
        const item = items[ns][localItemId]
        item.ns = ns
        item.fullId = getFullId(localItemId, ns)
        acc[item.fullId] = items[ns][localItemId]
      })
      return acc
    }, {})
}

module.exports = {parseFile, parseLot, parseStream, parseBundleBuffer, parseBuffer}
