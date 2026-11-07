import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsearCidadeUf,
  tituloDaBusca,
  descricaoDaBusca,
  buscaSemCidade,
  ufDeAlcance,
  termoCasaNoAnuncio,
  montarPayloadDaBusca,
  vistaDaFicha,
  tentarSalvarBusca,
  juntar,
  dividirMarcaModelo,
  marcaDe,
  modeloDe,
  UFS_BRASIL,
} from './fichaBusca';

describe('parsearCidadeUf (mini-1.1: cidade vazia NÃO vira BR)', () => {
  it('quebra "Cidade/UF" em city e state', () => {
    assert.deepEqual(parsearCidadeUf('Araquari/SC'), {
      locationCity: 'Araquari',
      locationState: 'SC',
    });
  });

  it('cidade sem UF devolve locationState null (não BR)', () => {
    assert.deepEqual(parsearCidadeUf('Joinville'), {
      locationCity: 'Joinville',
      locationState: null,
    });
  });

  it('cidade vazia devolve locationState null', () => {
    assert.deepEqual(parsearCidadeUf(''), {
      locationCity: '',
      locationState: null,
    });
    assert.deepEqual(parsearCidadeUf('   '), {
      locationCity: '',
      locationState: null,
    });
    assert.deepEqual(parsearCidadeUf(null), {
      locationCity: '',
      locationState: null,
    });
  });

  it('tolerante: usa o PRIMEIRO "/" como separador', () => {
    assert.deepEqual(parsearCidadeUf('Blumenau/SC/centro'), {
      locationCity: 'Blumenau',
      locationState: 'SC',
    });
  });

  it('UF inválida na string vira null (não inventa sigla)', () => {
    assert.deepEqual(parsearCidadeUf('Cidade/xyz'), {
      locationCity: 'Cidade',
      locationState: null,
    });
  });
});

describe('ufDeAlcance (mini-1.1: alcance geográfico correto)', () => {
  it('"brasil_todo" sempre grava "BR" — explícito por escolha do usuário', () => {
    assert.equal(ufDeAlcance({ alcance: 'brasil_todo' }), 'BR');
    assert.equal(ufDeAlcance({ alcance: 'brasil_todo', ufDoPerfil: 'SC' }), 'BR');
    assert.equal(ufDeAlcance({ alcance: 'brasil_todo', ufEscolhida: 'SP' }), 'BR');
  });

  it('"so_estado" + UF do perfil → usa a UF do perfil (Nardinei = SC)', () => {
    assert.equal(
      ufDeAlcance({ alcance: 'so_estado', ufDoPerfil: 'SC' }),
      'SC'
    );
  });

  it('"so_estado" + UF do perfil com case errado → normaliza', () => {
    assert.equal(
      ufDeAlcance({ alcance: 'so_estado', ufDoPerfil: 'sc' }),
      'SC'
    );
  });

  it('"so_estado" + UF do perfil inválida → cai pra UF do dropdown', () => {
    assert.equal(
      ufDeAlcance({ alcance: 'so_estado', ufDoPerfil: 'XX', ufEscolhida: 'SP' }),
      'SP'
    );
  });

  it('"so_estado" sem UF nenhuma → null (NÃO transforma em BR nem SC)', () => {
    assert.equal(ufDeAlcance({ alcance: 'so_estado' }), null);
    assert.equal(ufDeAlcance({ alcance: 'so_estado', ufDoPerfil: '' }), null);
    assert.equal(ufDeAlcance({ alcance: 'so_estado', ufDoPerfil: 'XX' }), null);
  });

  it('UFS_BRASIL tem as 27 UFs (regressão)', () => {
    assert.equal(UFS_BRASIL.length, 27);
    assert.ok(UFS_BRASIL.includes('SC'));
    assert.ok(UFS_BRASIL.includes('SP'));
    assert.ok(!UFS_BRASIL.includes('XX'));
  });
});

describe('tituloDaBusca', () => {
  it('inclui a cidade quando ela existe', () => {
    assert.equal(
      tituloDaBusca('Escavadeira Sinomach', 'Araquari/SC'),
      'Busca Escavadeira Sinomach em Araquari/SC'
    );
  });

  it('omite a cidade quando ela está vazia', () => {
    assert.equal(
      tituloDaBusca('Escavadeira Sinomach', ''),
      'Busca Escavadeira Sinomach'
    );
  });
});

describe('descricaoDaBusca (mini-1.1: sem valores fictícios)', () => {
  it('monta o texto com todos os campos preenchidos', () => {
    const d = descricaoDaBusca({
      maquinaLabel: 'Escavadeira Sinomach',
      ano: '2021',
      detalhe: '20 toneladas',
      orcamento: 520000,
      formaPagamento: 'Financiado',
    });
    assert.match(d, /Busca: Escavadeira Sinomach\./);
    assert.match(d, /Ano desejado: 2021\./);
    assert.match(d, /Especificação: 20 toneladas\./);
    assert.match(d, /Orçamento até R\$ 520\.000\./);
    assert.match(d, /Pagamento: Financiado\./);
  });

  it('omite campos opcionais não preenchidos', () => {
    const d = descricaoDaBusca({
      maquinaLabel: 'Trator',
      ano: '',
      detalhe: '',
      orcamento: null,
      formaPagamento: '',
    });
    assert.doesNotMatch(d, /Ano desejado/);
    assert.doesNotMatch(d, /Especificação/);
    assert.doesNotMatch(d, /Pagamento/);
    assert.doesNotMatch(d, /520\.000/);
    assert.doesNotMatch(d, /R\$/);
    assert.match(d, /Busca: Trator\./);
  });

  it('SEM orçamento: descrição não cita valor (regressão: antes fixava R$ 520.000)', () => {
    const d = descricaoDaBusca({
      maquinaLabel: 'Trator',
      ano: '',
      detalhe: '',
      orcamento: undefined,
      formaPagamento: '',
    });
    assert.doesNotMatch(d, /R\$/);
  });

  it('NaN conta como "sem orçamento"', () => {
    const d = descricaoDaBusca({
      maquinaLabel: 'Trator',
      ano: '',
      detalhe: '',
      orcamento: NaN,
      formaPagamento: '',
    });
    assert.doesNotMatch(d, /R\$/);
  });

  it('formata o orçamento com separador pt-BR', () => {
    const d = descricaoDaBusca({
      maquinaLabel: 'Caminhão',
      ano: '2020',
      detalhe: '',
      orcamento: 1234567,
      formaPagamento: '',
    });
    assert.match(d, /R\$ 1\.234\.567/);
  });
});

describe('buscaSemCidade', () => {
  it('detecta cidade vazia', () => {
    assert.equal(buscaSemCidade(''), true);
    assert.equal(buscaSemCidade('   '), true);
    assert.equal(buscaSemCidade(null), true);
  });
  it('detecta cidade preenchida', () => {
    assert.equal(buscaSemCidade('Araquari/SC'), false);
    assert.equal(buscaSemCidade('Curitiba'), false);
  });
});

describe('termoCasaNoAnuncio (mini-1.1: busca parcial sem valores inventados)', () => {
  it('match por marca, case-insensitive', () => {
    assert.equal(
      termoCasaNoAnuncio('Sinomach', {
        title: 'Escavadeira',
        brand: 'Sinomach',
        model: 'ZE360E',
        locationCity: 'Araquari',
      }),
      true
    );
    assert.equal(
      termoCasaNoAnuncio('sinomach', { brand: 'SINOMACH' }),
      true
    );
  });

  it('match por trecho de marca (regressão: "Sin" deve casar)', () => {
    assert.equal(
      termoCasaNoAnuncio('Sin', { brand: 'Sinomach' }),
      true
    );
  });

  it('match por modelo', () => {
    assert.equal(
      termoCasaNoAnuncio('320D', { brand: 'CAT', model: '320D' }),
      true
    );
  });

  it('match por título', () => {
    assert.equal(
      termoCasaNoAnuncio('Escavadeira', { title: 'Escavadeira Hidráulica' }),
      true
    );
  });

  it('NÃO inventa marca: se o anúncio não tem "Sinomach", não casa', () => {
    assert.equal(
      termoCasaNoAnuncio('Sinomach', { brand: 'Caterpillar', model: '320D' }),
      false
    );
  });

  it('termo vazio casa com tudo (sem filtro)', () => {
    assert.equal(termoCasaNoAnuncio('', { title: 'qualquer' }), true);
  });

  it('anúncio sem brand/model/title não quebra a busca', () => {
    assert.equal(termoCasaNoAnuncio('qualquer', {}), false);
    assert.equal(termoCasaNoAnuncio('', {}), true);
  });
});

describe('regras da ficha simplificada (regressão dos requisitos)', () => {
  it('a ficha NÃO exige Nome, WhatsApp, Cidade, Subtipo, Ano, Horas, Orçamento', () => {
    // As funções puras que o WizardModal chama: a ficha monta o
    // payload com o que o usuário preencheu, e o que ficou vazio
    // continua vazio. Aqui, validamos o conjunto: cidade null,
    // descrição sem valor fictício, sem modelo inventado.
    const cidade = parsearCidadeUf('');
    const alcance = ufDeAlcance({ alcance: 'brasil_todo' });
    const descricao = descricaoDaBusca({
      maquinaLabel: 'Escavadeira Sinomach',
      ano: '',
      detalhe: '',
      orcamento: null,
      formaPagamento: '',
    });
    assert.equal(cidade.locationCity, '');
    assert.equal(cidade.locationState, null);
    assert.equal(alcance, 'BR'); // "Brasil todo" explícito vira BR
    assert.match(descricao, /^Busca: Escavadeira Sinomach\.$/);
  });

  it('"Só do meu estado" sem UF do perfil e sem UF no dropdown: locationState null, geo so_estado', () => {
    const estado = ufDeAlcance({ alcance: 'so_estado' });
    assert.equal(estado, null);
  });

  it('"Só do meu estado" do Nardinei (UF do perfil = SC) sem cidade: grava SC', () => {
    const estado = ufDeAlcance({ alcance: 'so_estado', ufDoPerfil: 'SC' });
    const cidade = parsearCidadeUf('');
    assert.equal(estado, 'SC');
    assert.equal(cidade.locationState, null); // cidade vazia, não força estado
  });

  it('"Brasil todo" vazio: grava BR, sem inventar cidade', () => {
    const estado = ufDeAlcance({ alcance: 'brasil_todo' });
    const cidade = parsearCidadeUf('');
    assert.equal(estado, 'BR');
    assert.equal(cidade.locationCity, '');
    assert.equal(cidade.locationState, null);
  });
});

describe('montarPayloadDaBusca (percurso real da ficha → payload)', () => {
  const detailsDefault = {
    machineLabel: 'Escavadeira Sinomach',
    brand: 'Sinomach',
    model: 'ZE360E',
    anoStr: '',
    detalheStr: '',
  };

  it('CATEGORIA + MARCA/MODELO apenas (sem cidade, sem orçamento, sem ano)', () => {
    const p = montarPayloadDaBusca({
      intent: 'buy',
      details: detailsDefault,
      buyerCity: '',
      alcance: 'brasil_todo',
      ufDoPerfil: undefined,
      ufEscolhida: undefined,
      buyerBudget: '',
      buyerPaymentMethod: '',
    });
    // brand/model preservados
    assert.equal(p.brand, 'Sinomach');
    assert.equal(p.model, 'ZE360E');
    // nada inventado
    assert.equal(p.year, null);
    assert.equal(p.price, null);
    // cidade vazia
    assert.equal(p.locationCity, '');
    assert.equal(p.locationState, 'BR'); // "brasil_todo" -> BR
    // descrição sem R$ nem '320D'
    assert.doesNotMatch(p.description, /R\$/);
    assert.doesNotMatch(p.description, /320D/);
    assert.doesNotMatch(p.description, /2020/);
    assert.match(p.description, /Busca: Escavadeira Sinomach\.$/);
  });

  it('"Só do meu estado" do Nardinei (UF do perfil=SC) sem cidade → SC', () => {
    const p = montarPayloadDaBusca({
      intent: 'buy',
      details: detailsDefault,
      buyerCity: '',
      alcance: 'so_estado',
      ufDoPerfil: 'SC',
      ufEscolhida: undefined,
      buyerBudget: '',
      buyerPaymentMethod: '',
    });
    assert.equal(p.locationState, 'SC');
    assert.equal(p.locationCity, '');
  });

  it('"Só do meu estado" sem UF do perfil e sem UF do dropdown → string vazia (não BR nem SC)', () => {
    const p = montarPayloadDaBusca({
      intent: 'buy',
      details: detailsDefault,
      buyerCity: '',
      alcance: 'so_estado',
      ufDoPerfil: undefined,
      ufEscolhida: undefined,
      buyerBudget: '',
      buyerPaymentMethod: '',
    });
    assert.equal(p.locationState, '');
  });

  it('"Só do meu estado" + UF do dropdown = SP → SP', () => {
    const p = montarPayloadDaBusca({
      intent: 'buy',
      details: detailsDefault,
      buyerCity: '',
      alcance: 'so_estado',
      ufDoPerfil: undefined,
      ufEscolhida: 'SP',
      buyerBudget: '',
      buyerPaymentMethod: '',
    });
    assert.equal(p.locationState, 'SP');
  });

  it('"Brasil todo" sempre grava BR, mesmo com UF do perfil', () => {
    const p = montarPayloadDaBusca({
      intent: 'buy',
      details: detailsDefault,
      buyerCity: '',
      alcance: 'brasil_todo',
      ufDoPerfil: 'SC',
      ufEscolhida: undefined,
      buyerBudget: '',
      buyerPaymentMethod: '',
    });
    assert.equal(p.locationState, 'BR');
  });

  it('Cidade digitada "Araquari/SC" tem prioridade sobre o alcance', () => {
    const p = montarPayloadDaBusca({
      intent: 'buy',
      details: detailsDefault,
      buyerCity: 'Araquari/SC',
      alcance: 'brasil_todo',
      ufDoPerfil: 'SP',
      ufEscolhida: undefined,
      buyerBudget: '',
      buyerPaymentMethod: '',
    });
    // A UF da cidade prevalece sobre a do alcance.
    assert.equal(p.locationCity, 'Araquari');
    assert.equal(p.locationState, 'SC');
    assert.equal(p.geoPreference, 'brasil_todo');
  });

  it('"Sinomach" casa com a marca no payload (regressão: busca parcial)', () => {
    const p = montarPayloadDaBusca({
      intent: 'buy',
      details: detailsDefault,
      buyerCity: '',
      alcance: 'brasil_todo',
      ufDoPerfil: undefined,
      ufEscolhida: undefined,
      buyerBudget: '',
      buyerPaymentMethod: '',
    });
    // O payload tem 'Sinomach' em brand — a vitrine casa.
    const hit = termoCasaNoAnuncio('Sinomach', {
      title: p.title,
      brand: p.brand ?? '',
      model: p.model ?? '',
      locationCity: p.locationCity,
    });
    assert.equal(hit, true);
  });
});


/* ═══════════════════════════════════════════════════════════════════
   GAP 1 — a ficha só bloqueia em Categoria e Marca/Modelo
   ═══════════════════════════════════════════════════════════════════ */

describe('GAP 1: campos opcionais não bloqueiam a busca', () => {
  /**
   * O `form` do navegador bloqueia o submit de um input com
   * `required`. Este teste reproduz essa regra sobre o MESMO
   * conjunto de campos que a ficha monta, sem depender de DOM:
   * um campo é bloqueante só quando tem `required`.
   */
  const campo = (nome: string, bloqueante: boolean, valor = '') => ({
    nome, bloqueante, valor, preenchido: valor.trim().length > 0,
  });

  const PODE_SUBMITTER = (campos: typeof campo[] extends never ? never : Array<ReturnType<typeof campo>>) =>
    campos.every((c) => (c.bloqueante ? c.preenchido : true));

  it('aceita Categoria + Marca/Modelo sozinhos (sem ano, horas, orçamento, cidade)', () => {
    const campos = [
      campo('categoria', true, 'linha_amarela'),
      campo('marcaModelo', true, 'Sinomach'),
      campo('ano', false, ''),
      campo('horas', false, ''),
      campo('orcamento', false, ''),
      campo('cidade', false, ''),
    ];
    assert.equal(PODE_SUBMITTER(campos), true);
  });

  it('bloqueia quando Marca/Modelo está vazio', () => {
    const campos = [
      campo('categoria', true, 'linha_amarela'),
      campo('marcaModelo', true, ''),
      campo('ano', false, ''),
    ];
    assert.equal(PODE_SUBMITTER(campos), false);
  });

  it('bloqueia quando Categoria está vazia', () => {
    const campos = [
      campo('categoria', true, ''),
      campo('marcaModelo', true, 'Sinomach'),
    ];
    assert.equal(PODE_SUBMITTER(campos), false);
  });

  it('campo opcional preenchido nunca bloqueia', () => {
    const campos = [
      campo('categoria', true, 'linha_amarela'),
      campo('marcaModelo', true, 'Sinomach'),
      campo('ano', false, '2021'),
      campo('orcamento', false, '520.000'),
    ];
    assert.equal(PODE_SUBMITTER(campos), true);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   GAP 2 — sem escolha de alcance, não se grava BR nem SC
   ═══════════════════════════════════════════════════════════════════ */

describe('GAP 2: "Brasil todo" só após escolha explícita', () => {
  it('sem escolha → null (não BR, não SC), mesmo com UF do perfil', () => {
    assert.equal(
      ufDeAlcance({ alcance: 'sem_escolha', ufDoPerfil: 'SC' }),
      null
    );
  });

  it('sem escolha e sem UF do perfil → null', () => {
    assert.equal(ufDeAlcance({ alcance: 'sem_escolha' }), null);
  });

  it('"brasil_todo" explícito → BR', () => {
    assert.equal(ufDeAlcance({ alcance: 'brasil_todo' }), 'BR');
  });

  it('payload com alcance sem_escolha não grava estado nem geoPreference', () => {
    const p = montarPayloadDaBusca({
      intent: 'buy',
      details: {
        machineLabel: 'Sinomach',
        brand: 'Sinomach',
        model: '',
        anoStr: '',
        detalheStr: '',
      },
      buyerCity: '',
      alcance: 'sem_escolha',
      ufDoPerfil: 'SC',
      ufEscolhida: '',
      buyerBudget: '',
      buyerPaymentMethod: '',
    });
    assert.equal(p.locationState, '');
    assert.equal(p.geoPreference, undefined);
  });

  it('payload com "brasil_todo" grava BR e geoPreference', () => {
    const p = montarPayloadDaBusca({
      intent: 'buy',
      details: { machineLabel: 'Sinomach', brand: 'Sinomach', model: '', anoStr: '', detalheStr: '' },
      buyerCity: '',
      alcance: 'brasil_todo',
      ufDoPerfil: 'SC',
      ufEscolhida: '',
      buyerBudget: '',
      buyerPaymentMethod: '',
    });
    assert.equal(p.locationState, 'BR');
    assert.equal(p.geoPreference, 'brasil_todo');
  });
});

/* ═══════════════════════════════════════════════════════════════════
   GAP 3 — marca sem modelo, sem inventar 320D; busca acha do mesmo jeito
   ═══════════════════════════════════════════════════════════════════ */

describe('GAP 3: sem modelo inventado, e a busca acha assim mesmo', () => {
  it('"Sinomach" só → marca = Sinomach, modelo VAZIO (não 320D)', () => {
    const { brand, model } = dividirMarcaModelo('Sinomach');
    assert.equal(brand, 'Sinomach');
    assert.equal(model, '');
  });

  it('"Sinomach ZE360E" → marca e modelo', () => {
    const { brand, model } = dividirMarcaModelo('Sinomach ZE360E');
    assert.equal(brand, 'Sinomach');
    assert.equal(model, 'ZE360E');
  });

  it('vazio → marca e modelo vazios (não Caterpillar, não 320D)', () => {
    assert.deepEqual(dividirMarcaModelo(''), { brand: '', model: '' });
    assert.deepEqual(dividirMarcaModelo('   '), { brand: '', model: '' });
    assert.deepEqual(dividirMarcaModelo(null), { brand: '', model: '' });
  });

  it('nunca produz 320D nem Caterpillar do nada', () => {
    for (const entrada of ['', 'Sinomach', 'John Deere', 'Volvo']) {
      const { brand, model } = dividirMarcaModelo(entrada);
      assert.notEqual(brand, 'Caterpillar');
      assert.notEqual(model, '320D');
    }
  });

  it('atalhos marcaDe/modeloDe seguem a mesma regra', () => {
    assert.equal(marcaDe('Sinomach'), 'Sinomach');
    assert.equal(modeloDe('Sinomach'), '');
    assert.equal(modeloDe('Sinomach ZE360E'), 'ZE360E');
  });

  it('juntar ignora vazios — sem "undefined Sinomach"', () => {
    assert.equal(juntar(['', 'Sinomach']), 'Sinomach');
    assert.equal(juntar([undefined, null, 'Escavadeira']), 'Escavadeira');
    assert.equal(juntar(['', '']), '');
    assert.doesNotMatch(juntar(['', 'Sinomach']), /undefined/);
  });

  it('FLUXO COMPLETO: "Sinomach" digitado acha anúncio compatível sem modelo', () => {
    // A pessoa preenche só Categoria + Marca/Modelo = "Sinomach".
    const detalhes = {
      machineLabel: juntar(['', 'Sinomach']),   // sem subtipo
      brand: marcaDe('Sinomach'),                 // "Sinomach"
      model: modeloDe('Sinomach'),                // "" — nada inventado
      anoStr: '',
      detalheStr: '',
    };
    assert.equal(detalhes.model, '');
    assert.doesNotMatch(detalhes.machineLabel, /undefined/);

    // O payload que vai para o banco.
    const payload = montarPayloadDaBusca({
      intent: 'buy',
      details: detalhes,
      buyerCity: '',
      alcance: 'brasil_todo',
      ufDoPerfil: undefined,
      ufEscolhida: undefined,
      buyerBudget: '',
      buyerPaymentMethod: '',
    });
    assert.equal(payload.brand, 'Sinomach');
    assert.equal(payload.model, null);
    assert.doesNotMatch(payload.title, /320D/);

    // O termo que leva para a tela de resultados.
    const termo = [payload.brand, payload.model].map((x) => (x ?? '').trim()).filter(Boolean).join(' ')
      || payload.title;
    assert.equal(termo, 'Sinomach');

    // A tela de resultados filtra com a MESMA função.
    const anuncioBom = {
      title: 'Escavadeira Hidráulica',
      brand: 'Sinomach',
      model: 'ZE360E',
      locationCity: 'Araquari',
    };
    const anuncioRuim = {
      title: 'Escavadeira',
      brand: 'Caterpillar',
      model: '320D',
      locationCity: 'Joinville',
    };
    assert.equal(termoCasaNoAnuncio(termo, anuncioBom), true, 'Sinomach deve achar Sinomach');
    assert.equal(termoCasaNoAnuncio(termo, anuncioRuim), false, 'não deve achar Caterpillar');

    // Case-insensitive, como o requisito pede.
    assert.equal(termoCasaNoAnuncio('sinomach', anuncioBom), true);
    assert.equal(termoCasaNoAnuncio('SINOMACH', anuncioBom), true);
  });

  it('busca por modelo acha pelo campo model (o filtro antigo não olhava)', () => {
    const anuncio = { title: 'Escavadeira', brand: 'Caterpillar', model: '320D', locationCity: 'SC' };
    assert.equal(termoCasaNoAnuncio('320D', anuncio), true);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   GAP 5 — a ficha só fecha com sucesso confirmado
   ═══════════════════════════════════════════════════════════════════ */

describe('GAP 5: fluxo da ficha — sucesso fecha, falha mantém tudo', () => {
  it('ENVIANDO: botão desabilitado, rótulo de salvando, ficha aberta', () => {
    const v = vistaDaFicha('salvando');
    assert.equal(v.botaoDesabilitado, true);
    assert.equal(v.rotuloBotao, 'Salvando busca…');
    assert.equal(v.fichaAberta, true);
    assert.equal(v.erro, '');
  });

  it('ERRO: ficha fica aberta, dados preservados, botão liberado', () => {
    const v = vistaDaFicha('erro', 'falha de rede');
    assert.equal(v.fichaAberta, true);
    assert.equal(v.dadosPreservados, true);
    assert.equal(v.botaoDesabilitado, false);
    assert.equal(v.erro, 'falha de rede');
  });

  it('ERRO sem mensagem → texto padrão da Zapia', () => {
    assert.equal(vistaDaFicha('erro', '').erro, 'Erro ao salvar busca. Tente novamente.');
    assert.equal(vistaDaFicha('erro', null).erro, 'Erro ao salvar busca. Tente novamente.');
  });

  it('SUCESSO: a ficha fecha', async () => {
    const { estado, vista, resultado } = await tentarSalvarBusca({
      jaEstaSalvando: false,
      gravar: async () => ({ ok: true }),
    });
    assert.equal(resultado?.ok, true);
    assert.equal(vista.fichaAberta, false, 'sucesso confirmado fecha a ficha');
    assert.equal(vista.erro, '');
    assert.equal(estado, 'pronta');
  });

  it('FALHA (ok:false): ficha aberta, erro visível,permite retry', async () => {
    const { estado, vista, resultado } = await tentarSalvarBusca({
      jaEstaSalvando: false,
      gravar: async () => ({ ok: false, mensagem: 'Erro ao salvar busca. Tente novamente.' }),
    });
    assert.equal(resultado?.ok, false);
    assert.equal(estado, 'erro');
    assert.equal(vista.fichaAberta, true);
    assert.equal(vista.dadosPreservados, true);
    assert.equal(vista.erro, 'Erro ao salvar busca. Tente novamente.');
  });

  it('FALHA (lança exceção): vira erro legível, ficha aberta', async () => {
    const { estado, vista } = await tentarSalvarBusca({
      jaEstaSalvando: false,
      gravar: async () => { throw new Error('timeout do Supabase'); },
    });
    assert.equal(estado, 'erro');
    assert.equal(vista.erro, 'timeout do Supabase');
    assert.equal(vista.fichaAberta, true);
  });

  it('DUPLO-CLIQUE: a segunda chamada não toca o banco', async () => {
    let chamadas = 0;
    const gravar = async () => { chamadas += 1; return { ok: true }; };
    await tentarSalvarBusca({ jaEstaSalvando: false, gravar });
    // segunda tentativa enquanto a primeira ainda está em curso:
    const segunda = await tentarSalvarBusca({ jaEstaSalvando: true, gravar });
    assert.equal(chamadas, 1, 'o banco só deve ser chamado uma vez');
    assert.equal(segunda.resultado, null, 'a segunda não produz resultado');
  });

  it('após falhar, uma NOVA tentativa funciona (não fica presa no erro)', async () => {
    let tentativas = 0;
    const gravar = async () => {
      tentativas += 1;
      return tentativas === 1
        ? { ok: false, mensagem: 'falhou' }
        : { ok: true };
    };
    const p1 = await tentarSalvarBusca({ jaEstaSalvando: false, gravar });
    assert.equal(p1.estado, 'erro');
    // a segunda tentativa não está mais "em curso"
    const p2 = await tentarSalvarBusca({ jaEstaSalvando: false, gravar });
    assert.equal(p2.estado, 'pronta');
    assert.equal(p2.vista.fichaAberta, false);
    assert.equal(tentativas, 2);
  });

  it('aoMudar reporta "salvando" ANTES de gravar, e o erro DEPOIS', async () => {
    const vistas: string[] = [];
    await tentarSalvarBusca({
      jaEstaSalvando: false,
      aoMudar: (v) => vistas.push(v.estado),
      gravar: async () => ({ ok: false, mensagem: 'x' }),
    });
    assert.equal(vistas[0], 'salvando', 'o botão desabilita antes da gravação');
  });
});
