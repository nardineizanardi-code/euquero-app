import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenizarTermo,
  anunciosDoTermo,
  ufDoAnuncio,
  resolverUfDoComprador,
  resolverCidadeDoComprador,
  vizinhosDaUf,
  decidirEscopoRegional,
  avisoDoEscopo,
  ordenarPorProximidade,
  MINIMO_LOCAL,
} from './buscaConversacional';

/**
 * A busca conversacional é TEXTUAL. Estes testes existem para travar
 * esse comportamento: a frase da pessoa precisa achar o anúncio
 * certo, e a busca precisa priorizar a região dela.
 */

/** Uma escavadeira de 20 t, como a pessoa escreveria. */
const escavadeira20t = {
  id: 'a1',
  title: 'Eng. busca Escavadeira Hidráulica Caterpillar 20-22t',
  brand: 'Caterpillar (CAT)',
  model: '320D / 320 GC',
  locationCity: 'Campinas e Região',
  locationState: 'SP',
  subcategoryType: 'Escavadeira Hidráulica',
  description: 'Buscamos escavadeira de 20 a 22 toneladas para terraplenagem.',
};

/** Um caminhão com caçamba basculante. */
const caminhaoBasculante = {
  id: 'a2',
  title: 'Vendo Caminhão Mercedes-Benz Atego 2426 6x2 Truck Caçamba 2021',
  brand: 'Mercedes-Benz',
  model: 'Atego 2426',
  locationCity: 'Curitiba',
  locationState: 'PR',
  subcategoryType: 'Caminhão Truck',
  description: 'Caminhão truck 6x2 caçamba basculante 14m³, motor revisado.',
};

/** Um trator de 250 cv — o "75 cv" não existe no catálogo dele. */
const trator = {
  id: 'a3',
  title: 'Vendo Trator John Deere 7200J Ano 2021 2.300 Horas',
  brand: 'John Deere',
  model: '7200J',
  locationCity: 'Rondonópolis',
  locationState: 'MT',
  subcategoryType: 'Trator Agrícola',
  description: 'Trator impecável, único dono, cabine CommandView climatizada.',
};

const retroescavadeira = {
  id: 'a4',
  title: 'Vendo Retroescavadeira JCB 3CX 4x4 Ano 2021 Cabinada',
  brand: 'JCB',
  model: '3CX',
  locationCity: 'Curitiba / Betim',
  locationState: 'MG',
  subcategoryType: 'Retroescavadeira JCB 3CX',
  description: 'Excelente estado de conservação, transmissão e tração 4x4.',
};

const catalogo = [escavadeira20t, caminhaoBasculante, trator, retroescavadeira];

describe('tokenizarTermo', () => {
  it('quebra a frase em pedaços sem acento e em minúsculo', () => {
    assert.deepEqual(tokenizarTermo('Escavadeira 20 toneladas'), [
      'escavadeira',
      '20',
      'toneladas',
    ]);
  });

  it('trata "caminhão" e "caminhao" como o mesmo pedaço', () => {
    assert.deepEqual(tokenizarTermo('Caminhão basculante'), ['caminhao', 'basculante']);
  });

  it('ignora pontuação e espaços a mais', () => {
    assert.deepEqual(tokenizarTermo('  Trator   75 cv,  '), ['trator', '75', 'cv']);
  });
});

describe('anunciosDoTermo — a frase inteira primeiro', () => {
  it('acha o anúncio pela frase exata', () => {
    const achados = anunciosDoTermo(catalogo, 'Retroescavadeira');
    assert.equal(achados.length, 1);
    assert.equal(achados[0].id, 'a4');
  });

  it('termo vazio devolve tudo', () => {
    assert.equal(anunciosDoTermo(catalogo, '   ').length, catalogo.length);
  });
});

describe('anunciosDoTermo — a frase lida como conjunto', () => {
  it('"Escavadeira 20 toneladas" acha a escavadeira de 20 t', () => {
    const achados = anunciosDoTermo(catalogo, 'Escavadeira 20 toneladas');
    assert.equal(achados.length, 1);
    assert.equal(achados[0].id, 'a1');
  });

  it('"Caminhão basculante" acha o caminhão de caçamba basculante', () => {
    const achados = anunciosDoTermo(catalogo, 'Caminhão basculante');
    assert.equal(achados.length, 1);
    assert.equal(achados[0].id, 'a2');
  });
});

describe('anunciosDoTermo — o cabeçalho segura a busca', () => {
  it('"Trator 75 cv" acha o trator, porque "75 cv" não existe no catálogo', () => {
    const achados = anunciosDoTermo(catalogo, 'Trator 75 cv');
    assert.equal(achados.length, 1);
    assert.equal(achados[0].id, 'a3');
  });

  it('uma palavra que não existe em lugar nenhum não devolve nada', () => {
    assert.equal(anunciosDoTermo(catalogo, 'Guindaste polluted').length, 0);
  });

  it('palavra sozinha mantém o jeito de sempre (trecho de texto)', () => {
    // "Retroescavadeira" CONTAINS "escavadeira". Com UMA palavra, a
    // busca é a de sempre: o trecho aparece no texto. Quem quiser a
    // escavadeira isolada pede a frase inteira ("Escavadeira 20
    // toneladas"), e aí sim a leitura por pedaço separa as duas.
    const achados = anunciosDoTermo(catalogo, 'Escavadeira');
    assert.deepEqual(achados.map((a) => a.id), ['a1', 'a4']);
  });

  it('a frase separada separa a escavadeira da retroescavadeira', () => {
    const achados = anunciosDoTermo(catalogo, 'Escavadeira 20 toneladas');
    assert.deepEqual(achados.map((a) => a.id), ['a1']);
  });

  it('"Retroescavadeira" acha a retroescavadeira (a frase inteira manda)', () => {
    const achados = anunciosDoTermo(catalogo, 'Retroescavadeira');
    assert.deepEqual(achados.map((a) => a.id), ['a4']);
  });
});

describe('ufDoAnuncio', () => {
  it('usa o locationState quando ele existe', () => {
    assert.equal(ufDoAnuncio({ locationState: 'sp', locationCity: 'Curitiba' }), 'SP');
  });

  it('procura a UF no nome da cidade quando o estado não veio', () => {
    assert.equal(ufDoAnuncio({ locationCity: 'Joinville/SC' }), 'SC');
  });

  it('devolve string vazia quando não dá para saber', () => {
    assert.equal(ufDoAnuncio({ locationCity: 'Rondonópolis' }), '');
  });
});

describe('resolverUfDoComprador', () => {
  it('a UF do perfil tem a maior palavra', () => {
    assert.equal(
      resolverUfDoComprador({ ufDoPerfil: 'MG', cidadeDaProcura: 'Joinville/SC' }),
      'MG'
    );
  });

  it('sem perfil, usa a UF da procura que a pessoa já registrou', () => {
    assert.equal(resolverUfDoComprador({ cidadeDaProcura: 'Joinville/SC' }), 'SC');
  });

  it('sem nada, cai no hub do EuQuero', () => {
    assert.equal(resolverUfDoComprador({}), 'SC');
  });
});

describe('resolverCidadeDoComprador', () => {
  it('tira a UF e fica com a cidade', () => {
    assert.equal(resolverCidadeDoComprador('Joinville/SC'), 'Joinville');
  });

  it('cidade vazia fica vazia (não inventa)', () => {
    assert.equal(resolverCidadeDoComprador(''), '');
    assert.equal(resolverCidadeDoComprador(null), '');
  });
});

describe('vizinhosDaUf', () => {
  it('SC tem PR e RS', () => {
    assert.deepEqual(vizinhosDaUf('SC').sort(), ['PR', 'RS']);
  });

  it('SP tem MG, MS, PR e RJ', () => {
    assert.deepEqual(vizinhosDaUf('SP').sort(), ['MG', 'MS', 'PR', 'RJ']);
  });

  it('UF desconhecida não tem vizinho nenhum', () => {
    assert.deepEqual(vizinhosDaUf('XX'), []);
  });
});

describe('decidirEscopoRegional — a escada da regra de negócio', () => {
  const many = (uf: string, quantidade: number) =>
    Array.from({ length: quantidade }, (_, i) => ({ id: `x${uf}${i}`, locationState: uf }));

  it('fica na região quando a região tem anúncio suficiente', () => {
    const escopo = decidirEscopoRegional({
      uf: 'SC',
      anuncios: many('SC', MINIMO_LOCAL),
    });
    assert.equal(escopo.nivel, 'regiao');
    assert.deepEqual(escopo.estados, ['SC']);
    assert.equal(escopo.naRegiao, MINIMO_LOCAL);
  });

  it('sobe para os vizinhos quando a região tem poucos', () => {
    const escopo = decidirEscopoRegional({
      uf: 'SC',
      anuncios: [...many('SC', 1), ...many('PR', 2)],
    });
    assert.equal(escopo.nivel, 'vizinhos');
    assert.deepEqual(escopo.estados, ['SC', 'PR', 'RS']);
  });

  it('vai para o Brasil todo quando nem a região e nem os vizinhos dão conta', () => {
    const escopo = decidirEscopoRegional({
      uf: 'SC',
      anuncios: many('MG', 5),
    });
    assert.equal(escopo.nivel, 'brasil');
    assert.deepEqual(escopo.estados, []);
    assert.equal(escopo.total, 5);
  });

  it('sem anúncio nenhum o alcance é o Brasil todo', () => {
    const escopo = decidirEscopoRegional({ uf: 'SC', anuncios: [] });
    assert.equal(escopo.nivel, 'brasil');
    assert.equal(escopo.total, 0);
  });
});

describe('avisoDoEscopo', () => {
  it('na região não há aviso — nada foi ampliado', () => {
    const escopo = decidirEscopoRegional({ uf: 'SC', anuncios: [{ locationState: 'SC' }, { locationState: 'SC' }, { locationState: 'SC' }] });
    assert.equal(avisoDoEscopo(escopo), null);
  });

  it('nos vizinhos, o aviso diz para onde a busca foi', () => {
    const escopo = decidirEscopoRegional({
      uf: 'SC',
      anuncios: [{ locationState: 'SC' }, { locationState: 'PR' }, { locationState: 'PR' }],
    });
    assert.equal(escopo.nivel, 'vizinhos');
    const aviso = avisoDoEscopo(escopo);
    assert.ok(aviso);
    assert.match(aviso, /SC/);
    assert.match(aviso, /PR/);
    assert.match(aviso, /Ampliamos/);
  });

  it('no Brasil todo, o aviso diz que a busca abriu', () => {
    const escopo = decidirEscopoRegional({ uf: 'SC', anuncios: [{ locationState: 'MG' }] });
    const aviso = avisoDoEscopo(escopo);
    assert.ok(aviso);
    assert.match(aviso, /Brasil/);
    assert.match(aviso, /SC/);
  });

  it('sem escopo, não há aviso', () => {
    assert.equal(avisoDoEscopo(null), null);
  });
});

describe('ordenarPorProximidade', () => {
  it('região primeiro, vizinhos depois, o resto por último', () => {
    const escopo = decidirEscopoRegional({ uf: 'SC', anuncios: [{ locationState: 'SC' }] });
    const ordenados = ordenarPorProximidade(
      [
        { id: 'mg', locationState: 'MG' },
        { id: 'pr', locationState: 'PR' },
        { id: 'sc', locationState: 'SC' },
      ],
      escopo
    );
    assert.deepEqual(ordenados.map((a) => a.id), ['sc', 'pr', 'mg']);
  });

  it('sem escopo, a ordem original é preservada', () => {
    const original = [{ id: 'b' }, { id: 'a' }];
    assert.deepEqual(ordenarPorProximidade(original, null), original);
  });
});
