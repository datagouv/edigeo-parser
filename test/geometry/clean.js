import {createRequire} from 'node:module'
import test from 'ava'
import {deintersectMultiPolygon, deintersectPolygon} from '../../lib/geometry/clean.js'

const require = createRequire(import.meta.url)

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
  t.throws(() => deintersectPolygon(selfIntersectingPolygon, 0.000_001), undefined, 'Failed to deintersect polygon: significant secondary polygon')
})

