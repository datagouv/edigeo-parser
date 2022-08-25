/* eslint camelcase: off */
const { truncate, rewind, booleanWithin, polygon, multiPolygon } = require('@turf/turf')
const {buildGeometry} = require('./assemble/geometry')
const {buildProperties} = require('./assemble/properties')
const {validate} = require('./geometry/validate')
const {deintersect} = require('./geometry/clean')

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

function rejectGeometry(feature, errors, objId) {
  console.error(`${objId} => geometry ignored (${errors.join(', ')})`)
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
      {mutate: true}
    ),
    {precision: 7, mutate: true, coordinates: 2}
  )
}

function buildFeature(feaBlock, ctx) {
  const {featureType} = feaBlock
  if (featureType in featureTypes) {
    const {geometryType, renamedInto} = featureTypes[featureType]
    const layer = renamedInto || featureType.split('_')[0]
    const feature = prepareFeature(feaBlock, ctx)
    const objId = `${ctx.bundle ? ctx.bundle + ':' : ''}${feaBlock.id}(${layer})`
    feature.layer = layer
    try {
      const geometry = buildGeometry(geometryType, feaBlock, ctx)
      const errors = validate(geometry)
      if (errors.length === 0) {
        setGeometry(feature, geometry, ctx.proj)
      } else if (errors.length === 1 && errors[0] === 'has-self-intersection') {
        setGeometry(feature, deintersect(geometry, geometryType === 'MultiPolygon'), ctx.proj)
      } else if (errors.length === 1 && errors[0] === 'has-exterior-holes' && geometry.type == 'MultiPolygon') {
        const outers = geometry.coordinates.map(el => el.shift()).map(outer => polygon([outer]))
        const holes = [...geometry.coordinates.filter(el => el.length !== 0).map(h => polygon(h))]
        const new_output = []
        for (let outer of outers) {
          for (let hole of holes) {
            if (booleanWithin(hole, outer)) {
              outer.geometry.coordinates = [...outer.geometry.coordinates, ...hole.geometry.coordinates]
            }
          }
          new_output.push(outer)
        }
        setGeometry(feature, multiPolygon(new_output.map(el => el.geometry.coordinates)).geometry, ctx.proj)
      } else {
        rejectGeometry(feature, errors, objId)
      }
    } catch (error) {
      rejectGeometry(feature, [error.message], objId)
    }

    return finalizeFeature(feature)
  }

  console.error('Warning: FEA block without feature type')
}

module.exports = {buildFeature, featureTypes}
