import {ALLOWED_RELATIVE_POSITIONS, RELATIVE_POSITIONS} from './relations.js'

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

    for (const rel of this.ctx.getRelations(arcId)) {
      const {relationType} = this.ctx.getItem(rel.through)
      if (!ALLOWED_RELATIVE_POSITIONS.includes(relationType)) {
        continue
      }

      const relativePosition = RELATIVE_POSITIONS[relationType]
      if (result[relativePosition]) {
        throw new Error(`Arc ${arcId} has multiple faces on its ${relativePosition} side`)
      }

      result[relativePosition] = rel.rel
    }

    this._right = result.right
    this._left = result.left
    this._facesAttached = true
  }

  get left() {
    this.attachFaces()
    if (this._left) {
      return this.ctx.faces[this._left]
    }

    return null
  }

  get right() {
    this.attachFaces()
    if (this._right) {
      return this.ctx.faces[this._right]
    }

    return null
  }
}

export default Arc
