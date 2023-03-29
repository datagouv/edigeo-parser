import {Block} from './base.js'

class QUPBlock extends Block {
  constructor() {
    super()
    this.blockType = 'QUP'
    this.attributes = {}
  }

  addLine({code, parsedValue}) {
    if (code === 'UDA') {
      this.updatedAt = parsedValue
    } else if (code === 'ODA') {
      this.createdAt = parsedValue
    }
  }
}

export default QUPBlock
