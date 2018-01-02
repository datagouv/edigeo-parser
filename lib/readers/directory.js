const fs = require('fs')
const {join} = require('path')
const {promisify} = require('util')
const debug = require('debug')('edigeo-parser')
const {parseStream} = require('../blocks/parse')
const {getFullId} = require('../ns')

const readdir = promisify(fs.readdir)

function parseFile(path) {
  debug('Start parsing %s', path)
  return parseStream(fs.createReadStream(path))
}

async function parseBundleDirectory(path) {
  const files = await readdir(path)

  const thfFile = files.find(f => f.endsWith('.THF'))
  const geoFile = files.find(f => f.endsWith('.GEO'))
  const vecT1File = files.find(f => f.endsWith('T1.VEC'))
  const vecT2File = files.find(f => f.endsWith('T2.VEC'))
  const vecT3File = files.find(f => f.endsWith('T3.VEC'))
  const vecS1File = files.find(f => f.endsWith('S1.VEC'))

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

module.exports = {parseFile, parseBundleDirectory}
