'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyObservation, aggregateObservations, csvCell, summarizeBenchmark } = require('./DeveloperTest.js');
const matched = id => ({ status:'matched', profile:{ id, name:id } });

test('a pessoa esperada identificada é verdadeiro positivo', () => {
  assert.deepEqual(classifyObservation('alice', [matched('alice')]), { scored:true, correct:true, tp:1, fp:0, fn:0, tn:0, reason:'true_positive' });
});

test('identidade incorreta conta falso positivo e falso negativo', () => {
  const observation = classifyObservation('alice', [matched('bob')]);
  assert.equal(observation.fp, 1);
  assert.equal(observation.fn, 1);
  assert.equal(observation.correct, false);
});

test('rosto esperado ausente conta falso negativo', () => {
  assert.equal(classifyObservation('alice', []).fn, 1);
  assert.equal(classifyObservation('alice', [{ status:'low_quality' }]).fn, 1);
});

test('pessoa desconhecida corretamente rejeitada é verdadeiro negativo', () => {
  assert.equal(classifyObservation('__unknown__', [{ status:'unknown' }]).tn, 1);
  assert.equal(classifyObservation('__unknown__', [matched('alice')]).fp, 1);
});

test('sem anotação e múltiplos rostos não geram pontuação', () => {
  assert.equal(classifyObservation('', [matched('alice')]).scored, false);
  assert.equal(classifyObservation('alice', [matched('alice'), matched('bob')]).scored, false);
  assert.equal(classifyObservation('__unknown__', []).scored, false);
});

test('métricas agregadas mantêm denominadores e identidade incorreta', () => {
  const records = [{ expected:'alice', faces:[matched('alice')] }, { expected:'alice', faces:[matched('bob')] }, { expected:'alice', faces:[] }, { expected:'__unknown__', faces:[{ status:'unknown' }] }, { expected:'', faces:[] }];
  const metrics = aggregateObservations(records);
  assert.equal(metrics.precision, 0.5);
  assert.equal(metrics.recall, 1 / 3);
  assert.equal(metrics.accuracy, 0.5);
  assert.equal(metrics.scored, 4);
  assert.equal(metrics.excluded, 1);
});

test('sem medições válidas as métricas não inventam resultados', () => {
  const metrics = aggregateObservations([]);
  assert.equal(metrics.precision, null);
  assert.equal(metrics.recall, null);
  assert.equal(metrics.accuracy, null);
});

test('CSV escapa aspas, delimitadores e fórmulas de planilha', () => {
  assert.equal(csvCell('Ana; "A"\nSilva'), '"Ana; ""A""\nSilva"');
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell('\t+1'), '"\'\t+1"');
  assert.equal(csvCell(null), '""');
});

test('benchmark só pontua quando tem rostos completos', () => {
  const results = summarizeBenchmark([{ scale:1, faces:[matched('alice')] }, { scale:0.1, faces:0 }], 'alice');
  assert.equal(results[0].observation.tp, 1);
  assert.equal(results[0].faceCount, 1);
  assert.equal(results[1].observation, null);
});
