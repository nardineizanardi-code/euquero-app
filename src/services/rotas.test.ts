/**
 * Testes da guarda de rotas.
 *
 * O que estes testes provam: a decisão de rota, para acesso direto,
 * histórico e logout, é a mesma nos três casos, e nenhuma rota privada
 * fica acessível por acidente.
 *
 * O que eles NÃO provam: que o Supabase devolve a sessão, nem que o
 * RLS barra quem não tem conta. Isso exige o banco e o Preview.
 *
 * Roda com o que já vem no projeto:
 *   node --import ./test-helpers/register.mjs --test src/services/rotas.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  ROTAS_PRIVADAS,
  rotaPrivada,
  decidirRota,
  destinoDoLogin,
  ehRotaDeRedefinicao,
  EH_ROTA_DE_REDEFINICAO,
} from './rotas.ts';

/* ─────────────── quais rotas são privadas ─────────────── */

describe('rotas privadas', () => {
  test('as três rotas do painel exigem sessão', () => {
    for (const r of ['/meus-anuncios', '/painel-vendedor', '/editar-anuncio']) {
      assert.equal(rotaPrivada(r), true, `${r} deveria ser privada`);
    }
  });

  test('a raiz e a redefinição são públicas', () => {
    // A tela de redefinição precisa carregar sem sessão: quem chega
    // pelo e-mail de recuperação não tem conta conectada. Se esta rota
    // virasse privada, a única porta de recuperação de senha fecharia.
    assert.equal(rotaPrivada('/'), false);
    assert.equal(ehRotaDeRedefinicao('/redefinir-senha'), true);
  });

  test('barra final e query não trocam a decisão', () => {
    assert.equal(rotaPrivada('/meus-anuncios/'), true);
    assert.equal(rotaPrivada('/editar-anuncio?id=123'), true);
  });

  test('uma rota que só contém o nome NÃO é privada', () => {
    // `/meus-anuncios-publico` é outra página. Comparar por substring
    // abriria o painel para quem digitasse o endereço errado.
    assert.equal(rotaPrivada('/meus-anuncios-publico'), false);
    assert.equal(rotaPrivada('/ajuda/meus-anuncios'), false);
  });

  test('listas as mesmas rotas que protege', () => {
    // A constante e a função não podem divergir: se alguém acrescentar
    // uma rota na lista e esquecer da comparação, ela fica protegida
    // no papel e aberta na prática.
    for (const r of ROTAS_PRIVADAS) {
      assert.equal(rotaPrivada(r), true, `${r} está na lista mas não é reconhecida`);
    }
  });
});

/* ─────────────── a decisão, nos três estados ─────────────── */

describe('decidirRota', () => {
  test('carregando: decide NADA, nem libera nem barra', () => {
    // Este é o estado que evita o pior bug da guarda: recarregar a
    // página logada, a sessão demora um instante a vir do servidor, e
    // uma guarda apressada expulsa a pessoa antes da resposta.
    assert.equal(decidirRota('/meus-anuncios', true, false), 'carregando');
    assert.equal(decidirRota('/meus-anuncios', true, true), 'carregando');
    assert.equal(decidirRota('/', true, false), 'carregando');
  });

  test('carregando nunca libera rota privada, mesmo com sessão em cache', () => {
    // A sessão em cache pode ser de um token já expirado. Renderizar o
    // painel antes do `getUser()` responder seria confiar no token local.
    assert.equal(decidirRota('/editar-anuncio', true, true), 'carregando');
  });

  test('carregado, sem sessão: rota privada é bloqueada', () => {
    assert.equal(decidirRota('/meus-anuncios', false, false), 'bloqueada');
    assert.equal(decidirRota('/painel-vendedor', false, false), 'bloqueada');
    assert.equal(decidirRota('/editar-anuncio', false, false), 'bloqueada');
  });

  test('carregado, com sessão: rota privada é liberada', () => {
    assert.equal(decidirRota('/meus-anuncios', false, true), 'permitida');
    assert.equal(decidirRota('/editar-anuncio', false, true), 'permitida');
  });

  test('rota pública nunca é bloqueada, mesmo deslogado', () => {
    assert.equal(decidirRota('/', false, false), 'permitida');
    assert.equal(decidirRota('/redefinir-senha', false, false), 'permitida');
  });

  test('logout: a decisão muda na hora, sem esperar nada', () => {
    // A sessão sai, a guarda vê `false` no mesmo render. Se houvesse
    // cache, o painel continuaria à vista depois de sair.
    const antes = decidirRota('/meus-anuncios', false, true);
    const depois = decidirRota('/meus-anuncios', false, false);
    assert.equal(antes, 'permitida');
    assert.equal(depois, 'bloqueada');
  });
});

/* ─────────────── para onde vai quem foi barrado ─────────────── */

describe('destinoDoLogin', () => {
  test('guarda o destino para voltar depois de entrar', () => {
    const d = destinoDoLogin('/meus-anuncios');
    assert.match(d, /^\/\?/, 'deve ser a raiz com query');
    assert.match(d, /redirect=%2Fmeus-anuncios|redirect=\/meus-anuncios/);
  });

  test('preserva a query original (o id do anúncio em edição)', () => {
    const d = destinoDoLogin('/editar-anuncio', '?id=abc-123');
    assert.match(d, /id=abc-123/);
    assert.match(d, /redirect=/);
  });

  test('nunca manda para a própria rota barrada', () => {
    // Redirecionar para /meus-anuncios denovo seria um laço: a guarda
    // barra de novo, e a pessoa fica presa.
    const d = destinoDoLogin('/meus-anuncios');
    assert.ok(!d.includes('meus-anuncios?') || d.includes('redirect='));
    assert.ok(d.startsWith('/?'), 'o destino tem de ser a raiz');
  });

  test('rota pública vai direto para a raiz, sem query', () => {
    assert.equal(destinoDoLogin('/'), '/');
  });

  test('a origem de query não vira open redirect', () => {
    // `?redirect=https://sites-malvados.example` numa URL privada seria
    // copiado para dentro do nosso próprio redirect. Esta checagem
    // trava o caminho de saída.
    const d = destinoDoLogin('/meus-anuncios', '?redirect=https://evil.example');
    const params = new URLSearchParams(d.split('?')[1]);
    const valor = params.get('redirect');
    assert.equal(valor, '/meus-anuncios', 'o destino gravado é sempre uma rota interna');
  });
});

/* ─────────────── a rota de redefinição sobrevive ─────────────── */

describe('rota de redefinição', () => {
  test('é reconhecida com barra final e query', () => {
    assert.equal(ehRotaDeRedefinicao('/redefinir-senha'), true);
    assert.equal(ehRotaDeRedefinicao('/redefinir-senha/'), true);
    assert.equal(ehRotaDeRedefinicao('/redefinir-senha?origem=email'), true);
  });

  test('não é confundida com rota privada', () => {
    // Se voltasse a ser privada, quem clica no e-mail de recuperação
    // receberia a tela de login em vez da de troca de senha.
    assert.equal(rotaPrivada(EH_ROTA_DE_REDEFINICAO), false);
    assert.equal(decidirRota('/redefinir-senha', false, false), 'permitida');
  });
});
