function getRelatedParcelleProperties(subdfisc, ctx) {
  const relatedObjects = ctx.getRelatedObjects(`SeSPA_1:${subdfisc.id}`, 'SUBDFISC_PARCELLE')
  if (relatedObjects.length === 1) {
    const [relatedParcelle] = relatedObjects
    const [, parcelleId] = relatedParcelle.split(':')
    const parcelle = ctx.features[parcelleId]
    if (!parcelle) {
      console.error('Impossible de relier la subdivision fiscale à sa parcelle')
      return null
    }
    return {id: parcelle.properties.IDU}
  }
  console.error('Impossible de relier la subdivision fiscale à sa parcelle')
  return null
}

module.exports = {getRelatedParcelleProperties}
