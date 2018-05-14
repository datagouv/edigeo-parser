const Block = require('./base')

class PARBlock extends Block {
  constructor() {
    super()
    this.blockType = 'PAR'
    this.coordinates = []
  }

  addLine({code, parsedValue}) {
    if (code === 'COR') {
      this.coordinates.push(parsedValue)
    }
  }

  toGeometry() {
    if (this.coordinates.length === 0) {
      throw new Error('Unable to process internal geometry for PAR: no coordinates')
    }
    if (this.coordinates.length === 1) {
      throw new Error('Unable to process internal geometry for PNO: too few coordinates')
    }
    return {
      type: 'LineString',
      coordinates: this.coordinates
    }
  }
}

module.exports = PARBlock
