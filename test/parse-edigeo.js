/* eslint camelcase: off */

const test = require('ava')
const streamify = require('stream-array')
const {parseLine, parseStream} = require('../lib/parse')

async function parseLines(lines) {
  const readable = streamify(lines)
  return parseStream(readable)
}

test('parseLine-COR', t => {
  const line = 'CORCC23:+579588.05;+6680876.27;'
  t.deepEqual(parseLine(line).parsedValue, [579588.05, 6680876.27])
})

test('parseObject-PAR', async t => {
  const result = await parseLines([
    'RTYSA03:PAR',
    'RIDSA06:Arc_99',
    'SCPCP28:EDZE01;SeSD;PGE;ID_S_PRI_ARC',
    'CM1CC00:',
    'CM2CC00:',
    'TYPSN01:1',
    'PTCSN01:3',
    'CORCC23:+580566.36;+6680791.23;',
    'CORCC23:+580558.41;+6680802.61;',
    'CORCC23:+580541.68;+6680828.28;',
    'ATCSN01:0',
    'QACSN01:0'
  ])
  t.truthy(result.Arc_99)
  t.deepEqual(result.Arc_99.coordinates, [[580566.36, 6680791.23], [580558.41, 6680802.61], [580541.68, 6680828.28]])
})

test('parseObject-PNO', async t => {
  const result = await parseLines([
    'RTYSA03:PNO',
    'RIDSA07:Noeud_1',
    'SCPCP28:EDHK01;SeSD;PGE;ID_S_PRI_NOD',
    'TYPSN01:1',
    'CORCC24:+1743020.76;+7178777.64;',
    'ATCSN01:0',
    'QACSN01:0'
  ])
  t.truthy(result.Noeud_1)
  t.deepEqual(result.Noeud_1.coordinates, [[1743020.76, 7178777.64]])
})

test('parseObject-FEA', async t => {
  const result = await parseLines([
    'RTYSA03:FEA',
    'RIDSA12:Objet_279590',
    'SCPCP27:EDZE01;SeSD;OBJ;PARCELLE_id',
    'CM1CC00:',
    'CM2CC00:',
    'REFCC00:',
    'ATCSN01:5',
    'ATPCP23:EDZE01;SeSD;ATT;SUPF_id',
    'ATVSR07:+64318.',
    'ATPCP23:EDZE01;SeSD;ATT;INDP_id',
    'ATVSA02:01',
    'ATPCP23:EDZE01;SeSD;ATT;COAR_id',
    'TEXT 06:8859-1',
    'ATVST01:A',
    'ATPCP22:EDZE01;SeSD;ATT;TEX_id',
    'TEXT 06:8859-1',
    'ATVST01:6',
    'ATPCP22:EDZE01;SeSD;ATT;IDU_id',
    'TEXT 06:8859-1',
    'ATVST12:244000ZE0006',
    'QACSN01:1',
    'QAPCP38:EDZE01;SeQL;QUP;Actualite_Objet_279590'
  ])
  t.truthy(result.Objet_279590)
  t.is(result.Objet_279590.featureType, 'PARCELLE_id')
  t.deepEqual(result.Objet_279590.attributes, {
    SUPF_id: 64318,
    INDP_id: '01',
    COAR_id: 'A',
    TEX_id: '6',
    IDU_id: '244000ZE0006'
  })
})

test('parseObject-LNK', async t => {
  const result = await parseLines([
    'RTYSA03:LNK',
    'RIDSA24:Compo_IND_Arc_99_Noeud_1',
    'SCPCP32:EDZE01;SeSD;REL;ID_S_RCO_NOD_INI',
    'FTCSN01:2',
    'FTPCP25:EDZE01;SeTOP_1;PAR;Arc_99',
    'FTPCP26:EDZE01;SeTOP_1;PNO;Noeud_1',
    'ATCSN01:0',
    'QACSN01:0'
  ])
  t.truthy(result.Compo_IND_Arc_99_Noeud_1)
  t.deepEqual(result.Compo_IND_Arc_99_Noeud_1.parent, {ns: 'SeTOP_1', type: 'PAR', id: 'Arc_99'})
  t.deepEqual(result.Compo_IND_Arc_99_Noeud_1.children, [{ns: 'SeTOP_1', type: 'PNO', id: 'Noeud_1'}])
})
