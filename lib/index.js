const fs = require('fs')
const {promisify} = require('util')
const {join} = require('path')
const split = require('split2')
const debug = require('debug')('cadastre')

const readdir = promisify(fs.readdir)

const BLOCK_TYPES = {
  FEA: require('./types/fea'),
  LNK: require('./types/lnk'),
  PNO: require('./types/pno'),
  PAR: require('./types/par'),
  PFE: require('./types/pfe'),
  GEO: require('./types/geo')
}

function extractHeader(line) {
  return {
    code: line.substr(0, 3),
    valueType: line.substr(3, 1),
    valueFormat: line.substr(4, 1),
    valueSize: parseInt(line.substr(5, 2), 10)
  }
}

const FORMAT_PARSERS = {
  C: rawValue => parseFloat(rawValue),
  R: rawValue => parseFloat(rawValue),
  I: rawValue => parseInt(rawValue, 10),
  N: rawValue => parseInt(rawValue, 10),
  D: rawValue => {
    if (rawValue.length !== 8) return
    return `${rawValue.substr(0, 4)}-${rawValue.substr(4, 2)}-${rawValue.substr(6, 2)}`
  }
}

function parseValue({valueType, valueFormat, valueSize}, rawValue) {
  if (rawValue.length !== valueSize) {
    debug('[WARN] value size mismatch')
  }

  const formatParse = (valueFormat in FORMAT_PARSERS) ? FORMAT_PARSERS[valueFormat] : x => x

  if (valueType === 'C') return rawValue.split(';').filter(v => Boolean(v)).map(formatParse)
  return formatParse(rawValue)
}

function parseLine(line) {
  if (!line) return

  // Extract header
  const header = extractHeader(line)

  // Extract value
  const rawValue = line.substr(8)
  const parsedValue = parseValue(header, rawValue)

  return {...header, rawValue, parsedValue}
}

function parseStream(readable) {
  return new Promise((resolve, reject) => {
    let currentBlock
    const items = {}

    function closeCurrentBlock() {
      if (currentBlock) {
        if (!currentBlock.id) throw new Error('No ID for supported block definition')
        const id = currentBlock.id
        if (id in items) throw new Error('Duplicate ID: ' + id)
        items[id] = currentBlock
        currentBlock = undefined
      }
    }

    readable
       .on('data', line => {
         const parsedLine = parseLine(line)
         if (!parsedLine) return
         if (['BOM', 'CSE', 'EOM'].includes(parsedLine.code)) return
         if (parsedLine.code === 'RTY') {
           closeCurrentBlock()
           if (parsedLine.parsedValue in BLOCK_TYPES) {
             currentBlock = new BLOCK_TYPES[parsedLine.parsedValue]()
           }
           return
         }
         if (!currentBlock) return
         if (parsedLine.code === 'RID') {
           currentBlock.setId(parsedLine.parsedValue)
         } else {
           if (!currentBlock) return
           currentBlock.addLine(parsedLine)
         }
       })
       .on('error', reject)
       .on('end', () => {
         closeCurrentBlock()
         resolve(items)
       })
  })
}

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

module.exports = {parseLine, parseFile, parseLot, parseStream}
