#!/usr/bin/env node
const getStdin = require('get-stdin')
const {parse} = require('..')

async function doStuff() {
  const buf = await getStdin.buffer()
  const {layers} = await parse(buf)
  console.log('Found %d layers!', Object.keys(layers).length)
}

doStuff().catch(error => {
  console.error(error)
  process.exit(1)
})
