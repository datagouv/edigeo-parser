import { booleanPointInPolygon } from '@turf/turf';

function getRelationsWithParcelles(numeroVoie, ctx) {
  return ctx.getRelatedObjects(`SeSPA_1:${numeroVoie.id}`, 'NUMVOIE_PARCELLE')
    .map(relatedParcelle => {
      const [, parcelleId] = relatedParcelle.split(':')
      const parcelle = ctx.features[parcelleId]
      if (parcelle) {
        return {
          id: parcelle.properties.IDU,
          position: booleanPointInPolygon(numeroVoie, parcelle) ? 'inside' : 'outside'
        }
      }

      console.error(`Impossible de relier parcelle et numéro de voie : parcelle ${parcelleId} introuvable`)
      return null
    })
    .filter(o => Boolean(o))
}

export {getRelationsWithParcelles};
