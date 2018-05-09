const {isNumber, isArray, chain, keyBy, groupBy} = require('lodash')
const proj4 = require('proj4')
const {getReference} = require('./references')
const parseInput = require('./parse')
const Face = require('./topology/face')
const {buildFeature} = require('./features')
const {createGraphIndex} = require('./graph')
const Arc = require('./topology/arc')
const {extractLabels} = require('./labels')
const {getRelationsWithParcelles} = require('./relations/numero-voies')

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

  const wgs84 = getReference(4326).proj4
  const projPoint = coords => proj4(getReference(srsCode).proj4, wgs84).forward(coords)

  ctx.proj = coordinates => projAll(coordinates, projPoint)

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

function projAll(coords, proj) {
  if (isNumber(coords[0])) {
    return proj(coords)
  }
  if (isArray(coords[0])) {
    return coords.map(c => projAll(c, proj))
  }
  throw new Error('Malformed coordinates')
}

module.exports = {parse}
