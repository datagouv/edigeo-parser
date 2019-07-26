const {isNumber, isArray} = require('lodash')
const proj4 = require('proj4')
const {getReference} = require('./crs')

function projAll(coords, proj) {
  if (isNumber(coords[0])) {
    return proj(coords)
  }

  if (isArray(coords[0])) {
    return coords.map(c => projAll(c, proj))
  }

  throw new Error('Malformed coordinates')
}

function createProj(from, to = 4326) {
  const fromProj = getReference(from).proj4
  const toProj = getReference(to).proj4
  const projPoint = coords => proj4(fromProj, toProj).forward(coords)
  return ({type, coordinates}) => ({type, coordinates: projAll(coordinates, projPoint)})
}

module.exports = {projAll, createProj}
