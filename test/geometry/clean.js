const test = require('ava')
const {deintersectPolygon} = require('../../lib/geometry/clean')

test('deintersectPolygon: regular behavior', t => {
  const selfIntersectingPolygon = require('./fixtures/self-intersecting-polygon.json')
  const deintersectedPolygon = deintersectPolygon(selfIntersectingPolygon)
  t.is(deintersectedPolygon.type, 'MultiPolygon')
  t.is(deintersectedPolygon.coordinates.length, 2)
})
