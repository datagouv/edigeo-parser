#!/usr/bin/env node
import process from 'node:process'
import getStdin from 'get-stdin'
import debugFactory from 'debug'
import {parse} from '../lib/index.js'

const debug = debugFactory('edigeo-parser')

async function doStuff() {
  const buf = await getStdin.buffer()
  const {layers} = await parse(buf)
  console.log('Found %d layers!', Object.keys(layers).length)
  for (const [key, value] of Object.entries(layers)) {
    console.log(`Layer name ${key}: ${value.length}`)
    for (const feature of value) {
      debug(JSON.stringify(feature))
    }
  }
}

doStuff().catch(error => {
  console.error(error)
  process.exit(1)
})
