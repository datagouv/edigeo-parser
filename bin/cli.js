#!/usr/bin/env node
const getStdin = require('get-stdin')
const {parse} = require('..')

async function doStuff() {
  const buf = await getStdin.buffer()
  const {layers} = await parse(buf)
  console.log('Found %d layers!', Object.keys(layers).length)
  for (const [key, value] of Object.entries(layers)) {
    console.log(`Layer name ${key}: ${value.length}`);
  }
}

doStuff().catch(error => {
  console.error(error)
  process.exit(1)
})
