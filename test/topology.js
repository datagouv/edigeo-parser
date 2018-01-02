const test = require('ava')
const {computeRings} = require('../lib/topology/rings')

test('not closed arc', t => {
  const arcs = [
    {id: 'Arc_1', coordinates: [[0, 0], [0, 1], [1, 1], [1, 0]], direction: 1, relatedFaces: ['Face_0', 'Face_1']}
  ]
  t.throws(() => computeRings(arcs))
})

test('closed arc', t => {
  const arcs = [
    {id: 'Arc_1', coordinates: [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]], direction: 1, relatedFaces: ['Face_0', 'Face_1']}
  ]
  t.deepEqual(computeRings(arcs), [
    {coordinates: [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]], relatedFaces: ['Face_0', 'Face_1']}
  ])
})

test('two connected arcs', t => {
  const arcs = [
    {id: 'Arc_1', coordinates: [[0, 0], [0, 1], [1, 1]], direction: 1, relatedFaces: ['Face_0', 'Face_1']},
    {id: 'Arc_2', coordinates: [[1, 1], [1, 0], [0, 0]], direction: 1, relatedFaces: ['Face_0', 'Face_1']}
  ]
  t.deepEqual(computeRings(arcs), [
    {coordinates: [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]], relatedFaces: ['Face_0', 'Face_1']}
  ])
})

test('two closed arcs', t => {
  const arcs = [
    {id: 'Arc_1', coordinates: [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]], direction: 1, relatedFaces: ['Face_0', 'Face_1']},
    {id: 'Arc_2', coordinates: [[5, 5], [5, 6], [6, 6], [6, 5], [5, 5]], direction: 1, relatedFaces: ['Face_0', 'Face_2']}
  ]
  t.deepEqual(computeRings(arcs), [
    {coordinates: [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]], relatedFaces: ['Face_0', 'Face_1']},
    {coordinates: [[5, 5], [5, 6], [6, 6], [6, 5], [5, 5]], relatedFaces: ['Face_0', 'Face_2']}
  ])
})

test('three arcs, two connected ones, one independant', t => {
  const arcs = [
    {id: 'Arc_1', coordinates: [[0, 0], [0, 1], [1, 1]], direction: 1, relatedFaces: ['Face_0', 'Face_1']},
    {id: 'Arc_2', coordinates: [[1, 1], [1, 0], [0, 0]], direction: 1, relatedFaces: ['Face_0', 'Face_1']},
    {id: 'Arc_3', coordinates: [[5, 5], [5, 6], [6, 6], [6, 5], [5, 5]], direction: 1, relatedFaces: ['Face_0', 'Face_2']}
  ]
  t.deepEqual(computeRings(arcs), [
    {coordinates: [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]], relatedFaces: ['Face_0', 'Face_1']},
    {coordinates: [[5, 5], [5, 6], [6, 6], [6, 5], [5, 5]], relatedFaces: ['Face_0', 'Face_2']}
  ])
})
