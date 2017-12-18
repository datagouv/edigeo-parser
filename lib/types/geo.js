const Block = require('./base')

class GEOBlock extends Block {

  constructor() {
    super()
    this.blockType = 'GEO'
  }

  addLine({code, parsedValue}) {
    if (code === 'REL') {
      this.srsCode = parsedValue
    }
  }

}

module.exports = GEOBlock
