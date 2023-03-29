class Block {
  setId(id) {
    if (this.id) throw new Error('Block ID already defined')
    this.id = id
  }
}

export {Block}
