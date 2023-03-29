import {getFullId} from '../helpers/ns.js'
import {Block} from './base.js'

class LNKBlock extends Block {
  constructor() {
    super()
    this.blockType = 'LNK'
    this.children = []
  }

  addLine({code, parsedValue}) {
    switch (code) {
      case 'SNS': {
        this.sens = parsedValue

        break
      }

      case 'FTP': {
        if (this.parent) {
          this.children.push(getFullId(parsedValue[3], parsedValue[1]))
        } else {
          this.parent = getFullId(parsedValue[3], parsedValue[1])
        }

        break
      }

      case 'SCP': {
        this.relationType = parsedValue[3]

        break
      }
    // No default
    }
  }
}

export default LNKBlock
