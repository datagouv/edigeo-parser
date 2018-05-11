const {chain, keyBy, groupBy} = require('lodash')
const parseInput = require('./parse')
const Face = require('./topology/face')
const {buildFeature} = require('./features')
const {createGraphIndex} = require('./graph')
const Arc = require('./topology/arc')
const {extractLabels} = require('./extras/labels')
const {getRelationsWithParcelles} = require('./extras/numero-voies')
const {createProj} = require('./geometry/proj')

const WGS_84 = 4326

async function parse(input, options = {}) {
  const ctx = {
    bundle: options.bundle,
    indexedItems: await parseInput(input)
  }

  const srsCode = options.overrideSrsCode || ctx.indexedItems['GEO:GEO'].srsCode

  if (!srsCode) {
    throw new Error('No SRS code defined for this bundle')
  }

  const items = Object.values(ctx.indexedItems)

  const relations = items.filter(item => item.blockType === 'LNK')

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

  ctx.proj = createProj(srsCode, WGS_84)

  const features = chain(items)
    .filter(item => item.blockType === 'FEA')
    .map(feaBlock => buildFeature(feaBlock, ctx))
    .compact()
    .value()

  const layers = groupBy(features, 'layer')

  ctx.features = keyBy(features, 'id')

  ;(layers.ZONCOMMUNI || []).forEach(voie => {
    voie.extraProperties = {labels: extractLabels(voie, ctx)}
  })

  ;(layers.NUMVOIE || []).forEach(numeroVoie => {
    const relationsWithParcelles = getRelationsWithParcelles(numeroVoie, ctx)
    if (relationsWithParcelles.length > 0) {
      numeroVoie.extraProperties = {relatedParcelles: relationsWithParcelles}
    }
  })

  return {layers}
}

module.exports = {parse}
