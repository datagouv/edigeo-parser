const {ALLOWED_RELATIVE_POSITIONS, RELATIVE_POSITIONS} = require('../relations')

class Arc {

  constructor(arc, ctx) {
    this.ctx = ctx
    this.id = arc.fullId
    this.fullId = arc.fullId
    this.ns = arc.ns
    this.coordinates = arc.coordinates
    this._facesAttached = false
  }

  attachFaces() {
    if (this._facesAttached) {
      return
    }
    const result = {}
    const arcId = this.fullId
    const {indexedItems, graphIndex} = this.ctx

    graphIndex[arcId]
      .forEach(rel => {
        const {relationType} = indexedItems[rel.through]
        if (!ALLOWED_RELATIVE_POSITIONS.includes(relationType)) {
          return
        }
        const relativePosition = RELATIVE_POSITIONS[relationType]
        if (result[relativePosition]) {
          throw new Error(`Arc ${arcId} has multiple faces on its ${relativePosition} side`)
        }
        result[relativePosition] = rel.rel
      })

    this._right = result.right
    this._left = result.left
    this._facesAttached = true
  }

  get left() {
    this.attachFaces()
    if (this._left) {
      return this.ctx.faces[this._left]
    }
  }

  get right() {
    this.attachFaces()
    if (this._right) {
      return this.ctx.faces[this._right]
    }
  }

}

module.exports = Arc
