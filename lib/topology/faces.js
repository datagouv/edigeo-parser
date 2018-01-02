const {pull} = require('lodash')
const {getAdjacentFaces} = require('./relations')

function recursivelyResolveFaces(startFaceId, indexedItems, graphIndex) {
  const face = indexedItems[startFaceId]
  face.resolved = true
  getAdjacentFaces(startFaceId, indexedItems, graphIndex)
    .map(f => indexedItems[f])
    .forEach(f => {
      if (f.resolved) {
        return
      }
      const adjacentRings = f.rings.filter(ring => ring.relatedFaces.includes(startFaceId))
      if (adjacentRings.length === 0) {
        throw new Error('Adjacent face has no adjacent ring!!')
      }
      if (adjacentRings.length > 1) {
        throw new Error('Adjacent face has multiple adjacent rings!!')
      }
      const adjacentRing = adjacentRings[0]
      f.exteriorRing = adjacentRing.coordinates
      f.holes = pull(f.rings, adjacentRing).map(r => r.coordinates)
      recursivelyResolveFaces(f.fullId, indexedItems, graphIndex)
    })
}

function resolveOneFace(faceId, indexedItems) {
  const face = indexedItems[faceId]
  if (face.resolved) {
    return
  }
  const exteriorRing = face.rings.find(ring => ring.relatedFaces.length === 1 && ring.relatedFaces[0] === faceId)
  face.exteriorRing = exteriorRing.coordinates
  face.holes = pull(face.rings, exteriorRing).map(r => r.coordinates)
  face.resolved = true
}

module.exports = {recursivelyResolveFaces, resolveOneFace}

/*
   1) On marque les Face_0 comme résolues (ce sont les faces extérieures de la topologie)
   2) Pour chaque face résolue, on recherche les faces adjacentes
   3a) Pour chaque face adjacente non résolue, on détermine les anneaux
   3b) On marque l'anneau qui adjacent (arc en commun) comme anneau externe
   3c) On marque les autres anneaux comme anneaux internes (trous)
   3d) On marque la face comme résolue
   4) Terminé

   Pour chaque objet géographique de type polygone on construit la géométrie à partir de la face (Polygon) ou les faces (MultiPolygon) correspondants
*/
