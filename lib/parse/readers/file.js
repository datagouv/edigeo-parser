import decompress from 'decompress'
import {parseStream} from '../parse.js'
import {bufferToStream} from '../../util.js'
import {parseBundle} from './common.js'

async function extractFiles(bundleFileName) {
  const files = await decompress(bundleFileName, {strip: 10})

  return {
    thf: files.find(f => f.path.endsWith('.THF')),
    geo: files.find(f => f.path.endsWith('.GEO')),
    t1: files.find(f => f.path.endsWith('T1.VEC')),
    t2: files.find(f => f.path.endsWith('T2.VEC')),
    t3: files.find(f => f.path.endsWith('T3.VEC')),
    s1: files.find(f => f.path.endsWith('S1.VEC')),
    qal: files.find(f => f.path.endsWith('.QAL')),
  }
}

function parseBuffer(buffer) {
  return parseStream(bufferToStream(buffer.toString('latin1')))
}

function parseBundleFile(path) {
  return parseBundle(path, extractFiles, file => parseBuffer(file.data))
}

export {parseBuffer, parseBundleFile}
