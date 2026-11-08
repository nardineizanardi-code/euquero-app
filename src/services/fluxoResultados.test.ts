/**
 * mini-1.2f — A CORREÇÃO DO FLUXO "BUSCAR MÁQUINAS".
 *
 * ─────────────────────────────────────────────────────────────────────
 * O BUG QUE O DONO REPROVOU
 *
 * "ao clicar em 'Buscar Máquinas', o modal fecha, o aplicativo
 *  retorna à Home e não apresenta os resultados nem a mensagem de
 *  busca vazia."
 *
 * A causa: o `handleSubmitBuyer` fazia `setBuyerSuccess(true)` E
 * `onClose()` na mesma instrução. O `onClose()` desmonta o modal
 * (`if (!isOpen) return null`), então a tela de sucesso — que tem o
 * botão "Ver as máquinas disponíveis" — NUNCA era renderizada. A
 * pessoa voltava para a Home sem cards e sem a tela que leva aos
 * cards.
 *
 * Este arquivo testa o COMPORTAMENTO: o que o modal decide fazer em
 * cada caso, e a fiação no código real.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  decidirAposBuscar,
  textoDoEmptyState,
  TEXTO_SEM_PRODUTO,
} from './filtrosBusca';
import { tentarSalvarBusca } from './fichaBusca';

const raiz = join(import.meta.dirname, '..', '..');
const wizard = readFileSync(join(raiz, 'src', 'components', 'WizardModal.tsx'), 'utf-8');
const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf-8');

// ═══════════════════════════════════════════════════════════════════
// A DECISÃO: o que o modal faz depois do submit
// ═══════════════════════════════════════════════════════════════════

test('FLUXO: com resultado, a decisão é "resultados"', () => {
  const d = decidirAposBuscar({ ok: true, quantidade: 3 });
  assert.equal(d.tipo, 'resultados');
  assert.equal(d.quantidade, 3);
});

test('FLUXO: sem resultado, a decisão é "vazio" (não é erro)', () => {
  const d = decidirAposBuscar({ ok: true, quantidade: 0 });
  assert.equal(d.tipo, 'vazio');
  assert.equal(d.quantidade, 0);
});

test('FLUXO: falha na gravação é "erro" — a ficha fica ABERTA', () => {
  const d = decidirAposBuscar({ ok: false, mensagem: 'sem backend' });
  assert.equal(d.tipo, 'erro');
  if (d.tipo === 'erro') assert.equal(d.mensagem, 'sem backend');
});

test('FLUXO: resultado nulo é tratado como erro, não como sucesso', () => {
  const d = decidirAposBuscar(null);
  assert.equal(d.tipo, 'erro');
});

test('FLUXO: a quantidade vem do RESULTADO, não de um prop defasado', () => {
  // O ponto que quebraria: os setState do App (que aplicam o filtro)
  // e do modal (que mostra a tela) não são atômicos. Se a quantidade
  // viesse por prop, o modal mostraria o número antigo.
  const d = decidirAposBuscar({ ok: true, quantidade: 7 });
  assert.equal(d.tipo, 'resultados');
  if (d.tipo === 'resultados') assert.equal(d.quantidade, 7);
});

// ═══════════════════════════════════════════════════════════════════
// O TEXTO DO EMPTY STATE
// ═══════════════════════════════════════════════════════════════════

test('TEXTO: é exatamente o que o Dono pediu', () => {
  assert.equal(
    TEXTO_SEM_PRODUTO,
    'No momento não temos o produto, enviaremos para você assim que chegar.'
  );
});

test('TEXTO: a tela de resultados mostra o texto do Dono quando veio da ficha', () => {
  const t = textoDoEmptyState(true);
  assert.equal(t, TEXTO_SEM_PRODUTO);
  assert.equal(
    t,
    'No momento não temos o produto, enviaremos para você assim que chegar.'
  );
});

test('TEXTO: sem a ficha, a mensagem geral de sempre continua', () => {
  assert.equal(textoDoEmptyState(false), 'Nenhum ativo encontrado nesta categoria.');
});

// ═══════════════════════════════════════════════════════════════════
// A CORREÇÃO NO CÓDIGO REAL
// ═══════════════════════════════════════════════════════════════════

test('CORREÇÃO: o caminho de sucesso NÃO fecha o modal', () => {
  // A causa raiz. `setBuyerSuccess(true)` e `onClose()` juntos
  // desmontavam o modal antes da tela de sucesso aparecer.
  //
  // O bloco precisa ser o caminho de sucesso INTEIRO — do `if` até o
  // fim da função. Cortar no `setBuyerSuccess(true)` deixaria passar
  // um `onClose()` colocado logo depois, que é o bug original.
  //
  // Os comentários são removidos antes: o bloco original tem
  // `onClose()` escrito na explicação do bug.
  const bloco = semComentarios(
    trechoEntre(wizard, 'if (resultado?.ok) {', 'GESTÃO DE FOTOS DO VENDEDOR')
  );
  assert.doesNotMatch(
    bloco,
    /onClose\(\)/,
    'o caminho de success ainda fecha o modal — a tela de success nunca aparece'
  );
});

test('CORREÇÃO: o modal registra a quantidade que veio do resultado', () => {
  assert.match(wizard, /setResultadoBusca\(\{ quantidade: resultado\.quantidade \?\? 0 \}\)/);
});

test('CORREÇÃO: o botão de sucesso leva aos resultados E fecha o modal', () => {
  const bloco = trechoEntre(
    wizard,
    "onClick={() => {",
    'onClose();'
  );
  assert.match(bloco, /onVerResultados\?\.\(\)/, 'o botão não leva aos resultados');
  assert.match(bloco, /onClose\(\)/, 'o botão não fecha o modal');
});

test('CORREÇÃO: o App passa o onVerResultados com scroll até a vitrine', () => {
  assert.match(app, /onVerResultados=\{\(\) => \{/);
  assert.match(app, /feed-container/);
  assert.match(app, /scrollIntoView/);
});

test('CORREÇÃO: o App devolve a quantidade no resultado da gravação', () => {
  assert.match(app, /return \{ ok: true, quantidade \};/);
});

test('CORREÇÃO: a contagem usa a MESMA função de filtro da vitrine', () => {
  const bloco = trechoEntre(app, 'const quantidade = aplicarFiltro(', 'return { ok: true, quantidade };');
  assert.match(bloco, /aplicarFiltro\(/);
  assert.match(bloco, /isItemInCategory/);
  assert.match(bloco, /termoCasaNoAnuncio/);
});

test('CORREÇÃO: a tela de success não promete mais uma CAT 320D fixa', () => {
  // A tela antiga dizia "Localizamos máquinas compatíveis com a CAT
  // 320D (Paulínia/SP)" — hardcoded, e mentia quando a busca era por
  // outra máquina.
  const tela = blocoDaTelaDeSucesso();
  assert.doesNotMatch(
    tela,
    /CAT 320D \(Paulínia\/SP\)/,
    'a tela de success ainda promete a CAT 320D de Paulínia'
  );
  assert.doesNotMatch(tela, /Vídeo Liberado/, 'a tela ainda promete video liberado');
});

test('CORREÇÃO: o erro NÃO fecha o modal (a pessoa pode tentar de novo)', () => {
  const bloco = trechoEntre(wizard, "if (estado === 'erro') {", 'return;');
  assert.doesNotMatch(bloco, /onClose\(\)/, 'o caminho de erro fecha o modal');
});

test('JSX: a tela de success não tem <p> dentro de <p>', () => {
  // Um <p> duplicado é HTML inválido: o navegador fecha o <p> por
  // conta própria e o texto fica fora do lugar. O build passa —
  // só o runtime denuncia. Este teste trava a estrutura.
  const tela = blocoDaTelaDeSucesso();
  const abre = (tela.match(/<p[\s>]/g) ?? []).length;
  const fecha = (tela.match(/<\/p>/g) ?? []).length;
  assert.equal(
    abre,
    fecha,
    `a tela de success tem ${abre} <p> e ${fecha} </p> — HTML inválido`
  );
});

test('JSX: a tela de success não tem <p> duplicado', () => {
  const tela = blocoDaTelaDeSucesso();
  // O <p> do parágrafo principal abre com esta classe exata. Se
  // houver duas, uma delas está sobrando.
  const abrePrincipal = tela.match(
    /<p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">/g
  ) ?? [];
  assert.equal(
    abrePrincipal.length,
    1,
    `há ${abrePrincipal.length} <p> do parágrafo principal — um está sobrando`
  );
});

// ═══════════════════════════════════════════════════════════════════
// O FLUXO DE SUBMIT, DE PONTO
// ═══════════════════════════════════════════════════════════════════

test('SUBMIT: sucesso devolve estado "pronta" e o resultado com a quantidade', async () => {
  const r = await tentarSalvarBusca({
    jaEstaSalvando: false,
    gravar: async () => ({ ok: true, quantidade: 2 }),
  });
  assert.equal(r.estado, 'pronta');
  assert.equal(r.resultado!.ok, true);
  assert.equal(r.resultado!.quantidade, 2);
});

test('SUBMIT: a ficha fecha a tela de sucesso no sucesso', async () => {
  const r = await tentarSalvarBusca({
    jaEstaSalvando: false,
    gravar: async () => ({ ok: true, quantidade: 0 }),
  });
  assert.equal(r.vista.fichaAberta, false, 'a ficha continua aberta apos o sucesso');
});

test('SUBMIT: a falha deixa a ficha aberta com a mensagem', async () => {
  const r = await tentarSalvarBusca({
    jaEstaSalvando: false,
    gravar: async () => ({ ok: false, mensagem: 'sem backend' }),
  });
  assert.equal(r.estado, 'erro');
  assert.equal(r.vista.fichaAberta, true);
  assert.equal(r.vista.erro, 'sem backend');
});

/**
 * O bloco JSX da tela de sucesso da ficha de busca.
 *
 * O fim é o BOTÃO da própria tela ("Ver as máquinas disponíveis") —
 * senão o bloco vaza para a tela de sucesso do VENDEDOR, que vem
 * depois e usa as mesmas classes de <p>.
 */
function blocoDaTelaDeSucesso(): string {
  const i = wizard.indexOf("{intent === 'buy' && buyerSuccess && (");
  assert.ok(i > -1, 'não achei a tela de success');
  const j = wizard.indexOf('Ver as máquinas disponíveis', i);
  assert.ok(j > -1, 'não achei o fim da tela de success');
  // Inclui o botão e a sua linha, para a checagem cobrir o bloco todo.
  const k = wizard.indexOf('</button>', j);
  assert.ok(k > -1, 'não achei o fim do botão');
  return wizard.slice(i, k);
}

/** Remove os comentários de linha e de bloco de um trecho. */
function semComentarios(texto: string): string {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

/**
 * Recorta um trecho do fonte entre duas âncoras.
 * Por que não contar chaves: o JSX e os tipos têm `{` que a contagem
 * erra.
 */
function trechoEntre(fonte: string, inicio: string, fim: string): string {
  const i = fonte.indexOf(inicio);
  assert.ok(i > -1, `não achei o início: ${inicio}`);
  // O fim precisa estar DEPOIS do início — senão `indexOf` acha a
  // MESMA ocorrência e o trecho sai vazio, fazendo o teste passar
  // sem conferir nada.
  const j = fonte.indexOf(fim, i + inicio.length);
  assert.ok(j > -1, `não achei o fim: ${fim}`);
  return fonte.slice(i, j + fim.length);
}
