/* Motor de cálculo do Simulador AM.
 * Trabalha em percentuais do valor do crédito (como as administradoras fazem) e converte para reais
 * pelo valor do crédito atualizado em cada mês. Sem dependências; roda no navegador e no Node (testes). */
(function (root) {
  'use strict';

  var BASES = {
    santander: {
      id: 'santander',
      administradora: 'Consórcio Santander',
      razao: 'Santander Brasil Administradora de Consórcio Ltda. · CNPJ 55.942.312/0001-06',
      fonte: 'Condições dos grupos divulgadas pelo Santander, com valores de outubro de 2026.',
      prazo: 240,
      taxaAdm: 24.99,
      fundoReserva: 2,
      reducao: 50,
      reducaoBase: 'fc',      // reduz só o fundo comum
      reducaoAte: 60,         // até a 60ª assembleia ou a contemplação
      lancePct: 20,
      lanceBase: 'credito',
      reajusteTaxa: 6.5,      // % por período, estimativa editável (índice do grupo)
      reajustePeriodo: 12,
      reajusteIndice: 'INCC',
      venda: 25,
      aplicacao: 1,
      grupos: [
        { id: '3217', taxaAdm: 24.99, vencimento: 30, exemplo: 120000 },
        { id: '3210', taxaAdm: 24.99, vencimento: 10, exemplo: 200000 },
        { id: '3216', taxaAdm: 24.99, vencimento: 30, exemplo: 300000 },
        { id: '3213', taxaAdm: 22.99, vencimento: 10, exemplo: 500000 }
      ],
      usos: ['Compra de imóveis', 'Reforma ou construção', 'Quitação de financiamento', 'Compra de terrenos']
    },
    servopa: {
      id: 'servopa',
      administradora: 'Consórcio Servopa',
      razao: 'Administradora Servopa',
      fonte: 'Premissas da planilha "Plano de investimento v6" da Servopa.',
      prazo: 240,
      taxaAdm: 25.5,          // taxa total da planilha
      fundoReserva: 0,
      reducao: 50,
      reducaoBase: 'total',   // parcela flex: reduz a parcela inteira
      reducaoAte: 0,          // 0 = até a contemplação
      lancePct: 15,
      lanceBase: 'plano',     // crédito × (1 + taxa total), como na planilha
      reajusteTaxa: 3.25,
      reajustePeriodo: 6,
      reajusteIndice: 'INCC/IPCA',
      venda: 25,
      aplicacao: 1,
      grupos: [],
      usos: []
    }
  };

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* p: { credito, prazo, taxaAdm, fundoReserva, reducao, reducaoBase, reducaoAte,
   *      reajusteTaxa, reajustePeriodo, contemplacao (mês ou 0), lanceTipo ('nenhum'|'fixo'|'livre'),
   *      lancePct, lanceBase, embutido (bool), abatimento ('parcela'|'prazo'), venda, aplicacao } */
  function simular(p) {
    var C = +p.credito || 0, n = Math.max(1, Math.round(+p.prazo || 1));
    var ta = +p.taxaAdm || 0, fr = +p.fundoReserva || 0;
    var total = 100 + ta + fr;                       // % do crédito a pagar no plano
    var red = clamp(+p.reducao || 0, 0, 100) / 100;
    var redPct = p.reducaoBase === 'total'
      ? total * (1 - red) / n
      : (100 * (1 - red) + ta + fr) / n;
    var integralPct = total / n;
    var redAte = Math.round(+p.reducaoAte || 0);     // 0 = até a contemplação
    var m = Math.round(+p.contemplacao || 0);        // 0 = sem contemplação simulada
    if (m > n) m = n;
    var r = (+p.reajusteTaxa || 0) / 100, per = Math.max(1, Math.round(+p.reajustePeriodo || 12));
    var fator = function (t) { return Math.pow(1 + r, Math.floor((t - 1) / per)); };

    var meses = [], pagoPct = 0, pagoR = 0, pct = red > 0 ? redPct : integralPct;
    var fase = red > 0 ? 'reduzida' : 'integral';
    var fimReducao = 0, lance = null, ultimo = n, saldoNoCredito = 0;
    var aplic = 0, i = (+p.aplicacao || 0) / 100;

    for (var t = 1; t <= ultimo; t++) {
      var f = fator(t), cred = C * f;
      var restantePct = Math.max(0, total - pagoPct);
      var mesPct = Math.min(pct, restantePct);
      var parcela = mesPct / 100 * cred;
      pagoPct += mesPct; pagoR += parcela;
      aplic = aplic * (1 + i) + parcela;
      var linha = { t: t, fator: f, credito: cred, pct: mesPct, parcela: parcela, pago: pagoR, pagoPct: pagoPct, fase: fase, aplicacao: aplic };
      meses.push(linha);

      // fim da redução por número de assembleias (Santander: 60ª)
      if (fase === 'reduzida' && redAte && t === redAte && t !== m) {
        fimReducao = t; fase = 'integral';
        pct = (total - pagoPct) / Math.max(1, n - t);
      }
      // contemplação ao fim do mês t
      if (t === m) {
        var lPct = 0, lR = 0;
        if (p.lanceTipo === 'fixo' || p.lanceTipo === 'livre') {
          var basePct = p.lanceBase === 'plano' ? 100 + ta + fr : 100;
          lR = (+p.lancePct || 0) / 100 * basePct / 100 * cred;
          lPct = lR / cred * 100;
          var maxPct = Math.max(0, total - pagoPct);
          if (lPct > maxPct) { lPct = maxPct; lR = lPct / 100 * cred; }
        }
        var restante = Math.max(0, total - pagoPct - lPct);
        var nivel = (total - pagoPct) / Math.max(1, n - t); // parcela cheia sem o lance
        var mesesRest = n - t;
        if (p.abatimento === 'prazo' && lPct > 0 && nivel > 0) {
          mesesRest = Math.min(n - t, Math.ceil(restante / nivel - 1e-9));
          pct = mesesRest > 0 ? restante / mesesRest : 0;
        } else {
          pct = mesesRest > 0 ? restante / mesesRest : 0;
        }
        if (fase === 'reduzida') fimReducao = t;
        fase = 'contemplado';
        pagoPct += lPct;
        if (mesesRest === 0 && restante > 0) saldoNoCredito = restante / 100 * cred; // sem meses: abate do crédito
        lance = {
          mes: t, pct: lPct, valor: lR, embutido: !!p.embutido,
          creditoMes: cred,
          creditoLiberado: cred - (p.embutido ? lR : 0) - saldoNoCredito,
          desembolso: p.embutido ? 0 : lR,
          parcelaDepois: pct / 100 * C * fator(t + 1),
          mesesRestantes: mesesRest,
          saldoNoCredito: saldoNoCredito
        };
        ultimo = t + mesesRest;
      }
    }

    var primeira = meses[0] ? meses[0].parcela : 0;
    var integralHoje = integralPct / 100 * C;
    var aposReducao = null;
    for (var k = 0; k < meses.length; k++) if (meses[k].fase !== 'reduzida' && k > 0 && meses[k - 1].fase === 'reduzida') { aposReducao = meses[k]; break; }

    // Visão de investimento (lógica da planilha Servopa), linha a linha:
    // "se a carta for contemplada por sorteio neste mês e vendida".
    var aCaminho = m ? simular(Object.assign({}, p, { contemplacao: 0 })).meses : meses;
    var custoEmb = function (cred) { return cred * (p.lanceBase === 'plano' ? total / 100 : 1) * ((+p.lancePct || 0) / 100); };
    var invest = aCaminho.map(function (l) {
      var venda = l.credito * (+p.venda || 0) / 100;
      var credLiq = l.credito - custoEmb(l.credito);
      var vendaEmb = credLiq * (+p.venda || 0) / 100;
      var lucro = venda - l.pago, lucroEmb = vendaEmb - l.pago;
      var estrategia = l.t > n - 12 ? 'previdenciaria' : (venda > l.pago ? 'financeira' : 'patrimonial');
      return { t: l.t, credito: l.credito, pago: l.pago, parcela: l.parcela, venda: venda, lucro: lucro, rent: l.pago ? lucro / l.pago : 0,
        creditoLiquido: credLiq, vendaEmb: vendaEmb, lucroEmb: lucroEmb, rentEmb: l.pago ? lucroEmb / l.pago : 0,
        aplicacao: l.aplicacao, estrategia: estrategia };
    });

    return {
      entrada: p, prazo: n, totalPct: total,
      parcelaReduzidaPct: redPct, parcelaIntegralPct: integralPct,
      primeiraParcela: primeira, parcelaIntegralHoje: integralHoje,
      aposReducao: aposReducao, fimReducao: fimReducao,
      totalPlanoHoje: C * total / 100,
      taxaMensal: (ta + fr) / n,
      totalPago: meses.length ? meses[meses.length - 1].pago : 0,
      ultimoMes: meses.length ? meses[meses.length - 1].t : 0,
      creditoFinal: C * fator(n),
      lance: lance, meses: meses, investimento: invest
    };
  }

  /* Financiamento para comparação. sistema: 'price' | 'sac'. taxaMes em %. */
  function financiar(pv, taxaMes, n, sistema) {
    var i = taxaMes / 100, parcelas = [], saldo = pv, total = 0;
    if (sistema === 'sac') {
      var amort = pv / n;
      for (var t = 1; t <= n; t++) { var pmt = amort + saldo * i; saldo -= amort; total += pmt; parcelas.push(pmt); }
    } else {
      var pm = i ? pv * i / (1 - Math.pow(1 + i, -n)) : pv / n;
      for (var u = 1; u <= n; u++) { total += pm; parcelas.push(pm); }
    }
    return { primeira: parcelas[0] || 0, ultima: parcelas[parcelas.length - 1] || 0, total: total, juros: total - pv, parcelas: parcelas };
  }

  function anualParaMensal(aa) { return (Math.pow(1 + aa / 100, 1 / 12) - 1) * 100; }

  var api = { BASES: BASES, simular: simular, financiar: financiar, anualParaMensal: anualParaMensal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AMCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
