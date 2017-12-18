const fs = require('fs')
const {promisify} = require('util')
const {join} = require('path')
const split = require('split2')
const debug = require('debug')('edigeo-parser')

const {parseStream} = require('./parse')

const readdir = promisify(fs.readdir)

function parseFile(path) {
  debug('Start parsing %s', path)
  return parseStream(fs.createReadStream(path).pipe(split()))
}

async function parseLot(path) {
  const fileNames = await readdir(path)

  const thfFileName = fileNames.find(f => f.endsWith('.THF'))
  const geoFileName = fileNames.find(f => f.endsWith('.GEO'))
  const vecT1FileName = fileNames.find(f => f.endsWith('T1.VEC'))
  const vecT2FileName = fileNames.find(f => f.endsWith('T2.VEC'))
  const vecT3FileName = fileNames.find(f => f.endsWith('T3.VEC'))
  const vecS1FileName = fileNames.find(f => f.endsWith('S1.VEC'))

  if (!thfFileName || !geoFileName || !vecT1FileName || !vecT2FileName || !vecT3FileName || !vecS1FileName) {
    throw new Error('Lot incomplet')
  }

  /* eslint camelcase: off */

  const items = {
    SeTOP_1: await parseFile(join(path, vecT1FileName)),
    SeTOP_2: await parseFile(join(path, vecT2FileName)),
    SeTOP_3: await parseFile(join(path, vecT3FileName)),
    SeSPA_1: await parseFile(join(path, vecS1FileName))
  }

  return items
}

module.exports = {parseFile, parseLot, parseStream}
