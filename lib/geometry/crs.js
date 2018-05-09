'use strict'

const {invert} = require('lodash')

// Based on http://geodesie.ign.fr/contenu/fichiers/SRCfrance.pdf
const IGNF = {
  LAMB93: 2154,
  // Métropole Lambert-93 / 9 zones
  RGF93CC42: 3942,
  RGF93CC43: 3943,
  RGF93CC44: 3944,
  RGF93CC45: 3945,
  RGF93CC46: 3946,
  RGF93CC47: 3947,
  RGF93CC48: 3948,
  RGF93CC49: 3949,
  RGF93CC50: 3950,
  // Antilles
  WGS84UTM20: 32620, // Légal
  GUADFM49U20: 2969, // Saint-Barthelemy et Saint-Martin historique
  GUAD48UTM20: 2970, // Guadeloupe historique
  MART38UTM20: 2973, // Martinique historique
  // Guyane
  RGFG95UTM22: 2972, // Légal
  // Mayotte
  RGM04UTM38S: 4471, // Légal
  // Réunion
  RGR92UTM40S: 2975 // Légal
}

const corrections = {
  RGR92UTM: 'RGR92UTM40S',
  RGM04: 'RGM04UTM38S'
}

const byEPSGCodeIndex = invert(IGNF)

function ignf2epsg(ignfCode) {
  if (!(ignfCode in IGNF) && !(ignfCode in corrections)) {
    throw new Error('Unknown IGNF code: ' + ignfCode)
  }
  const correctedCode = ignfCode in corrections ? corrections[ignfCode] : ignfCode
  return IGNF[correctedCode]
}

function epsg2ignf(epsgCode) {
  if (!(epsgCode in byEPSGCodeIndex)) {
    throw new Error('No IGNF matching code: ' + epsgCode)
  }
  return byEPSGCodeIndex[epsgCode]
}

function getReferenceByEPSGCode(code) {
  try {
    return require('epsg-index/s/' + code + '.json')
  } catch (err) {
    const newErr = new Error('Unknown EPSG code: ' + code)
    newErr.originalError = err
    throw newErr
  }
}

function getReference(code) {
  if (typeof code === 'number' && Number.isInteger(code)) {
    return getReferenceByEPSGCode(code)
  }
  if (typeof code === 'string') {
    const epsgCode = ignf2epsg(code)
    return getReferenceByEPSGCode(epsgCode)
  }
  throw new Error('Unknown spatial reference: ' + code)
}

module.exports = {ignf2epsg, epsg2ignf, getReference}
