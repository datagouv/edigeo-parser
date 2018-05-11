class Node {

  constructor(pnoBlock, ctx) {
    this.ctx = ctx
    this.id = pnoBlock.id
    this.fullId = pnoBlock.fullId
    this.ns = pnoBlock.ns
    this.position = pnoBlock.coordinates[0]
  }

}

module.exports = Node
