# edigeo-parser

Parse les données EDIGEO pour les convertir en GeoJSON (sans reprojection en WGS 84)

## Utilisation côté serveur

### Installation

```bash
npm install @etalab/edigeo-parser
```

Si vous avez besoin de la syntaxe CommonJS, vous pouvez utiliser la version 0.9.1 plus ancienne du package et l'installer avec la commande `npm install @etalab/edigeo-parser@0.9.1`

### Exemple d'utilisation

Obtenir la donnée

```
wget https://cadastre.data.gouv.fr/data/dgfip-pci-vecteur/2023-01-01/edigeo/feuilles/54/54008/edigeo-540080000C01.tar.bz2
```

#### Exemple avec la syntaxe ES6

Soit le fichier `index-es6.mjs` comme suivant

```js
import { writeFile } from 'fs/promises'
import {parse} from '@etalab/edigeo-parser'

async function run(filePath) {
  const {layers} = await parse(filePath)
  console.log(Object.keys(layers))
  //console.log(layers)
  await writeFile('edigeo-540080000C01-parcelles.geojson', JSON.stringify({
    "type": "FeatureCollection",
    "features": layers.PARCELLE
  }))
}

run('edigeo-540080000C01.tar.bz2').catch(console.error);
```


#### Exemple avec la syntaxe CommonJS

Pour rappel, elle ne fonctionne que si vous avez le package `@etalab/edigeo-parser@0.9.1` package.

Soit le fichier `index-commonjs.mjs` comme suivant

```js
const fs = require('fs')
const fsPromises = fs.promises
const {parse} = require('@etalab/edigeo-parser')

async function run(filePath) {
  const {layers} = await parse(filePath)
  console.log(Object.keys(layers))
  //console.log(layers)
  await fsPromises.writeFile('edigeo-540080000C01-parcelles.geojson', JSON.stringify({
    "type": "FeatureCollection",
    "features": layers.PARCELLE
  }))
}

run('edigeo-540080000C01.tar.bz2').catch(console.error);
```

## Utilisation en ligne de commande

Attention! Il s'agit d'un cas limité qui ne permet pas de sortir directement les données, juste de vérifier le nombre de couches qui sont parsées et le nombre d'objets géographiques associés.

### Installation

```bash
npm install -g @etalab/edigeo-parser
```

### Exemple d'utilisation

```bash
edigeo-parse < edigeo-540080000C01.tar.bz2
```

## Licence

MIT
