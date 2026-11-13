/**
 * mini-1.2 — testes que leem o CÓDIGO REAL da ficha, não uma cópia dele.
 *
 * Por que este arquivo existe
 * ────────────────────────────
 * Os testes de `fichaBusca.test.ts` cobrem as funções puras (regras de
 * alcance, parsing de cidade, título, descrição). Isso é bom, mas não
 * pega o que mais quebra na ficha: um `required` que sobrou no JSX,
 * um rótulo que esvaziou, um `<select>` travando o texto livre.
 *
 * Aqui a fonte do componente é lida de verdade e o que importa é
 * verificado:
 *
 *   1. Quais campos do FORMULARIO DO COMPRADOR bloqueiam a submissão
 *      (`required`). O requisito: só Categoria e Marca/Modelo.
 *   2. Se algum rótulo ficou vazio (o bug de quem apaga o `*` junto
 *      com o texto do label).
 *   3. Se Marca/Modelo aceita TEXTO LIVRE em todos os subtipos — um
 *      `<select>` de montadoras traria "Sinomach" como opção
 *      inexistente e a busca ficaria impossível.
 *   4. Se nenhum valor fictício (320D, CAT, R$ 520.000, ano 2020)
 *      volta a aparecer como fallback.
 *
 * Não há DOM aqui: o projeto não tem testing-library e não vamos
 * adicionar uma dependência por causa de uma verificação de string.
 * O que este arquivo garante é sobre o JSX real que entra no bundle.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve as resolvePath } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const FONTE_WIZARD = resolvePath(aqui, '../components/WizardModal.tsx');
const fonte = readFileSync(FONTE_WIZARD, 'utf8');

/** O trecho do formulário do comprador: de `{intent === 'buy' && (` até o do vendedor. */
function blocoDoComprador(): string {
  const i = fonte.indexOf("{intent === 'buy' && (");
  const j = fonte.indexOf("{intent === 'sell' && (", i);
  assert.ok(i > 0, 'não achei o início do formulário do comprador');
  assert.ok(j > i, 'não achei o início do formulário do vendedor');
  return fonte.slice(i, j);
}

/**
 * Para cada `value={x}` dentro do form, diz se o input/select
 * carrega `required` e qual tag é.
 */
function CamposDoFormulario(bloco: string): Array<{
  campo: string;
  tag: string;
  required: boolean;
}> {
  const saida: Array<{ campo: string; tag: string; required: boolean }> = [];
  // Cada elemento abre com <input ... value={x}  ou  <select ... value={x}
  const re = /<(input|select)\b([^>]*?)(?:\/>|>)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(bloco)) !== null) {
    const tag = m[1];
    const attrs = m[2] ?? '';
    // o `value={x}` pode estar DEPOIS do fechamento (o regex parou no
    // primeiro '>'), então procuramos no trecho seguinte
    const depois = bloco.slice(m.index, m.index + 400);
    const vm = /value=\{(\w+)\}/.exec(depois);
    if (!vm) continue;
    const required = /\brequired\b/.test(attrs) || /\brequired\b/.test(depois.slice(0, 260));
    saida.push({ campo: vm[1], tag, required });
  }
  return saida;
}

describe('mini-1.2 · o formulário real do comprador', () => {
  const bloco = blocoDoComprador();
  const campos = CamposDoFormulario(bloco);

  it('encontra os campos do formulário (sanidade do teste)', () => {
    assert.ok(campos.length > 10, `esperava vários campos, achei ${campos.length}`);
  });

  // ─────────────────────────────────────────────────────────────────
  // GAP 1 — só Categoria e Marca/Modelo bloqueiam
  // ─────────────────────────────────────────────────────────────────
  it('GAP 1: os únicos campos com required são os de marca/modelo', () => {
    const obrigatorios = campos.filter((c) => c.required).map((c) => c.campo);
    // Nenhum destes pode ser obrigatório:
    const opcionaisQueNaoPodem = [
      'laAno', 'laHoras', 'laSubtype',
      'agroAno', 'agroHoras', 'agroSubtype',
      'truckAno', 'truckKm', 'truckTracao', 'truckSubtype',
      'impAno', 'impEixos', 'impComprimento', 'impSubtype',
      'buyerCity', 'buyerBudget', 'buyerPaymentMethod',
      'buyerUfEscolhida',
    ];
    for (const c of opcionaisQueNaoPodem) {
      assert.ok(
        !obrigatorios.includes(c),
        `${c} está com required, mas é opcional por requisito`
      );
    }
  });

  it('GAP 1: Ano, Horas e Orçamento aparecem sem asterisco de obrigatório', () => {
    // O `*` de obrigatório sempre vem acompanhado de
    // `<span className="text-red-500">*</span>`. Se o rótulo de Ano,
    // Horas ou Orçamento tiver esse span, ainda está marcado como
    // obrigatório.
    const rotulos = [...bloco.matchAll(
      /<label[^>]*>([\s\S]{0,220}?)<\/label>/g
    )].map((m) => m[1]);

    const opcionaisQueNaoPodemSerObrigatorios = [
      'Ano', 'Horas de uso', 'Orçamento', 'Quilometragem',
      'Tração', 'Nº de Eixos', 'Comprimento', 'Sub-opção', 'Cidade',
      'Forma de Pagamento',
    ];
    for (const alvo of opcionaisQueNaoPodemSerObrigatorios) {
      const achou = rotulos.filter((r) => r.includes(alvo));
      for (const r of achou) {
        assert.ok(
          !/text-red-500">\s*\*\s*<\/span>/.test(r),
          `rótulo "${alvo.trim()}" ainda tem o asterisco de obrigatório: ${r.replace(/\s+/g, ' ').slice(0, 90)}`
        );
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // GAP 1 (consequência) — nenhum rótulo pode ficar vazio
  // ─────────────────────────────────────────────────────────────────
  it('nenhum rótulo do comprador ficou sem texto', () => {
    const rotulos = [...bloco.matchAll(
      /<label[^>]*>([\s\S]{0,220}?)<\/label>/g
    )].map((m) => m[1]);
    const vaos = rotulos.filter((r) => r.replace(/\s+/g, '').replace(/:\s*$/, '') === '');
    assert.equal(
      vaos.length,
      0,
      `${vaos.length} rótulo(s) sem texto (apareceriam como ":" na tela)`
    );
  });

  it('os rótulos opcionais dizem que são opcionais', () => {
    const rotulos = [...bloco.matchAll(
      /<label[^>]*>([\s\S]{0,220}?)<\/label>/g
    )].map((m) => m[1]);
    // Se o rótulo contém "Horas de uso" ou "Ano", ele precisa
    // deixar claro que é opcional — senão a pessoa preenche achando
    // que é obrigatório.
    for (const alvo of ['Ano', 'Horas de uso', 'Orçamento até']) {
      const achou = rotulos.filter((r) => r.includes(alvo));
      assert.ok(achou.length > 0, `não achei rótulo com "${alvo}"`);
      for (const r of achou) {
        const txt = r.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        assert.match(
          txt,
          /opcional/i,
          `rótulo "${txt.trim()}" não diz que é opcional`
        );
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // GAP 3 — Marca/Modelo é texto livre em TODOS os subtipos
  // ─────────────────────────────────────────────────────────────────
  it('GAP 3: nenhum campo de marca/modelo é <select> (texto livre em todos os subtipos)', () => {
    const camposDeMarca = campos.filter((c) =>
      /Marca|Modelo/.test(c.campo)
    );
    assert.ok(camposDeMarca.length >= 5, `esperava os campos de marca/modelo`);
    for (const c of camposDeMarca) {
      assert.equal(
        c.tag,
        'input',
        `${c.campo} é <${c.tag}>: um select de marcas impede "Sinomach"`
      );
    }
  });

  it('GAP 3: não existe lista fixa de montadoras de caminhão na ficha', () => {
    // A revisão do diff apontou que "Sinomach" não existia na lista
    // de trucks. Nenhuma montadora pode estar hardcoded como
    // <option> no formulário do comprador.
    const opcoes = [...bloco.matchAll(/<option value="([^"]+)"/g)].map((m) => m[1]);
    const montadoras = ['Volvo', 'Scania', 'Mercedes-Benz', 'Iveco', 'DAF', 'Caterpillar', 'John Deere'];
    for (const mont of montadoras) {
      assert.ok(
        !opcoes.includes(mont),
        `"${mont}" está como <option> fixa: o texto livre deixa de funcionar`
      );
    }
  });

  it('GAP 3: nenhum fallback de modelo/marca inventado no JSX', () => {
    // "Caterpillar", "320D" e "John Deere" podem existir como
    // PLACEHOLDER de exemplo, mas nunca como valor padrão que o
    // código injeta quando o campo está vazio.
    const linhas = bloco.split('\n');
    for (const l of linhas) {
      // padrão perigoso: `|| 'CAT'` / `|| '320D'` / `|| 'Caterpillar'`
      assert.ok(
        !/\|\|\s*'(CAT|320D|Caterpillar|John Deere|8R)'/.test(l),
        `fallback inventado no JSX: ${l.trim().slice(0, 90)}`
      );
    }
  });
});

describe('mini-1.2 · getCategoryDetails não inventa modelo', () => {
  it('não existe mais fallback de marca/modelo em getCategoryDetails', () => {
    const i = fonte.indexOf('const getCategoryDetails');
    assert.ok(i > 0, 'não achei getCategoryDetails');
    const corpo = fonte.slice(i, i + 2600);
    // Nenhum `|| 'Caterpillar'`, `|| '320D'`, `|| 'John Deere'`, `|| '8R'`
    for (const proibido of ["'Caterpillar'", "'320D'", "'John Deere'", "'8R'"]) {
      assert.ok(
        !corpo.includes(proibido),
        `getCategoryDetails ainda tem fallback ${proibido}`
      );
    }
    // E usa as funções que preservam o que foi digitado
    assert.match(corpo, /marcaDe\(/, 'getCategoryDetails deveria usar marcaDe()');
    assert.match(corpo, /modeloDe\(/, 'getCategoryDetails deveria usar modeloDe()');
  });
});

describe('mini-1.2 · o termo de busca chega na tela de resultados', () => {
  const app = readFileSync(resolvePath(aqui, '../App.tsx'), 'utf8');

  /**
   * Recorta um trecho do fonte entre duas âncoras de linha inteira.
   *
   * Âncoras textuais são mais estáveis do que contar chaves: o
   * `useMemo` e os callbacks do App têm `{` dentro de tipos, de
   * destructuring e de JSX, e a contagem erra.
   */
  const trecho = (fonteApp: string, inicio: string, fim: string): string => {
    const i = fonteApp.indexOf(inicio);
    assert.ok(i > -1, `não achei o início: ${inicio}`);
    const j = fonteApp.indexOf(fim, i);
    assert.ok(j > -1, `não achei o fim: ${fim}`);
    return fonteApp.slice(i, j + fim.length);
  };

  it('App.tsx aplica termoCasaNoAnuncio no filtro real da vitrine', () => {
    // A REGRA (o filtro da vitrine chamar `termoCasaNoAnuncio` com o
    // termo e o anúncio) é o que este teste trava. A FORMA da linha
    // não é: na Tarefa 1.3 a condição ganhou a leitura conversacional
    // ao lado (`anunciosDoTermo`), e a linha deixou de caber em uma
    // linha só. A regra continua valendo — e há um teste novo, no
    // `buscaConversacional.test.ts`, para a parte conversacional.
    assert.match(
      app,
      /!termoCasaNoAnuncio\(searchQuery, item\)/,
      'o filtro da vitrine não usa termoCasaNoAnuncio'
    );
  });

  it('a chamada do termo fica DENTRO do filtro efetivo da vitrine', () => {
    // Tarefa 1.3b: o teste acima bisa que a CHAMADA existe no fonte.
    // Isso não basta — a chamada pode estar fora do filtro, e aí o
    // termo deixa de filtrar a tela. Este teste confere que a chamada
    // está dentro do `.filter((item) => { ... })` que decide o que
    // aparece na vitrine.
    const bloco = trecho(app, 'const filtrados = categoryListings', '.map((item) => ({');

    const iFiltro = bloco.indexOf('.filter((item) => {');
    assert.ok(iFiltro > -1, 'não achei o filtro efetivo da vitrine');

    const iTermo = bloco.indexOf('termoCasaNoAnuncio(searchQuery, item)');
    assert.ok(iTermo > -1, 'o filtro efetivo da vitrine não usa termoCasaNoAnuncio');
    assert.ok(
      iTermo > iFiltro,
      'a chamada do termo está FORA do filtro efetivo da vitrine'
    );
  });

  it('o filtro efetivo da vitrine carrega o anúncio ATIVO e o alcance regional', () => {
    // Tarefa 1.3b: as duas correções da auditoria precisam ficar
    // presas no filtro da tela — o anúncio encerrado não aparece, e o
    // alcance regional (que barra o anúncio sem UF) é aplicado ali.
    const bloco = trecho(app, 'const filtrados = categoryListings', '.map((item) => ({');

    assert.match(
      bloco,
      /estaAtivo\(item\)/,
      'o filtro da vitrine não filtra o anúncio encerrado/pausado'
    );
    assert.match(
      bloco,
      /passaNoEscopoRegional\(item, escopoRegional\)/,
      'o filtro da vitrine não aplica o alcance regional'
    );
  });

  it('a contagem da escada regional passa pelo MESMO filtro da vitrine', () => {
    // Se a contagem contar o catálogo cru e a tela contar oEffective,
    // a escada decide "a região tem resultado" e a tela mostra vazio.
    // As duas têm que usar o mesmo filtro.
    const bloco = trecho(app, 'const handleBuscaPrincipal', 'const handleEscolherCategoria');

    assert.match(
      bloco,
      /anunciosDaVitrine\(/,
      'a contagem da escada regional não passa pelo filtro da vitrine'
    );
    assert.match(
      bloco,
      /decidirEscopoRegional\(/,
      'a escada regional não está sendo decidida'
    );
  });

  it('a leitura conversacional também entra no filtro real da vitrine', () => {
    // A busca conversacional (frase inteira OU pedaços dela) é o que
    // faz "Escavadeira 20 toneladas" achar a escavadeira de 20 t.
    assert.match(
      app,
      /anunciosDoTermo\(/,
      'o filtro da vitrine não usa a leitura conversacional'
    );
  });

  it('a gravação da busca leva o termo digitado para o searchQuery da tela real', () => {
    const i = app.indexOf('const handleCreateBuyerListing');
    assert.ok(i > 0, 'não achei handleCreateBuyerListing');
    const corpo = app.slice(i, i + 4200);
    assert.match(
      corpo,
      /setSearchQuery\(termoDaBusca\)/,
      'a busca salva não leva o termo para a tela de resultados'
    );
    // E o termo vem do que a pessoa digitou, não inventado
    assert.match(
      corpo,
      /newListingData\.brand[\s\S]*?newListingData\.model/,
      'o termo deve vir de brand/model digitados'
    );
  });
});

describe('mini-1.2 · falha no Supabase não deixa busca duplicada', () => {
  const app = readFileSync(resolvePath(aqui, '../App.tsx'), 'utf8');
  const i = app.indexOf('const handleCreateBuyerListing');
  assert.ok(i > 0);
  const corpo = app.slice(i, i + 5200);

  it('existe uma rotina de desfazer a espelhagem otimista', () => {
    assert.match(corpo, /const desfazerEspelho = \(\) =>/, 'sem rollback');
    assert.match(
      corpo,
      /prev\.filter\(\(it\) => it\.id !== newItem\.id\)/,
      'o rollback não remove a demanda espelhada'
    );
    // E o localStorage é reescrito sem ela
    assert.match(corpo, /semEssa/, 'o rollback não limpa o localStorage');
  });

  it('o rollback é chamado no caminho de erro do Supabase', () => {
    // O `catch` que importa é o que envolve o `await backend.salvar`.
    const posSalvar = corpo.indexOf('await backend.salvar');
    assert.ok(posSalvar > 0, 'não achei o await backend.salvar');
    // Ancorar no `return { ok: true }` do caminho de sucesso: o catch
    // logo depois é o do `backend.salvar`. Sem essa âncora, o
    // `catch (e) {}` do localStorage (que vem antes) seria achado.
    const posOk = corpo.indexOf('return { ok: true };', posSalvar);
    assert.ok(posOk > posSalvar, 'não achei o retorno de sucesso');
    const posCatch = corpo.indexOf('catch', posOk);
    assert.ok(posCatch > posOk, 'não achei o catch do backend.salvar');
    const janela = corpo.slice(posCatch, posCatch + 320);
    assert.match(
      janela,
      /desfazerEspelho\(\)/,
      'falha do Supabase não desfaz a inclusão otimista'
    );
  });

  it('o rollback também roda sem backend ou sem sessão', () => {
    const sem = corpo.slice(corpo.indexOf('sem backend ou sem sessão'))
    assert.match(sem.slice(0, 400), /desfazerEspelho\(\)/,
      'sem backend/sessão a demanda ficaria órfã na lista');
  });
});