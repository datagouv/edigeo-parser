const {ALLOWED_RELATIVE_POSITIONS} = require('./relations')

class Face {

  constructor(face, ctx) {
    this.ctx = ctx
    this.id = face.id
    this.fullId = face.fullId
    this.ns = face.ns

    this.attachArcs()
  }

  isSPA() {
    return this.ns === 'SeSPA_1'
  }

  hasRelatedFeature() {
    const relations = this.ctx.graphIndex[this.fullId]
    return relations.some(relation => {
      const obj = this.ctx.graphIndex[relation.rel]
      return obj.blockType === 'FEA'
    })
  }

  attachArcs() {
    const faceId = this.fullId
    const {indexedItems, graphIndex} = this.ctx

    this._arcs = (graphIndex[faceId] || [])
      .filter(rel => {
        const {relationType} = indexedItems[rel.through]
        return ALLOWED_RELATIVE_POSITIONS.includes(relationType)
      })
      .map(rel => rel.rel)
  }

  get arcs() {
    return this._arcs.map(arcId => this.ctx.arcs[arcId])
  }

  get topologyMode() {
    return this.ns.includes('TOP') ? 'TOP' : 'SPA'
  }

}

module.exports = Face
