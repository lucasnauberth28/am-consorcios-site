// Confere o motor do simulador da equipe contra a planilha Servopa v6 e os anúncios do Santander.
import test from 'node:test';
import assert from 'node:assert/strict';
await import('../hostinger/public/admin/simulador/calc.js');
const A = globalThis.AMCalc, B = A.BASES;
const sim = (k, o) => A.simular({ ...B[k], ...o });
const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test('Santander: parcela reduzida dos anúncios (tolerância de R$ 0,35)', () => {
  for (const [c, ta, ad] of [[120000, 24.99, 385.00], [200000, 24.99, 641.60], [300000, 24.99, 962.40], [500000, 22.99, 1562.60]])
    near(sim('santander', { credito: c, taxaAdm: ta, reajusteTaxa: 0 }).primeiraParcela, ad, 0.35);
});

test('Servopa: mesmos valores da planilha Plano de investimento v6', () => {
  const r = sim('servopa', { credito: 100000 });
  near(r.meses[0].parcela, 261.4583, 0.001);
  near(r.meses[6].credito, 103250, 0.001);
  near(r.meses[239].pago, 125220.1077, 0.01);
  near(r.investimento[0].lucro, 24738.5417, 0.01);
  near(r.investimento[0].lucroEmb, 20032.2917, 0.01);
  near(r.investimento[239].aplicacao, 404524.6913, 0.5);
});

test('o total pago (com lance) sempre fecha 100% + taxas, sem reajuste', () => {
  for (const o of [{}, { contemplacao: 12, lanceTipo: 'fixo', embutido: true }, { contemplacao: 30, lanceTipo: 'livre', lancePct: 40, abatimento: 'prazo' }]) {
    const r = sim('santander', { credito: 300000, reajusteTaxa: 0, ...o });
    near(r.totalPago + (r.lance ? r.lance.valor : 0), 300000 * 1.2699, 0.5);
  }
});
