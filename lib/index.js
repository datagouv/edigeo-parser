const {isString, chain, keyBy} = require('lodash')
const isBuffer = require('is-buffer')
const {parseBundleBuffer} = require('./readers/buffer')
const {parseBundleDirectory} = require('./readers/directory')
const {parseBundleFile} = require('./readers/file')
const Face = require('./topology/face')
const {buildFeatures} = require('./features')
const {createGraphIndex} = require('./graph')
const Arc = require('./topology/arc')

async function parse(input, options = {}) {
  const ctx = {bundle: options.bundle}

  if (isString(input) && input.toLowerCase().endsWith('.tar.bz2')) {
    ctx.indexedItems = await parseBundleFile(input) // Use input string as path
  } else if (isString(input)) {
    ctx.indexedItems = await parseBundleDirectory(input) // Use input string as path
  } else if (isBuffer(input)) {
    ctx.indexedItems = await parseBundleBuffer(input)
  } else {
    throw new Error('Parse input type not supported')
  }

  const srsCode = options.overrideSrsCode || ctx.indexedItems['GEO:GEO'].srsCode

  if (!srsCode) {
    throw new Error('No SRS code defined for this bundle')
  }

  const items = Object.values(ctx.indexedItems)

  const relations = items.filter(item => item.blockType === 'LNK')
  const features = items.filter(item => item.blockType === 'FEA')

  ctx.graphIndex = createGraphIndex(relations)

  ctx.arcs = chain(items)
    .filter(item => item.blockType === 'PAR')
    .map(arc => new Arc(arc, ctx))
    .keyBy('fullId')
    .value()

  const faces = items
    .filter(item => item.blockType === 'PFE')
    .map(face => new Face(face, ctx))

  // Indexed faces
  ctx.faces = keyBy(faces, 'fullId')

  return {features: buildFeatures(features, srsCode, ctx)}
}

module.exports = {parse}
