#!/usr/bin/env node
import process from 'node:process'
import getStdin from 'get-stdin'
import debugFactory from 'debug'
import {parse, parseSrs} from '../lib/index.js'

const debug = debugFactory('edigeo-parser')

async function doStuff() {
  const buf = await getStdin.buffer()
  const srs = await parseSrs(buf)
  const {layers} = await parse(buf, {targetSrs: srs})
  console.log('Found %d layers!', Object.keys(layers).length)
  for (const [key, value] of Object.entries(layers)) {
    console.log(`Layer name ${key}: ${value.length}`)
    for (const feature of value) {
      debug(JSON.stringify(feature))
    }
  }

  console.log(srs)
}

doStuff().catch(error => {
  console.error(error)
  process.exit(1)
})
