const {Duplex} = require('stream')

function bufferToStream(buffer) {
  const stream = new Duplex()
  stream.push(buffer)
  stream.push(null)
  return stream
}

module.exports = {bufferToStream}
