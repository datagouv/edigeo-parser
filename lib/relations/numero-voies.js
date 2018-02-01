const booleanPointInPolygon = require('@turf/boolean-point-in-polygon')
const {getRelatedObjects} = require('../topology/relations')

function getRelationsWithParcelles(numeroVoie, ctx) {
  return getRelatedObjects(`SeSPA_1:${numeroVoie.id}`, 'NUMVOIE_PARCELLE', ctx)
    .map(relatedParcelle => {
      const parcelleId = relatedParcelle.split(':')[1]
      const parcelle = ctx.features[parcelleId]

      return {
        id: parcelle.properties.IDU,
        position: booleanPointInPolygon(numeroVoie, parcelle) ? 'inside' : 'outside'
      }
    })
}

module.exports = {getRelationsWithParcelles}
