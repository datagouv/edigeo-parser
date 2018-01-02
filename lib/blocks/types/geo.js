const Block = require('./base')

class GEOBlock extends Block {

  constructor() {
    super()
    this.blockType = 'GEO'
    this.id = 'GEO'
  }

  addLine({code, parsedValue}) {
    if (code === 'REL') {
      this.srsCode = parsedValue
    }
  }

  setId() {
    // Override base behavior
  }

}

module.exports = GEOBlock
