const split = require('split2')
const debug = require('debug')('edigeo-parser:parser')

const BLOCK_TYPES = {
  FEA: require('./types/fea'),
  LNK: require('./types/lnk'),
  PNO: require('./types/pno'),
  PAR: require('./types/par'),
  PFE: require('./types/pfe'),
  GEO: require('./types/geo'),
  QUP: require('./types/qup')
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
    debug('value size mismatch!')
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

    function closeCurrentBlock(rejectWithError) {
      if (currentBlock) {
        if (rejectWithError) {
          console.error('Description block rejected: ' + rejectWithError.message)
        } else if (currentBlock.id) {
          const id = currentBlock.id
          if (id in items) {
            debug('found duplicate block identifier: ' + id)
            return
          }
          items[id] = currentBlock
        } else {
          console.error('Description block rejected: no ID for block definition')
        }
        currentBlock = undefined
      }
    }

    readable
      .pipe(split())
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
          try {
            currentBlock.addLine(parsedLine)
          } catch (err) {
            closeCurrentBlock(err)
          }
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
