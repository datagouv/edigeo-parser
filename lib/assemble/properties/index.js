const {mapKeys} = require('lodash')

function getDates(qup, ctx) {
  const result = {}
  const qupBlock = ctx.indexedItems[qup]
  if (qupBlock && qupBlock.createdAt) {
    result.DATE_OBS = qupBlock.createdAt
  }
  if (qupBlock && qupBlock.updatedAt) {
    result.DATE_MAJ = qupBlock.updatedAt
  }
  return result
}

function buildProperties(fea, ctx) {
  const dates = fea.qup ? getDates(fea.qup, ctx) : {}
  return {
    ...mapKeys(fea.attributes, (v, k) => k.replace(/_id$/, '')),
    ...dates
  }
}

module.exports = {buildProperties}
