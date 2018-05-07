const test = require('ava')
const {deintersectPolygon} = require('../../lib/geometry/clean')

test('deintersectPolygon: regular behavior', t => {
  const selfIntersectedPolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [
          0.06,
          46.57
        ],
        [
          0.71,
          47.82
        ],
        [
          2.48,
          46.05
        ],
        [
          1.93,
          47.65
        ],
        [
          0.06,
          46.57
        ]
      ]
    ]
  }
  const deintersectedPolygon = deintersectPolygon(selfIntersectedPolygon)
  t.is(deintersectedPolygon.type, 'MultiPolygon')
  t.is(deintersectedPolygon.coordinates.length, 2)
})
