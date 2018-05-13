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

  attachArcs() {
    this._arcs = this.ctx.getRelations(this.fullId)
      .filter(rel => {
        const {relationType} = this.ctx.getItem(rel.through)
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
