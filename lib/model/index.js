const {chain, groupBy, isFunction} = require('lodash')
const Face = require('./face')
const Arc = require('./arc')

class Model {
  constructor({bundle, indexedItems, overrideSrsCode}) {
    this.bundle = bundle

    this._idIndex = indexedItems
    this._typeIndex = groupBy(Object.values(indexedItems), 'blockType')

    this._createGraphIndex()

    this.arcs = chain(this.getItems('PAR'))
      .map(arc => new Arc(arc, this))
      .keyBy('fullId')
      .value()

    this.faces = chain(this.getItems('PFE'))
      .map(face => new Face(face, this))
      .keyBy('fullId')
      .value()

    this.srsCode = overrideSrsCode || this.getItem('GEO:GEO').srsCode

    if (!this.srsCode) {
      throw new Error('No SRS code defined for this bundle')
    }
  }

  getItem(id) {
    return this._idIndex[id]
  }

  getItems(itemType) {
    return this._typeIndex[itemType] || []
  }

  /* Relations */

  getPrimitives(itemId) {
    return this.getRelatedObjects(itemId, relationType => relationType.startsWith('ID_S_RCO_'))
  }

  getRelatedObjects(itemId, matchRelationType) {
    const relations = this._graphIndex[itemId] || []
    return relations
      .filter(rel => {
        const through = this.getItem(rel.through)
        if (isFunction(matchRelationType)) {
          return matchRelationType(through.relationType)
        }
        return through.relationType === matchRelationType
      })
      .map(rel => rel.rel)
  }

  getRelations(itemId) {
    return this._graphIndex[itemId] || []
  }

  /* Graph index */

  _createGraphIndex() {
    this._graphIndex = {}
    this.getItems('LNK').forEach(relation => {
      if (!relation.children || !relation.parent) return
      relation.children.forEach(child => this._createGraphIndexEntry(relation.parent, child, relation.fullId))
    })
  }

  _createGraphIndexEntry(from, to, through) {
    if (!(from in this._graphIndex)) {
      this._graphIndex[from] = []
    }
    if (!(to in this._graphIndex)) {
      this._graphIndex[to] = []
    }
    this._graphIndex[from].push({rel: to, through})
    this._graphIndex[to].push({rel: from, through})
  }
}

function createModel(options) {
  return new Model(options)
}

module.exports = {createModel}
