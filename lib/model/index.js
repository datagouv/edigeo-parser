const {chain, keyBy} = require('lodash')
const Face = require('./face')
const {createGraphIndex} = require('./graph')
const Arc = require('./arc')

class Model {
  constructor({bundle, indexedItems, overrideSrsCode}) {
    this.bundle = bundle
    this.indexedItems = indexedItems

    this.srsCode = overrideSrsCode || this.indexedItems['GEO:GEO'].srsCode

    if (!this.srsCode) {
      throw new Error('No SRS code defined for this bundle')
    }

    this.items = Object.values(indexedItems)

    const relations = this.items.filter(item => item.blockType === 'LNK')

    this.graphIndex = createGraphIndex(relations)

    this.arcs = chain(this.items)
      .filter(item => item.blockType === 'PAR')
      .map(arc => new Arc(arc, this))
      .keyBy('fullId')
      .value()

    const faces = this.items
      .filter(item => item.blockType === 'PFE')
      .map(face => new Face(face, this))

    // Indexed faces
    this.faces = keyBy(faces, 'fullId')
  }
}

function createModel(options) {
  return new Model(options)
}

module.exports = {createModel}
