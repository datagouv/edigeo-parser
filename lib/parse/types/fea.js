const Block = require('./base')

class FEABlock extends Block {
  constructor() {
    super()
    this.blockType = 'FEA'
    this.attributes = {}
  }

  addLine({code, parsedValue}) {
    if (code === 'ATP') {
      if (this.capturingAttribute) {
        throw new Error('Already capturing attribute')
      }

      this.capturingAttribute = parsedValue[3]
    } else if (code === 'ATV') {
      if (!this.capturingAttribute) {
        throw new Error('Found orphean attribute')
      }

      this.attributes[this.capturingAttribute] = parsedValue
      this.capturingAttribute = undefined
    } else if (code === 'SCP') {
      this.featureType = parsedValue[3]
    } else if (code === 'QAP' && parsedValue[2] === 'QUP') {
      this.qup = 'QAL:' + parsedValue[3]
    }
  }
}

module.exports = FEABlock
