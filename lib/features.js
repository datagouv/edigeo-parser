/* eslint camelcase: off */
const {buildGeometry} = require('./assemble/geometry')
const {buildProperties} = require('./assemble/properties')

const featureTypes = {
  COMMUNE_id: {
    geometryType: 'MultiPolygon'
  },
  SECTION_id: {
    geometryType: 'MultiPolygon'
  },
  SUBDSECT_id: {
    geometryType: 'MultiPolygon'
  },
  PARCELLE_id: {
    geometryType: 'Polygon'
  },
  SUBDFISC_id: {
    geometryType: 'Polygon'
  },
  CHARGE_id: {
    geometryType: 'Polygon'
  },
  VOIEP_id: {
    geometryType: 'Point'
  },
  TRONFLUV_id: {
    geometryType: 'Polygon'
  },
  PTCANV_id: {
    geometryType: 'Point'
  },
  BATIMENT_id: {
    geometryType: 'MultiPolygon'
  },
  ZONCOMMUNI_id: {
    geometryType: 'LineString'
  },
  NUMVOIE_id: {
    geometryType: 'Point'
  },
  TRONROUTE_id: {
    geometryType: 'Polygon'
  },
  BORNE_id: {
    geometryType: 'Point'
  },
  CROIX_id: {
    geometryType: 'Point'
  },
  BOULON_id: {
    geometryType: 'Point'
  },
  SYMBLIM_id: {
    geometryType: 'Point'
  },
  LIEUDIT_id: {
    geometryType: 'Polygon'
  },
  TPOINT_id: {
    geometryType: 'Point'
  },
  TLINE_id: {
    geometryType: 'LineString'
  },
  TSURF_id: {
    geometryType: 'Polygon'
  },
  ID_S_OBJ_Z_1_2_2: {
    renamedInto: 'LABEL',
    geometryType: 'Point'
  }
}

function prepareFeature(fea, ctx) {
  return {
    type: 'Feature',
    id: fea.id,
    properties: buildProperties(fea, ctx)
  }
}

function buildFeature(feaBlock, ctx) {
  const {featureType} = feaBlock
  if (featureType in featureTypes) {
    const {geometryType, renamedInto} = featureTypes[featureType]
    const layer = renamedInto || featureType.split('_')[0]
    try {
      const feature = prepareFeature(feaBlock, ctx)
      const geometry = buildGeometry(geometryType, feaBlock, ctx)
      feature.geometry = ctx.proj(geometry)
      feature.layer = layer
      return feature
    } catch (err) {
      console.error(`${ctx.bundle ? ctx.bundle + ' | ' : ''}${layer}:${feaBlock.id} => feature ignored (${err.message})`)
    }
  }
}

module.exports = {buildFeature, featureTypes}
