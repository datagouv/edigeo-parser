#!/usr/bin/env node
const getStdin = require('get-stdin')
const {parseBundleBuffer} = require('../lib/io/buffers')
const analyze = require('../lib/analyze')

async function doStuff() {
  const buf = await getStdin.buffer()
  const result = await parseBundleBuffer(buf)
  analyze(result)
}

doStuff().catch(console.error)
