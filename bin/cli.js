#!/usr/bin/env node
const getStdin = require('get-stdin')
const {parse} = require('../')
const analyze = require('../lib/analyze')

async function doStuff() {
  const buf = await getStdin.buffer()
  const result = await parse(buf)
  analyze(result)
}

doStuff().catch(console.error)
