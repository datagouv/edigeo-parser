import { keyBy, groupBy } from 'lodash-es';
import parseInput from './parse/index.js';
import { buildFeature } from './features.js';
import { extractLabels } from './extras/labels/index.js';
import { getRelationsWithParcelles } from './extras/numero-voies/index.js';
import { getRelatedParcelleProperties } from './extras/subdfisc/index.js';
import { createProj } from './geometry/proj.js';
import { createModel } from './model/index.js';

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
    .filter(f => f && f.geometry)

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
  });
  (layers.SUBDFISC || []).forEach(subdfisc => {
    const parcelle = getRelatedParcelleProperties(subdfisc, ctx)
    if (parcelle) {
      subdfisc.extraProperties = {parcelleId: parcelle.id}
    }
  })

  return {layers}
}

export {parse};
