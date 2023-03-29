import {Buffer} from 'node:buffer'
import split from 'split2'
import debugFactory from 'debug'
import FEA from './types/fea.js'
import LNK from './types/lnk.js'
import PNO from './types/pno.js'
import PAR from './types/par.js'
import PFE from './types/pfe.js'
import GEO from './types/geo.js'
import QUP from './types/qup.js'

const debug = debugFactory('edigeo-parser:parser')

const BLOCK_TYPES = {
  FEA,
  LNK,
  PNO,
  PAR,
  PFE,
  GEO,
  QUP,
}

function extractHeader(line) {
  return {
    code: line.slice(0, 3),
    valueType: line.slice(3, 4),
    valueFormat: line.slice(4, 5),
    valueSize: Number.parseInt(line.slice(5, 7), 10),
  }
}

const FORMAT_PARSERS = {
  C: rawValue => Number.parseFloat(rawValue),
  R: rawValue => Number.parseFloat(rawValue),
  I: rawValue => Number.parseInt(rawValue, 10),
  N: rawValue => Number.parseInt(rawValue, 10),
  D(rawValue) {
    if (rawValue.length !== 8) return
    return `${rawValue.slice(0, 4)}-${rawValue.slice(4, 6)}-${rawValue.slice(6, 8)}`
  },
}

function parseValue({valueType, valueFormat, valueSize}, rawValue) {
  if (rawValue.length !== valueSize) {
    debug('value size mismatch!')
  }

  const formatParse = (valueFormat in FORMAT_PARSERS) ? FORMAT_PARSERS[valueFormat] : x => x

  if (valueType === 'C') return rawValue.split(';').filter(Boolean).map(value => formatParse(value))
  return formatParse(rawValue)
}

function parseLine(line) {
  if (!line) return
  line = Buffer.from(line).toString()

  // Extract header
  const header = extractHeader(line)

  // Extract value
  const rawValue = line.slice(8)
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
          } catch (error) {
            closeCurrentBlock(error)
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

export {parseLine, parseValue, extractHeader, parseStream}
