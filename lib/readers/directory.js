const fs = require('fs')
const {join} = require('path')
const {promisify} = require('util')
const {parseStream} = require('../parse')
const {parseBundle} = require('./common')

const readdir = promisify(fs.readdir)

async function extractFiles(path) {
  const files = await readdir(path)

  const thf = files.find(f => f.endsWith('.THF'))
  const geo = files.find(f => f.endsWith('.GEO'))
  const t1 = files.find(f => f.endsWith('T1.VEC'))
  const t2 = files.find(f => f.endsWith('T2.VEC'))
  const t3 = files.find(f => f.endsWith('T3.VEC'))
  const s1 = files.find(f => f.endsWith('S1.VEC'))
  const qal = files.find(f => f.endsWith('.QAL'))

  if (!thf || !geo || !t1 || !t2 || !t3 || !s1 || !qal) {
    throw new Error('Missing required files in EDIGÉO bundle')
  }

  return {
    thf: join(path, thf),
    geo: join(path, geo),
    t1: join(path, t1),
    t2: join(path, t2),
    t3: join(path, t3),
    s1: join(path, s1),
    qal: join(path, qal)
  }
}

function parseOne(path) {
  return parseStream(fs.createReadStream(path, {encoding: 'latin1'}))
}

function parseBundleDirectory(path) {
  return parseBundle(path, extractFiles, parseOne)
}

module.exports = {parseBundleDirectory}
