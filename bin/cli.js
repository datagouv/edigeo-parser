#!/usr/bin/env node
const getStdin = require('get-stdin')
const {parse} = require('../')

async function doStuff() {
  const buf = await getStdin.buffer()
  const {features} = await parse(buf)
  console.log(features)
}

doStuff().catch(console.error)
