import { getFullId } from '../helpers/ns.js';

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
    QAL: await parseOne(qal)
  }

  return Object.keys(items)
    .reduce((acc, ns) => {
      Object.keys(items[ns]).forEach(localItemId => {
        const item = items[ns][localItemId]
        item.ns = ns
        item.fullId = getFullId(localItemId, ns)
        acc[item.fullId] = items[ns][localItemId]
      })
      return acc
    }, {})
}

export {parseBundle};
