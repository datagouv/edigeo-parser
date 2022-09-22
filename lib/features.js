/* eslint camelcase: off */
import {truncate, rewind} from '@turf/turf'

import {buildGeometry} from './assemble/geometry/index.js'
import {buildProperties} from './assemble/properties/index.js'
import {validate} from './geometry/validate.js'
import {deintersect} from './geometry/clean.js'

const featureTypes = {
  COMMUNE_id: {
    geometryType: 'MultiPolygon',
  },
  SECTION_id: {
    geometryType: 'MultiPolygon',
  },
  SUBDSECT_id: {
    geometryType: 'MultiPolygon',
  },
  PARCELLE_id: {
    geometryType: 'Polygon',
  },
  SUBDFISC_id: {
    geometryType: 'Polygon',
  },
  CHARGE_id: {
    geometryType: 'Polygon',
  },
  VOIEP_id: {
    geometryType: 'Point',
  },
  TRONFLUV_id: {
    geometryType: 'Polygon',
  },
  PTCANV_id: {
    geometryType: 'Point',
  },
  BATIMENT_id: {
    geometryType: 'MultiPolygon',
  },
  ZONCOMMUNI_id: {
    geometryType: 'LineString',
  },
  NUMVOIE_id: {
    geometryType: 'Point',
  },
  TRONROUTE_id: {
    geometryType: 'Polygon',
  },
  BORNE_id: {
    geometryType: 'Point',
  },
  CROIX_id: {
    geometryType: 'Point',
  },
  BOULON_id: {
    geometryType: 'Point',
  },
  SYMBLIM_id: {
    geometryType: 'Point',
  },
  LIEUDIT_id: {
    geometryType: 'Polygon',
  },
  TPOINT_id: {
    geometryType: 'Point',
  },
  TLINE_id: {
    geometryType: 'LineString',
  },
  TSURF_id: {
    geometryType: 'Polygon',
  },
  ID_S_OBJ_Z_1_2_2: {
    renamedInto: 'LABEL',
    geometryType: 'Point',
  },
}

function prepareFeature(fea, ctx) {
  return {
    type: 'Feature',
    id: fea.id,
    properties: buildProperties(fea, ctx),
  }
}

function rejectGeometry(feature, errors, objectId) {
  console.error(`${objectId} => geometry ignored (${errors.join(', ')})`)
  feature.geometry = null
  feature.geometryRejectionErrors = errors
}

function setGeometry(feature, geometry, proj) {
  feature.geometry = proj(geometry)
}

function finalizeFeature(feature) {
  if (!feature.geometry) return feature
  return truncate(
    rewind(
      feature,
      {mutate: true},
    ),
    {precision: 7, mutate: true, coordinates: 2},
  )
}

function buildFeature(feaBlock, ctx) {
  const {featureType} = feaBlock
  if (featureType in featureTypes) {
    const {geometryType, renamedInto} = featureTypes[featureType]
    const layer = renamedInto || featureType.split('_')[0]
    const feature = prepareFeature(feaBlock, ctx)
    const objectId = `${ctx.bundle ? ctx.bundle + ':' : ''}${feaBlock.id}(${layer})`
    feature.layer = layer
    try {
      const geometry = buildGeometry(geometryType, feaBlock, ctx)
      const errors = validate(geometry)
      if (errors.length === 0) {
        setGeometry(feature, geometry, ctx.proj)
      } else if (errors.length === 1 && errors[0] === 'has-self-intersection') {
        setGeometry(feature, deintersect(geometry, geometryType === 'MultiPolygon'), ctx.proj)
      } else {
        rejectGeometry(feature, errors, objectId)
      }
    } catch (error) {
      rejectGeometry(feature, [error.message], objectId)
    }

    return finalizeFeature(feature)
  }

  console.error('Warning: FEA block without feature type')
}

export {buildFeature, featureTypes}
