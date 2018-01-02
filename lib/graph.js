function createGraphIndexEntry(graphIndex, from, to, through) {
  if (!(from in graphIndex)) {
    graphIndex[from] = []
  }
  if (!(to in graphIndex)) {
    graphIndex[to] = []
  }
  graphIndex[from].push({rel: to, through})
  graphIndex[to].push({rel: from, through})
}

function createGraphIndex(relations) {
  return relations.reduce((graphIndex, relation) => {
    if (!relation.children || !relation.parent) return graphIndex
    relation.children.forEach(child => createGraphIndexEntry(graphIndex, relation.parent, child, relation.fullId))
    return graphIndex
  }, {})
}

module.exports = {createGraphIndex, createGraphIndexEntry}
