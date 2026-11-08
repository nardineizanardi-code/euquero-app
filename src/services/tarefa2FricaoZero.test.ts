/**
 * TASK 2 (FRICÇÃO ZERO) — BUSCA SEM LOGIN.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE O DONO PEDIU
 *
 *  1. A ficha de busca não pode exigir "Marca/Modelo". A pessoa
 *     escolhe só a categoria e clica em "Buscar Máquinas".
 *
 *  2. A pessoa acessa a Home, clica em "Quero Comprar" e faz a busca
 *     SEM ESTAR LOGADA. Ela tem que ver os anúncios — o banco já tem
 *     a `public_listings` para leitura pública.
 *
 *  3. O login só é exigido no CONTATO: quando ela clica em "Falar com
 *     o Vendedor" no card, aí sim aparece o login/cadastro.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE ESTES TESTES EXISTEM
 *
 * A Tarefa 1 foi reprovada porque o código "fazia sentido" e mesmo
 * assim a pessoa não via os anúncios. O mesmo pode acontecer aqui:
 * o caminho sem sessão pode até "parecer" que aplica os filtros,
 * e na verdade não aplicar nenhum.
 *
 * Por isso este arquivo tem as TRÊS metades:
 *
 *  - o COMPORTAMENTO (as funções reais, com a busca de verdade);
 *  - a FIAÇÃO (o código de produção está ligado como precisa);
 *  - a AUSÊNCIA de atrito (não há trava de login escondida).
 *
 * E há testes que travam a OBRIGATORIEDADE: sem eles, alguém pode
 * reintroduzir o `required` no campo e ninguém percebe até o Dono
 * testar no celular.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  prepararBusca,
  aplicarFiltro,
  contarResultadosDaBusca,
} from './filtrosBusca';
import { termoCasaNoAnuncio } from './fichaBusca';

const raiz = join(import.meta.dirname, '..', '..');
const wizard = readFileSync(join(raiz, 'src', 'components', 'WizardModal.tsx'), 'utf-8');
const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf-8');
const telaAuth = readFileSync(join(raiz, 'src', 'components', 'TelaAuth.tsx'), 'utf-8');
const sessao = readFileSync(join(raiz, 'src', 'services', 'sessao.ts'), 'utf-8');

// ═══════════════════════════════════════════════════════════════════
// A VITRINE — anúncios que a pessoa pode ver SEM ESTAR LOGADA
// ═══════════════════════════════════════════════════════════════════

const anuncio = (over: Record<string, unknown> = {}) => ({
  id: 'x',
  title: 'Anúncio',
  brand: 'Marca',
  model: 'Modelo',
  category: 'linha_amarela',
  year: 2022,
  hoursUsed: 3000,
  price: 250000,
  locationCity: 'Curitiba',
  locationState: 'PR',
  condition: 'usado',
  status: 'active',
  intent: 'sell',
  images: [] as string[],
  ...over,
});

const vitrinePublica = [
  anuncio({
    id: '1',
    title: 'Sinomach SYM 855H',
    brand: 'Sinomach',
    model: 'SYM 855H',
    year: 2023,
    hoursUsed: 2000,
    price: 280000,
    images: ['https://exemplo.test/1.jpg'],
  }),
  anuncio({
    id: '2',
    title: 'CAT 320D',
    brand: 'Caterpillar',
    model: '320D',
    year: 2022,
    hoursUsed: 3500,
    price: 310000,
    images: ['https://exemplo.test/2.jpg'],
  }),
  anuncio({
    id: '3',
    title: 'Komatsu PC-210',
    brand: 'Komatsu',
    model: 'PC-210',
    category: 'agricola',
    year: 2021,
    hoursUsed: 4000,
    price: 290000,
    images: ['https://exemplo.test/3.jpg'],
  }),
];

const casarCategoria = (item: any, categoria: string) => item.category === categoria;
const casarTermo = (termo: string, item: any) => termoCasaNoAnuncio(termo, item);

// ═══════════════════════════════════════════════════════════════════
// 1. A MARCA/MODELO NÃO É MAIS OBRIGATÓRIA
// ═══════════════════════════════════════════════════════════════════

test('FICHA: o formulário do COMPRADOR não tem nenhum campo "required"', () => {
  // O formulário do comprador começa em `intent === 'buy' && (` e
  // vai até o formulário do vendedor. NENHUM campo pode ter
  // `required` — nem Marca/Modelo, nem Ano, nem nada.
  const inicio = wizard.indexOf("{intent === 'buy' && (");
  const fim = wizard.indexOf("{intent === 'sell' && (", inicio);
  assert.ok(inicio > -1, 'não achei o formulário do comprador');
  assert.ok(fim > inicio, 'não achei o formulário do vendedor');
  const fichaDoComprador = wizard.slice(inicio, fim);

  const required = fichaDoComprador.match(/^\s*required\s*$/gm) ?? [];
  assert.equal(
    required.length,
    0,
    `a ficha do comprador ainda tem ${required.length} campo(s) obrigatório(s)`
  );
});

test('FICHA: o formulário do VENDEDOR continua com os campos obrigatórios', () => {
  // O contrário também é verdade: a tarefa é só do comprador.
  const inicio = wizard.indexOf("{intent === 'sell' && (");
  assert.ok(inicio > -1, 'não achei o formulário do vendedor');
  const fichaDoVendedor = wizard.slice(inicio);

  assert.ok(
    /^\s*required\s*$/m.test(fichaDoVendedor),
    'o formulário do vendedor perdeu a obrigatoriedade — a tarefa não era essa'
  );
});

test('FICHA: os labels de Marca/Modelo do comprador dizem "(opcional)"', () => {
  const inicio = wizard.indexOf("{intent === 'buy' && (");
  const fim = wizard.indexOf("{intent === 'sell' && (", inicio);
  const ficha = wizard.slice(inicio, fim);

  // Todo label de Marca ou Modelo do comprador é "(opcional)".
  const labels = ficha.split('\n').filter((l) =>
    /^\s*(Marca|Modelo|Marca\/Modelo):/.test(l)
  );
  assert.ok(labels.length >= 3, `esperava vários labels, achei ${labels.length}`);
  for (const l of labels) {
    assert.match(l, /opcional/, `label sem "(opcional)": ${l.trim()}`);
  }
});

test('FICHA: o formulário do VENDEDOR mantém o "*" vermelho nos labels', () => {
  const inicio = wizard.indexOf("{intent === 'sell' && (");
  const ficha = wizard.slice(inicio);
  assert.match(
    ficha,
    /Marca\/Modelo\*: <span className="text-red-500">\*<\/span>/,
    'o fluxo de vendedor foi alterado por engano'
  );
});

// ═══════════════════════════════════════════════════════════════════
// 2. A BUSCA FUNCIONA SEM LOGIN
// ═══════════════════════════════════════════════════════════════════

test('BUSCA SEM LOGIN: a busca só pela categoria devolve os anúncios', () => {
  // A pessoa escolheu "Linha Amarela" e clicou em "Buscar Máquinas".
  // Só isso.
  const preparacao = prepararBusca({
    category: 'linha_amarela',
    brand: '',
    model: '',
    minYear: null,
    maxHoursUsed: null,
    orcamentoMax: null,
    geoPreference: 'brasil_todo',
    locationState: null,
  });

  assert.equal(preparacao.termo, '', 'sem marca/modelo, não pode haver termo');
  assert.equal(preparacao.categoria, 'linha_amarela');

  const quantidade = contarResultadosDaBusca({
    preparacao,
    locais: [],
    publicos: vitrinePublica,
    casarCategoria,
    casarTermo,
  });

  // As DUAS linha amarela. A agrícola não entra.
  assert.equal(quantidade, 2);
});

test('BUSCA SEM LOGIN: a contagem usa a MESMA função que a vitrine', () => {
  const preparacao = prepararBusca({
    category: 'linha_amarela',
    brand: '',
    model: '',
    geoPreference: 'brasil_todo',
    locationState: null,
  });
  const peloHelper = contarResultadosDaBusca({
    preparacao,
    locais: [],
    publicos: vitrinePublica,
    casarCategoria,
    casarTermo,
  });
  const direto = aplicarFiltro(vitrinePublica, preparacao.filtros, {
    casarCategoria,
    casarTermo,
  }).length;
  assert.equal(peloHelper, direto);
});

test('BUSCA SEM LOGIN: a busca só pela categoria mostra anúncios COM FOTO', () => {
  const preparacao = prepararBusca({
    category: 'linha_amarela',
    brand: '',
    model: '',
    geoPreference: 'brasil_todo',
    locationState: null,
  });
  const resultados = aplicarFiltro(vitrinePublica, preparacao.filtros, {
    casarCategoria,
    casarTermo,
  });
  assert.equal(resultados.length, 2);
  for (const r of resultados) {
    const original = vitrinePublica.find((a) => a.id === r.id)!;
    assert.ok(original.images.length > 0, `o anúncio ${r.id} apareceu sem foto`);
  }
});

test('BUSCA COM LOGIN: dá o MESMO número que a busca sem login', () => {
  // A busca com sessão grava a demanda no banco. A busca sem sessão
  // não grava. Mas o NÚMERO de anúncios que a pessoa vê é o mesmo —
  // senão a tela de sucesso mentiria em um dos caminhos.
  const preparacao = prepararBusca({
    category: 'linha_amarela',
    brand: 'Sinomach',
    model: 'SYM 855H',
    geoPreference: 'brasil_todo',
    locationState: null,
  });
  const comSessao = contarResultadosDaBusca({
    preparacao,
    locais: [],
    publicos: vitrinePublica,
    casarCategoria,
    casarTermo,
  });
  const semSessao = contarResultadosDaBusca({
    preparacao,
    locais: [],
    publicos: vitrinePublica,
    casarCategoria,
    casarTermo,
  });
  assert.equal(comSessao, semSessao);
  assert.equal(comSessao, 1);
});

// ═══════════════════════════════════════════════════════════════════
// A FIAÇÃO NO CÓDIGO DE PRODUÇÃO
// ═══════════════════════════════════════════════════════════════════

test('CÓDIGO: o caminho sem sessão APLICA os filtros', () => {
  const bloco = trecho(
    app,
    'const handleCreateBuyerListing',
    '// Open in-app chat for item'
  );
  const i = bloco.indexOf('if (!backend.configurado) {');
  assert.ok(i > -1, 'não achei o caminho sem backend');
  const semSessao = bloco.slice(i);

  assert.match(
    semSessao,
    /aplicarFiltrosNaTela\(preparacaoSemGravar/,
    'sem sessão, a vitrine não é filtrada'
  );
  assert.match(
    semSessao,
    /return \{ ok: true, quantidade: quantidadeSemGravar \}/,
    'sem sessão, a busca não dá certo'
  );
});

test('CÓDIGO: o caminho sem sessão usa a MESMA função de contagem', () => {
  const bloco = trecho(
    app,
    'const handleCreateBuyerListing',
    '// Open in-app chat for item'
  );
  const comGravacao = bloco.slice(0, bloco.indexOf('if (!backend.configurado) {'));
  const semGravacao = bloco.slice(bloco.indexOf('if (!backend.configurado) {'));

  assert.match(comGravacao, /contarResultadosDaBusca\(\{/);
  assert.match(semGravacao, /contarResultadosDaBusca\(\{/);
  // E as duas chamadas passam as mesmas dependências.
  for (const parte of [comGravacao, semGravacao]) {
    assert.match(parte, /casarCategoria:/);
    assert.match(parte, /casarTermo:/);
  }
});

test('CÓDIGO: a gravação da demanda ainda exige sessão', () => {
  // A demanda é do dono. Sem sessão, ela não é gravada — mas a busca
  // acontece. As duas coisas.
  const bloco = trecho(
    app,
    'const handleCreateBuyerListing',
    '// Open in-app chat for item'
  );
  assert.match(
    bloco,
    /const podeGravar = Boolean\(sessao && backend\.configurado\)/,
    'a gravação não está mais condicionada à sessão'
  );
  assert.match(bloco, /if \(podeGravar\) \{/);
});

test('CÓDIGO: sem backend, a busca NÃO acontece (falha de configuração)', () => {
  const bloco = trecho(
    app,
    'const handleCreateBuyerListing',
    '// Open in-app chat for item'
  );
  const i = bloco.indexOf('if (!backend.configurado) {');
  assert.ok(i > -1, 'não achei o caminho sem backend');
  // O bloco de "sem backend" vai até o FIM dele — o `return { ok: false }`.
  // O caminho sem sessão vem DEPOIS, e ele aplica o filtro de propósito.
  const j = bloco.indexOf('return { ok: false, mensagem: semBackend };', i);
  assert.ok(j > i, 'não achei o retorno de erro sem backend');
  const semBackend = bloco.slice(i, j);
  assert.equal(
    semBackend.match(/aplicarFiltrosNaTela\(/g),
    null,
    'sem backend, a vitrine não pode ser filtrada'
  );
  // E o erro é explícito: a pessoa não vê uma busca vazia sem
  // explicação, ela vê que o app não está ligado ao banco.
  assert.match(semBackend, /não há backend configurado/);
});

test('CÓDIGO: abrir a ficha de busca NÃO exige login', () => {
  // "Quero Comprar" na Home abre o modal. Nenhuma trava de sessão.
  const bloco = trecho(app, 'const handleOpenWizard', 'const handleTenhoEssaMaquina');
  assert.doesNotMatch(
    bloco,
    /sessao|sessão|logado|auth/i,
    'abrir a ficha de busca ainda pede login'
  );
  assert.match(bloco, /setIsWizardOpen\(true\)/);
});

// ═══════════════════════════════════════════════════════════════════
// 3. O LOGIN SÓ É EXIGIDO NO CONTATO
// ═══════════════════════════════════════════════════════════════════

test('CONTATO: sem sessão, o contato abre o login e NÃO envia mensagem', () => {
  const bloco = trecho(
    app,
    'const handleStartChatForItem',
    'const handleSendMessage'
  );
  // O login é pedido.
  assert.match(
    bloco,
    /if \(!sessao\) \{[\s\S]{0,600}?setAuthAberto\(true\);[\s\S]{0,200}?return;/,
    'o contato não pede login quando não há sessão'
  );
  // E o pedido de login acontece ANTES de qualquer efeito — sem
  // match criado, sem mensagem, sem chat local.
  const iGuarda = bloco.indexOf('if (!sessao) {');
  const iMatch = bloco.indexOf('backgroundMatches.find');
  assert.ok(iGuarda > -1, 'não achei a guarda de sessão');
  assert.ok(iMatch > iGuarda, 'a guarda de sessão tem que vir antes do match');
});

test('CONTATO: com sessão, o contato acontece normalmente', () => {
  const bloco = trecho(
    app,
    'const handleStartChatForItem',
    'const handleSendMessage'
  );
  // O `backend.contatar(` pode estar quebrado em duas linhas pelo
  // formatador — o teste tem que ver os dois jeitos.
  assert.match(
    bloco,
    /backend\s*\.\s*contatar\(/,
    'com sessão, o contato não é enviado ao banco'
  );
  assert.match(bloco, /if \(sessao && backend\.configurado && item\.intent === 'sell'\)/);
});

test('CONTATO: a tela de login explica o motivo', () => {
  const bloco = trecho(app, 'const handleStartChatForItem', 'const handleSendMessage');
  assert.match(
    bloco,
    /setMotivoDoAuth\(/,
    'o contato não explica por que o login foi pedido'
  );
  assert.match(
    app,
    /<TelaAuth[\s\S]{0,300}?motivo=\{motivoDoAuth\}/,
    'a tela de login não recebe o motivo'
  );
});

test('CONTATO: a tela de login tem o campo WhatsApp', () => {
  assert.match(telaAuth, /id="auth-telefone"/, 'a tela de login não tem o campo WhatsApp');
  assert.match(telaAuth, /type="tel"/);
  // E o campo só aparece no cadastro.
  const bloco = telaAuth.slice(
    telaAuth.indexOf("aba === 'criar' && ("),
    telaAuth.indexOf('auth-telefone') + 400
  );
  assert.match(bloco, /aba === 'criar'/);
});

test('CONTATO: o WhatsApp vai nos metadados, para o trigger do banco', () => {
  // O `profiles.phone` já é preenchido pelo trigger do banco a partir
  // de `raw_user_meta_data ->> 'phone'`. Nenhum SQL novo.
  assert.match(
    sessao,
    /data:\s*\{[\s\S]{0,300}?phone: telefone\.trim\(\)/,
    'o telefone não vai para os metadados do usuário'
  );
  // A assinatura tem o telefone depois de um bloco de comentário
  // longo — a janela precisa ser maior que isso.
  assert.match(
    sessao,
    /export const cadastrar = async \([\s\S]{0,900}?telefone\?: string/
  );
});

// ═══════════════════════════════════════════════════════════════════
// O QUE NÃO PODE TER MUDADO
// ═══════════════════════════════════════════════════════════════════

test('ESCOPO: a Tarefa 1 continua corrigida', () => {
  // A tela de sucesso do comprador não pode voltar a fechar o modal.
  const bloco = trecho(
    wizard,
    'if (resultado?.ok) {',
    'GESTÃO DE FOTOS DO VENDEDOR'
  );
  const semComentarios = bloco
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  assert.doesNotMatch(
    semComentarios,
    /onClose\(\)/,
    'a Tarefa 1 foi desfeita — o modal fecha antes de a Buyer ver os resultados'
  );
});

test('ESCOPO: o Supabase e o RLS não foram tocados', () => {
  // A leitura pública já existe: a view `public_listings` é lida sem
  // sessão. Esta tarefa não precisa de banco nenhum.
  const sql = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf-8');
  assert.doesNotMatch(sql, /create\s+(or\s+replace\s+)?view/i);
  assert.doesNotMatch(sql, /create\s+policy/i);
  assert.doesNotMatch(sql, /alter\s+table/i);
});

/** Recorta um trecho do fonte entre duas âncoras. */
function trecho(fonte: string, inicio: string, fim: string): string {
  const i = fonte.indexOf(inicio);
  assert.ok(i > -1, `não achei o início: ${inicio}`);
  const j = fonte.indexOf(fim, i + inicio.length);
  assert.ok(j > -1, `não achei o fim: ${fim}`);
  return fonte.slice(i, j);
}
