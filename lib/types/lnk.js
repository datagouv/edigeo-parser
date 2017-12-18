const Block = require('./base')

class LNKBlock extends Block {

  constructor() {
    super()
    this.blockType = 'LNK'
    this.children = []
  }

  addLine({code, parsedValue}) {
    if (code === 'SNS') {
      this.sens = parsedValue
    } else if (code === 'FTP') {
      if (this.parent) {
        this.children.push({ns: parsedValue[1], type: parsedValue[2], id: parsedValue[3]})
      } else {
        this.parent = {ns: parsedValue[1], type: parsedValue[2], id: parsedValue[3]}
      }
    } else if (code === 'SCP') {
      this.relationType = parsedValue[3]
    }
  }

}

module.exports = LNKBlock
