import {getFullId} from '../helpers/ns.js'

async function parseBundle(input, extractFiles, parseOne) {
  const {thf, geo, t1, t2, t3, s1, qal} = await extractFiles(input)

  if (!thf || !geo || !t1 || !t2 || !t3 || !s1 || !qal) {
    throw new Error('Missing required files in EDIGÉO bundle')
  }

  /* eslint camelcase: off */
  const items = {
    SeTOP_1: await parseOne(t1),
    SeTOP_2: await parseOne(t2),
    SeTOP_3: await parseOne(t3),
    SeSPA_1: await parseOne(s1),
    GEO: await parseOne(geo),
    QAL: await parseOne(qal),
  }

  const acc = {}
  for (const [key, value] of Object.entries(items)) {
    for (const localItemId of Object.keys(value)) {
      const item = value[localItemId]
      item.ns = key
      item.fullId = getFullId(localItemId, key)
      acc[item.fullId] = value[localItemId]
    }
  }

  return acc
}

export {parseBundle}
