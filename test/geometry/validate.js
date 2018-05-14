const test = require('ava')
const {validate} = require('../../lib/geometry/validate')

test('validate: self-intersecting polygon', t => {
  const poly = require('./fixtures/self-intersecting-multipolygon.json')
  const result = validate(poly)
  t.true(result.includes('has-self-intersection'))
  t.is(result.length, 1)
})

test('validate: polygon ring with too few coordinates', t => {
  const poly = {type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1]]]}
  const result = validate(poly)
  t.true(result.includes('ring-too-few-coords'))
  t.true(result.includes('ring-not-closed'))
  t.is(result.length, 2)
})

test('validate: polygon ring not closed', t => {
  const poly = {type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0]]]}
  const result = validate(poly)
  t.true(result.includes('ring-not-closed'))
  t.is(result.length, 1)
})

test('validate: polygon ring has duplicate vertices', t => {
  const poly = {type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 1], [1, 1], [0, 0]]]}
  const result = validate(poly)
  t.true(result.includes('ring-has-duplicate-vertices'))
  t.true(result.includes('has-self-intersection'))
  t.is(result.length, 2)
})

test('validate: polygon without ring', t => {
  const poly = {type: 'Polygon', coordinates: []}
  const result = validate(poly)
  t.true(result.includes('polygon-without-rings'))
  t.is(result.length, 1)
})

test('validate: polygon has exterior holes', t => {
  const poly = {type: 'Polygon', coordinates: [
    [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]],
    [[4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]
  ]}
  const result = validate(poly)
  t.true(result.includes('has-exterior-holes'))
  t.is(result.length, 1)
})

test('validate: polygon has crossing holes', t => {
  const poly = {type: 'Polygon', coordinates: [
    [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
    [[4, 4], [4, 6], [6, 6], [6, 4], [4, 4]],
    [[5, 5], [5, 7], [7, 7], [7, 5], [5, 5]]
  ]}
  const result = validate(poly)
  t.true(result.includes('has-crossing-holes'))
  t.true(result.includes('has-self-intersection'))
  t.is(result.length, 2)
})
