import { mapKeys } from 'lodash-es';

function getDates(qup, ctx) {
  const result = {}
  const qupBlock = ctx.getItem(qup)
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

export {buildProperties};
