const debug = require('debug')('edigeo-parser')

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

module.exports = {parseLine, parseValue, extractHeader, parseStream}
