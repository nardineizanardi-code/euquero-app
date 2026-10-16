/**
 * Testes focados nos dois pontos da correção.
 *
 *   1. retorno após login, aceitando só rota interna autorizada
 *   2. proteção da tela privada por visualizado, não por URL
 *
 * Só estes comportamentos. A suíte completa, o typecheck e o build já
 * foram executados e não são repetidos aqui.
 *
 *   node --import ./test-helpers/register.mjs --test src/services/rotasCorrecao.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  ROTAS_PRIVADAS,
  viewPrivada,
  podeRenderizar,
  sessaoConfirmada,
  destinoAposEntrar,
  destinoDoLogin,
  rotaPrivada,
  decidirRota,
} from './rotas.ts';

/* ══════════════════════════════════════════════════════════════
   PONTO 1 — RETORNO APÓS LOGIN
   ══════════════════════════════════════════════════════════════ */

describe('destinoAposEntrar — devolve só rota interna autorizada', () => {
  test('redireciona para uma rota privada válida', () => {
    const d = destinoAposEntrar('?redirect=%2Fmeus-anuncios');
    assert.deepEqual(d, { rota: '/meus-anuncios', busca: '' });
  });

  test('PRESERVA o id do anúncio em /editar-anuncio', () => {
    // A pergunta que decide se isto é útil: a pessoa caiu no login
    // tentando editar o anúncio X. Perdeu o id, ela abre um formulário
    // em branco e não entende por quê.
    const d = destinoAposEntrar('?redirect=%2Feditar-anuncio&id=abc-123');
    if (d === null) throw new Error('deveria devolver um destino');
    assert.equal(d.rota, '/editar-anuncio');
    assert.equal(d.busca, '?id=abc-123');
    assert.equal(new URLSearchParams(d.busca).get('id'), 'abc-123');
  });

  test('preserva outros parâmetros além do redirect', () => {
    const d = destinoAposEntrar('?id=xyz&redirect=%2Feditar-anuncio&origem=email');
    if (d === null) throw new Error('deveria devolver um destino');
    assert.equal(d.rota, '/editar-anuncio');
    const q = new URLSearchParams(d.busca);
    assert.equal(q.get('id'), 'xyz');
    assert.equal(q.get('origem'), 'email');
    assert.equal(q.get('redirect'), null, 'o redirect sai da URL');
  });

  test('REJEITA destino externo', () => {
    // `redirect` vem da URL, e URL é entrada de usuário. Aceitar
    // destino externo transforma o login em redirecionador aberto.
    for (const malicioso of [
      'https://site-malvado.example',
      'http://localhost:1234',
      '//site-malvado.example',
      'javascript:alert(1)',
      '/meus-anuncios.evil.example',
      '/',
      '/produto/qualquer-coisa',
      '/redefinir-senha',
    ]) {
      const d = destinoAposEntrar(`?redirect=${encodeURIComponent(malicioso)}`);
      assert.equal(d, null, `deveria rejeitar: ${malicioso}`);
    }
  });

  test('sem redirect, não há destino', () => {
    assert.equal(destinoAposEntrar(''), null);
    assert.equal(destinoAposEntrar('?outra=coisa'), null);
  });

  test('aceita as três rotas privadas da lista', () => {
    for (const r of ROTAS_PRIVADAS) {
      const d = destinoAposEntrar(`?redirect=${encodeURIComponent(r)}`);
      if (d === null) throw new Error(`${r} deveria ser aceito`);
      assert.equal(d.rota, r);
    }
  });

  test('ida e volta: destinoDoLogin → destinoAposEntrar preserva a rota', () => {
    // O ciclo completo que a pessoa percorre: é barrada, entra, volta.
    const url = destinoDoLogin('/editar-anuncio', '?id=anuncio-7');
    const params = new URLSearchParams(url.split('?')[1]);
    assert.equal(params.get('redirect'), '/editar-anuncio');

    const volta = destinoAposEntrar(params.toString());
    if (volta === null) throw new Error('o ciclo tem que fechar');
    assert.equal(volta.rota, '/editar-anuncio');
    assert.equal(new URLSearchParams(volta.busca).get('id'), 'anuncio-7');
  });
});

/* ══════════════════════════════════════════════════════════════
   PONTO 2 — A TELHA PRIVADA NÃO DEPENDE DA URL
   ══════════════════════════════════════════════════════════════ */

describe('proteção por visualizado (o bug que a URL escondia)', () => {
  test('tela privada NÃO renderiza sem sessão, mesmo com URL pública', () => {
    // Este é o bug. A URL ainda era `/` quando o `setCurrentView`
    // trocou a tela: a guarda antiga olhava a URL, via "permitida",
    // e o formulário de edição aparecia deslogado.
    assert.equal(
      podeRenderizar('editar_anuncio', false, false),
      false,
      'a URL diz / (pública), mas a tela é privada e não há sessão',
    );
  });

  test('tela privada NÃO renderiza enquanto a sessão carrega', () => {
    assert.equal(podeRenderizar('editar_anuncio', true, false), false);
    // Mesmo com `temSessao` em cache: a sessão pode ser um token
    // expirado, e a validação é o que o servidor responde.
    assert.equal(podeRenderizar('editar_anuncio', true, true), false);
    assert.equal(podeRenderizar('meus_anuncios', true, true), false);
  });

  test('tela privada renderiza com sessão carregada e válida', () => {
    assert.equal(podeRenderizar('editar_anuncio', false, true), true);
    assert.equal(podeRenderizar('meus_anuncios', false, true), true);
  });

  test('tela pública renderiza sempre', () => {
    for (const v of ['home', 'chat']) {
      assert.equal(podeRenderizar(v, false, false), true, v);
      assert.equal(podeRenderizar(v, true, false), true, v);
    }
  });

  test('a tela e a rota privada se correspondem', () => {
    // Se uma tela privada não tiver rota na lista, o `redirect` do
    // login não volta para ela. Se uma rota não tiver tela, a
    // proteção da rota vira um beco sem saída.
    assert.equal(viewPrivada('meus_anuncios'), true);
    assert.equal(viewPrivada('editar_anuncio'), true);
    assert.equal(viewPrivada('home'), false);
    assert.equal(viewPrivada('chat'), false);
  });
});

describe('sessão não confirmada durante o carregamento', () => {
  test('carregando é sempre não-confirmada', () => {
    assert.equal(sessaoConfirmada(true, true), false);
    assert.equal(sessaoConfirmada(true, false), false);
  });

  test('só é confirmada quando terminou de carregar e há sessão', () => {
    assert.equal(sessaoConfirmada(false, true), true);
    assert.equal(sessaoConfirmada(false, false), false);
  });

  test('navegar para painel durante o carregamento pediria login à toa', () => {
    // Se a navegação usasse `!sessao`, uma pessoa logada que dá F5
    // veria o modal de login abrir sozinho, porque `sessao` ainda é
    // `null` enquanto o servidor não responde.
    const sessaoAindaNula = false;   // `sessao === null` neste instante
    const carregando = true;
    const porSessaoBruta = !sessaoAindaNula;       // o jeito antigo
    const porSessaoOk = sessaoConfirmada(carregando, sessaoAindaNula === null);

    assert.equal(porSessaoBruta, true, 'a checagem antiga abriria o login');
    assert.equal(porSessaoOk, false, 'a checagem nova espera o servidor');
  });
});

describe('a guarda de URL continua valendo', () => {
  test('acesso direto a rota privada segue bloqueado', () => {
    // Digitar /meus-anuncios na barra de endereços.
    assert.equal(decidirRota('/meus-anuncios', false, false), 'bloqueada');
    assert.equal(decidirRota('/painel-vendedor', false, false), 'bloqueada');
    assert.equal(decidirRota('/editar-anuncio', false, false), 'bloqueada');
  });

  test('logout mantém a rota bloqueada', () => {
    const antes = decidirRota('/editar-anuncio', false, true);
    const depois = decidirRota('/editar-anuncio', false, false);
    assert.equal(antes, 'permitida');
    assert.equal(depois, 'bloqueada');
  });

  test('redefinir-senha continua pública e acessível', () => {
    assert.equal(rotaPrivada('/redefinir-senha'), false);
    assert.equal(decidirRota('/redefinir-senha', false, false), 'permitida');
  });
});
