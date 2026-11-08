/**
 * mini-1.2d — testes que leem o CÓDIGO REAL do App e da ficha.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE LER O FONTE E NÃO CLICAR NA TELA
 *
 * O Dono foi explícito: não adicionar jsdom, não mexer no
 * package.json, não arriscar o build do MVP por causa de teste de DOM.
 *
 * O COMPORTAMENTO está em `filtrosBusca.test.ts` (55 testes) e
 * `fluxoBusca.test.ts` (11 testes). Aqui fica só a FIAÇÃO: verificar
 * que o App e a ficha ligaram as coisas certas.
 *
 * Isto NÃO substitui clicar na tela. Um regex não prova que a pessoa
 * vê o resultado. Prova que:
 *   - a ficha manda as horas e o ano mínimo no payload;
 *   - a condição não é mais fixada em 'usado';
 *   - o preço ausente vai como null, não 0;
 *   - a UF bloqueia a busca antes de gravar;
 *   - os filtros são aplicados só depois do salvamento confirmado;
 *   - o empty state da ficha existe.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const raiz = join(import.meta.dirname, '..', '..');
const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf-8');
const wizard = readFileSync(join(raiz, 'src', 'components', 'WizardModal.tsx'), 'utf-8');
const filtros = readFileSync(join(raiz, 'src', 'services', 'filtrosBusca.ts'), 'utf-8');

/**
 * Recorta um trecho do fonte entre duas âncoras.
 *
 * Por que não contar chaves: o `useMemo` e o `handleCreateBuyerListing`
 * têm `{` dentro de tipos, de destructuring e de JSX, e a contagem erra.
 * Âncoras textuais de linhas inteiras são mais estáveis.
 */
const trecho = (fonte: string, inicio: string, fim: string): string => {
  const i = fonte.indexOf(inicio);
  assert.ok(i > -1, `não achei o início: ${inicio}`);
  const j = fonte.indexOf(fim, i);
  assert.ok(j > -1, `não achei o fim: ${fim}`);
  return fonte.slice(i, j + fim.length);
};

/** A linha inteira que contém `agulha` (sem indentação). */
const linhaDe = (fonte: string, agulha: string): string => {
  const linhas = fonte.split('\n');
  const i = linhas.findIndex((l) => l.includes(agulha));
  assert.ok(i > -1, `não achei a linha com: ${agulha}`);
  return linhas[i];
};

// ═══════════════════════════════════════════════════════════════════
// A FICHA MANDA OS DADOS CORRETOS
// ═══════════════════════════════════════════════════════════════════

test('FICHA: o payload manda o ano MÍNIMO, não o ano exato', () => {
  const bloco = trecho(wizard, 'gravar: () => onSubmitBuyerListing({', '}),');
  assert.match(bloco, /minYear: anoMinimo/);
});

test('FICHA: o payload manda as horas MÁXIMAS', () => {
  const bloco = trecho(wizard, 'gravar: () => onSubmitBuyerListing({', '}),');
  assert.match(bloco, /maxHoursUsed: horasMaximas/);
});

test('FICHA: as horas vêm do campo real da ficha, não de texto solto', () => {
  // O campo da ficha é `laHoras` (linha amarela) e `agroHoras` (agrícola).
  assert.match(wizard, /horasStr: laHoras/);
  assert.match(wizard, /horasStr: agroHoras/);
  // E o caminhão/implemento NÃO inventam horímetro.
  assert.match(wizard, /horasStr: ''/);
});

test('FICHA: a condição NÃO é mais fixada em "usado"', () => {
  const bloco = trecho(wizard, 'gravar: () => onSubmitBuyerListing({', '}),');
  assert.doesNotMatch(
    bloco,
    /condition: 'usado'/,
    'a procura ainda fixa a condição automaticamente'
  );
  assert.match(bloco, /condition: buyerCondicao/);
});

test('FICHA: a condição vem do estado explícito da pessoa', () => {
  assert.match(wizard, /useState<'novo' \| 'usado' \| null>\(null\)/);
  // E há UI para escolher.
  assert.match(wizard, /setBuyerCondicao\(/);
  assert.match(wizard, /Sem preferência/);
});

test('FICHA: o preço ausente vai como null, nunca 0', () => {
  const bloco = trecho(wizard, 'gravar: () => onSubmitBuyerListing({', '}),');
  // O `?? 0` depois quebraria: `precoDaProcura ?? 0` casaria com o
  // mesmo regex. A linha tem que ser EXATAMENTE `price: precoDaProcura`.
  assert.match(bloco, /price: precoDaProcura,\s*$/m);
  assert.doesNotMatch(bloco, /price: precoDaProcura \?\? 0/);
  assert.doesNotMatch(
    bloco,
    /price: Number\.isFinite\(parsedValor\) \? parsedValor : 0/,
    'o preço ainda vira 0 quando não preenchido'
  );
});

test('FICHA: o teto de orçamento também usa o helper (null quando vazio)', () => {
  const bloco = trecho(wizard, 'gravar: () => onSubmitBuyerListing({', '}),');
  assert.match(bloco, /orcamentoMax: precoDaProcura/);
});

// ═══════════════════════════════════════════════════════════════════
// ITEM 4 — A UF BLOQUEIA A BUSCA
// ═══════════════════════════════════════════════════════════════════

test('ITEM 4: a ficha checa o alcance ANTES de gravar', () => {
  const bloco = trecho(wizard, 'const handleSubmitBuyer', 'gravar: () => onSubmitBuyerListing({');
  assert.match(bloco, /checarAlcance\(/);
});

test('ITEM 4: quando a UF falta, a ficha ABORTA (return) sem gravar', () => {
  const bloco = trecho(wizard, 'const handleSubmitBuyer', 'gravar: () => onSubmitBuyerListing({');
  const i = bloco.indexOf('if (!alcance.ok)');
  assert.ok(i > -1, 'não achei o bloqueio de UF');
  const trechoBloqueio = bloco.slice(i, i + 220);
  assert.match(trechoBloqueio, /setSubmitBuyerError\(alcance\.mensagem\)/);
  assert.match(trechoBloqueio, /return;/, 'o bloqueio precisa interromper antes de gravar');
});

test('ITEM 4: o aviso de UF aparece na tela', () => {
  // A mensagem vem do serviço; a UI mostra o erro do submit.
  assert.match(wizard, /submitBuyerError/);
  assert.match(filtros, /Não encontramos sua UF\. Selecione o estado manualmente\./);
});

test('ITEM 3: o seletor de UF usa a checagem de UF VÁLIDA, não !ufPadrao', () => {
  // mini-1.2e: `!ufPadrao` só pegava o vazio. Com "XX", o seletor
  // ficava escondido e o submit bloqueado: a pessoa ficava presa.
  assert.match(
    wizard,
    /precisaSelecionarUf\(\{ alcance: buyerAlcance, ufDoPerfil: ufPadrao \}\)/,
    'o seletor de UF ainda usa a checagem por vazio'
  );
  assert.doesNotMatch(
    wizard,
    /buyerAlcance === 'so_estado' && !ufPadrao && \(/,
    'o seletor de UF ainda depende de ufPadrao ser vazio'
  );
});

test('ITEM 3: o estado inicial só vira "so_estado" com UF válida', () => {
  assert.match(wizard, /ufDoPerfilValida\(ufPadrao\) \? 'so_estado' : null/);
});

test('ITEM 3: o aviso de UF do perfil só aparece com UF válida', () => {
  assert.match(wizard, /buyerAlcance === 'so_estado' && ufDoPerfilValida\(ufPadrao\) && \(/);
});

test('ITEM 4: a label da UF não diz mais que é opcional', () => {
  assert.doesNotMatch(
    wizard,
    /em branco = sem filtro por estado/,
    'a UF ainda é tratada como opcional'
  );
});

// ═══════════════════════════════════════════════════════════════════
// A VITRINE CONSOME OS FILTROS
// ═══════════════════════════════════════════════════════════════════

test('VITRINE: tem um caminho que usa filtrosDaFicha', () => {
  const bloco = trecho(app, 'const filteredListings = useMemo', 'const activeChipConfig');
  assert.match(bloco, /if \(filtrosDaFicha\)/);
  assert.match(bloco, /aplicarFiltro\(/);
});

test('VITRINE: o caminho da ficha usa listingsCombinados', () => {
  const bloco = trecho(app, 'const filteredListings = useMemo', 'const activeChipConfig');
  assert.match(bloco, /aplicarFiltro\(\s*listingsCombinados/);
});

test('VITRINE: os filtros da ficha entram no useMemo', () => {
  const linha = linhaDe(app, '}, [categoryListings, intentFilter, searchQuery, geoScopeFilter');
  assert.match(linha, /filtrosDaFicha/);
  assert.match(linha, /listingsCombinados/);
});

test('VITRINE: injeta as funções REAIS do app', () => {
  const bloco = trecho(app, 'const filteredListings = useMemo', 'const activeChipConfig');
  assert.match(bloco, /isItemInCategory/);
  assert.match(bloco, /termoCasaNoAnuncio/);
});

// ═══════════════════════════════════════════════════════════════════
// O CAMINHO DE SUCESSO E O DE FALHA
// ═══════════════════════════════════════════════════════════════════

test('SUCESSO: a preparação dos filtros vem do serviço', () => {
  const f = trecho(app, 'const handleCreateBuyerListing', 'const semBackend =');
  assert.match(f, /prepararBusca\(/);
});

test('SUCESSO: o App chama a função de aplicação do serviço', () => {
  // mini-1.2d: a aplicação dos filtros saiu do componente para o
  // serviço, para que o teste do fluxo verifique o COMPORTAMENTO e
  // não só a existência de uma linha.
  const f = trecho(app, 'const handleCreateBuyerListing', 'const semBackend =');
  assert.match(f, /aplicarFiltrosNaTela\(preparacao, \{/);
  // E passa TODOS os setters de que a tela precisa.
  for (const setter of [
    'setFiltrosDaFicha',
    'setSelectedCategory',
    'setGeoScopeFilter',
    'setSearchQuery',
    'setIntentFilter',
  ]) {
    assert.match(f, new RegExp(`${setter},`), `faltou o setter ${setter}`);
  }
});

test('SUCESSO: a categoria da ficha prevalece sobre a da Home', () => {
  // A REGRA mora no serviço (e é testada por comportamento em
  // fluxoBusca.test.ts). Aqui só verificamos que a regra está lá.
  assert.match(filtros, /tela\.setSelectedCategory\(preparacao\.categoria\)/);
});

test('SUCESSO: "Brasil todo" e "só do meu estado" mexem no controle do topo', () => {
  assert.match(filtros, /preparacao\.escopoGeo === 'brasil_todo'[\s\S]{0,120}setGeoScopeFilter\('brasil_todo'\)/);
  assert.match(filtros, /preparacao\.escopoGeo === 'so_sc'[\s\S]{0,120}setGeoScopeFilter\('so_sc'\)/);
});

test('SUCESSO: sem escolha de alcance, o geográfico da Home NÃO é tocado', () => {
  const foraDoIf = filtros.replace(
    /if \(preparacao\.escopoGeo === 'brasil_todo'\) \{[\s\S]*?\}\s*else if \(preparacao\.escopoGeo === 'so_sc'\) \{[\s\S]*?\}/,
    ''
  );
  assert.equal(
    (foraDoIf.match(/setGeoScopeFilter\(/g) || []).length,
    0,
    'há setGeoScopeFilter fora da condição de escopo'
  );
});

test('SUCESSO: os filtros são aplicados DEPOIS do salvamento confirmado', () => {
  const f = trecho(app, 'const handleCreateBuyerListing', 'const semBackend =');
  const salvar = f.indexOf('await backend.salvar');
  const aplicar = f.indexOf('aplicarFiltrosNaTela(preparacao, {');
  assert.ok(salvar > -1);
  assert.ok(aplicar > -1);
  assert.ok(aplicar > salvar, 'os filtros são aplicados antes da confirmação do banco');
});

test('SUCESSO: NENHUMA aplicação de filtro antes do salvamento', () => {
  // Um `setFiltrosDaFicha(null)` antes do `await backend.salvar` já
  // seria a vitrine mudando antes da confirmação.
  const f = trecho(app, 'const handleCreateBuyerListing', 'const semBackend =');
  const salvar = f.indexOf('await backend.salvar');
  const antes = f.slice(0, salvar);
  assert.equal(
    antes.match(/setFiltrosDaFicha\(|aplicarFiltrosNaTela\(/g),
    null,
    'há aplicação de filtro antes da confirmação do banco'
  );
  assert.equal(
    antes.match(/setSelectedCategory\(|setGeoScopeFilter\(/g),
    null,
    'a vitrine mudou antes da confirmação do banco'
  );
});

test('FALHA: no catch do banco, os filtros NÃO são aplicados', () => {
  const f = trecho(app, 'const handleCreateBuyerListing', 'const semBackend =');
  const trySalvar = f.indexOf('if (sessao && backend.configurado) {');
  assert.ok(trySalvar > -1);
  const j = f.indexOf('return { ok: false, mensagem };', trySalvar);
  assert.ok(j > -1);
  const parte = f.slice(trySalvar, j);
  const iCatch = parte.lastIndexOf('} catch (e) {');
  assert.ok(iCatch > -1, 'não achei o catch do salvamento');
  const soErro = parte.slice(iCatch);
  assert.equal(
    soErro.match(/setFiltrosDaFicha|setSelectedCategory\(|setGeoScopeFilter\(/g),
    null,
    'a vitrine foi filtrada por uma busca que não foi salva'
  );
});

test('FALHA: no caminho sem backend/sessão, os filtros NÃO são aplicados', () => {
  const f = trecho(app, 'const handleCreateBuyerListing', 'const semBackend =');
  const i = f.indexOf('const semBackend =');
  const trechoSem = f.slice(i, f.length);
  assert.equal(
    trechoSem.match(/setFiltrosDaFicha|setSelectedCategory\(/g),
    null,
    'a vitrine foi filtrada por uma busca que não foi salva'
  );
});

test('FALHA: a espelhagem é desfeita no catch', () => {
  const f = trecho(app, 'const handleCreateBuyerListing', 'const semBackend =');
  const iCatch = f.lastIndexOf('} catch (e) {');
  assert.ok(iCatch > -1);
  assert.match(f.slice(iCatch, iCatch + 200), /desfazerEspelho\(\)/);
});

// ═══════════════════════════════════════════════════════════════════
// O PREÇO NA TELA
// ═══════════════════════════════════════════════════════════════════

test('PREÇO: a tela de detalhe não mostra R$ 0,00 para procura sem preço', () => {
  const detalhe = readFileSync(join(raiz, 'src', 'components', 'ProductDetail.tsx'), 'utf-8');
  assert.match(detalhe, /A combinar/);
  assert.doesNotMatch(
    detalhe,
    /R\$ \{item\.price\.toLocaleString/,
    'a tela ainda formata o preço direto, e null quebraria isso'
  );
});

test('PREÇO: o ListingCard usa o helper de preço', () => {
  const card = readFileSync(join(raiz, 'src', 'components', 'ListingCard.tsx'), 'utf-8');
  assert.doesNotMatch(card, /item\.price \?\? 0/);
  assert.doesNotMatch(card, /item\.price\.toLocaleString/);
  assert.match(card, /precoDoCard\(item\.price/);
});

test('PREÇO: nenhum card de produção formata preço 0 como dinheiro', () => {
  // mini-1.2e: a auditoria tem que ser de TODOS os cards, não só do
  // ListingCard. O padrão `?? 0` seguido de toLocaleString é o que
  // mostrava "R$ 0,00".
  const componentes = readdirSync(join(raiz, 'src', 'components')).filter((f) =>
    f.endsWith('.tsx')
  );
  for (const arquivo of componentes) {
    const src = readFileSync(join(raiz, 'src', 'components', arquivo), 'utf-8');
    assert.doesNotMatch(
      src,
      /price \?\? 0\)\.toLocaleString/,
      `${arquivo} ainda formata preço ausente como dinheiro`
    );
  }
});

test('PREÇO: o insert manda 0 porque a coluna é not null', () => {
  const svc = readFileSync(join(raiz, 'src', 'services', 'productService.ts'), 'utf-8');
  assert.match(svc, /price: item\.price \?\? 0/);
});

// ═══════════════════════════════════════════════════════════════════
// O EMPTY STATE
// ═══════════════════════════════════════════════════════════════════

test('EMPTY STATE: o texto da busca vazia da ficha é o que o Dono pediu', () => {
  // mini-1.2f: a tela de resultados da ficha usa o texto novo.
  // O texto do Dono está no fonte — com a constante referenciando a
  // outra, por isso a checagem é pelo VALOR da string.
  assert.match(
    filtros,
    /'No momento não temos o produto, enviaremos para você assim que chegar\.'/
  );
  // E o texto geral continua existindo para as outras telas.
  assert.match(
    filtros,
    /TEXTO_SEM_RESULTADO =\s*'No momento não temos o produto, enviaremos para você assim que chegar\.'/
  );
  assert.match(app, /\{\s*TEXTO_SEM_RESULTADO\s*\}/);
  assert.match(app, /\{\s*dicaDoEmptyState\(filtrosDaFicha\)\s*\}/);
});

test('EMPTY STATE: o botão de afrouxar usa a lógica do serviço', () => {
  // mini-1.2e: a condição antiga exigia `orcamentoMax` E outro
  // filtro — "só ano" e "só horas" não mostravam o botão. Agora a
  // decisão mora em calcularAfrouxamento, que é testado por
  // comportamento.
  const bloco = trecho(app, '{filteredListings.length === 0 ?', 'Quero Comprar');
  assert.match(bloco, /calcularAfrouxamento\(filtrosDaFicha\)/);
  assert.doesNotMatch(
    bloco,
    /filtrosDaFicha\.orcamentoMax !== null\) && \(/,
    'a condição duplicada do 1.2d ainda está no JSX'
  );
});

// ═══════════════════════════════════════════════════════════════════
// REGRESSÕES ESTRUTURAIS
// ═══════════════════════════════════════════════════════════════════

test('o estado filtrosDaFicha começa null', () => {
  assert.match(app, /useState<FiltrosAplicados \| null>\(null\)/);
});

test('o módulo de filtros não importa React nem toca localStorage', () => {
  assert.equal(/from ['"]react['"]/.test(filtros), false);
  assert.equal(/localStorage/.test(filtros), false);
  assert.equal(/window\./.test(filtros), false);
});

test('categorias.ts usa import type — sem isso o teste não roda no Node', () => {
  const cats = readFileSync(join(raiz, 'src', 'data', 'categories.ts'), 'utf-8');
  assert.match(cats.split('\n')[0], /^import type \{/);
});

test('a ficha do VENDEDOR não foi tocada pela mudança de condição', () => {
  // A mudança é da ficha do COMPRADOR. O vendedor tem a própria
  // condição, escolhida na tela dele.
  const blocoVendedor = trecho(wizard, "intent: 'sell'", 'price: parsedValor,');
  assert.doesNotMatch(
    blocoVendedor,
    /condition: buyerCondicao/,
    'a condição do comprador vazou para o vendedor'
  );
});
