const test = require('ava')
const {deintersectMultiPolygon, deintersectPolygon} = require('../../lib/geometry/clean')

test('deintersectMultiPolygon: regular behavior', t => {
  const selfIntersectingPolygon = require('./fixtures/self-intersecting-multipolygon.json')
  const deintersectedPolygon = deintersectMultiPolygon(selfIntersectingPolygon)
  t.is(deintersectedPolygon.type, 'MultiPolygon')
  t.is(deintersectedPolygon.coordinates.length, 2)
})

test('deintersectPolygon: regular behavior', t => {
  const selfIntersectingPolygon = require('./fixtures/self-intersecting-polygon.json').features[0].geometry
  const deintersectedPolygon = deintersectPolygon(selfIntersectingPolygon)
  t.is(deintersectedPolygon.type, 'Polygon')
})

test('deintersectPolygon: significant secondary polygon', t => {
  const selfIntersectingPolygon = require('./fixtures/self-intersecting-polygon.json').features[0].geometry
  t.throws(() => deintersectPolygon(selfIntersectingPolygon, 0.000001), 'Failed to deintersect polygon: significant secondary polygon')
})
