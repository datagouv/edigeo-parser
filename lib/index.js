const {keyBy, groupBy} = require('lodash')
const parseInput = require('./parse')
const {buildFeature} = require('./features')
const {extractLabels} = require('./extras/labels')
const {getRelationsWithParcelles} = require('./extras/numero-voies')
const {createProj} = require('./geometry/proj')
const {createModel} = require('./model')

const WGS_84 = 4326

async function parse(input, options = {}) {
  const ctx = createModel({
    indexedItems: await parseInput(input),
    bundle: options.bundle,
    overrideSrsCode: options.overrideSrsCode
  })

  ctx.proj = createProj(ctx.srsCode, WGS_84)

  const features = ctx.getItems('FEA')
    .map(feaBlock => buildFeature(feaBlock, ctx))
    .filter(f => f.geometry)

  const layers = groupBy(features, 'layer')

  ctx.features = keyBy(features, 'id');
  (layers.ZONCOMMUNI || []).forEach(voie => {
    voie.extraProperties = {labels: extractLabels(voie, ctx)}
  });
  (layers.NUMVOIE || []).forEach(numeroVoie => {
    const relationsWithParcelles = getRelationsWithParcelles(numeroVoie, ctx)
    if (relationsWithParcelles.length > 0) {
      numeroVoie.extraProperties = {relatedParcelles: relationsWithParcelles}
    }
  })

  return {layers}
}

module.exports = {parse}
