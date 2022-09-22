import { getFullId } from '../helpers/ns.js';
import { Block } from './base.js';

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
        this.children.push(getFullId(parsedValue[3], parsedValue[1]))
      } else {
        this.parent = getFullId(parsedValue[3], parsedValue[1])
      }
    } else if (code === 'SCP') {
      this.relationType = parsedValue[3]
    }
  }
}

export default LNKBlock;
