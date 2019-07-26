const Block = require('./base')

class PNOBlock extends Block {
  constructor() {
    super()
    this.blockType = 'PNO'
    this.coordinates = []
  }

  addLine({code, parsedValue}) {
    if (code === 'COR') {
      this.coordinates.push(parsedValue)
    } else if (code === 'TYP') {
      this.typeNoeud = code
    }
  }

  toGeometry() {
    if (this.coordinates.length === 0) {
      throw new Error('Unable to process internal geometry for PNO: no coordinates')
    }

    if (this.coordinates.length > 1) {
      throw new Error('Unable to process internal geometry for PNO: too many coordinates')
    }

    return {
      type: 'Point',
      coordinates: this.coordinates[0]
    }
  }
}

module.exports = PNOBlock
