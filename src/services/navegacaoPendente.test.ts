/**
 * Testes da navegação pendente.
 *
 * O problema que estes testes cobrem: o clique pode chegar antes de a
 * sessão responder. Antes, esse clique era descartado — a pessoa clicava
 * no anúncio logo após o F5, nada acontecia, e ela clicava de novo sem
 * saber por quê.
 *
 * Aqui a intenção é guardada e retomada quando o servidor responde,
 * e consumida uma única vez. Consumir uma vez é o ponto difícil: se a
 * intenção sobrevivesse depois de executada, um re-render ou uma troca
 * de conta repetiria a navegação sem que ninguém tivesse clicado.
 *
 *   node --import ./test-helpers/register.mjs --test src/services/navegacaoPendente.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  aoPedirNavegar,
  resolverPendente,
  rotaDaIntencao,
  buscaDaIntencao,
  destinoDaIntencao,
  type IntencaoNavegar,
} from './rotas.ts';

const MEUS: IntencaoNavegar = { tipo: 'meus-anuncios' };
const EDITAR: IntencaoNavegar = { tipo: 'editar-anuncio', id: 'anuncio-42' };

/* ══════════════ o clique chega durante o carregamento ══════════════ */

describe('clique durante o carregamento guarda a intenção', () => {
  test('não executa, não abre login: devolve "guardar"', () => {
    const a = aoPedirNavegar(EDITAR, true, false);
    assert.equal(a.tipo, 'guardar');
  });

  test('preserva o id do anúncio na intenção guardada', () => {
    const a = aoPedirNavegar(EDITAR, true, false);
    assert.equal(a.tipo, 'guardar');
    if (a.tipo !== 'guardar') return;
    assert.equal(a.intencao.tipo, 'editar-anuncio');
    assert.equal(a.intencao.id, 'anuncio-42');
  });

  test('distingue Meus anúncios de Edição', () => {
    const painel = aoPedirNavegar(MEUS, true, false);
    const edicao = aoPedirNavegar(EDITAR, true, false);
    assert.equal(painel.tipo, 'guardar');
    assert.equal(edicao.tipo, 'guardar');
    if (painel.tipo !== 'guardar' || edicao.tipo !== 'guardar') return;
    // A distinção tem de sobreviver ao armazenamento, senão um clique
    // em "editar" vira navegação para o painel.
    assert.equal(painel.intencao.tipo, 'meus-anuncios');
    assert.equal(edicao.intencao.tipo, 'editar-anuncio');
  });

  test('guardar também com sessão em cache: a validação não chegou', () => {
    assert.equal(aoPedirNavegar(EDITAR, true, true).tipo, 'guardar');
  });
});

/* ══════════════ a sessão chega válida ══════════════ */

describe('clique durante o carregamento + sessão válida', () => {
  test('a intenção guardada é executada quando a sessão chega', () => {
    const guarda = aoPedirNavegar(EDITAR, true, false);
    assert.equal(guarda.tipo, 'guardar');
    if (guarda.tipo !== 'guardar') return;

    // o servidor respondeu, com sessão
    const retomada = resolverPendente(guarda.intencao, false, true);
    assert.equal(retomada.tipo, 'executar');
    if (retomada.tipo !== 'executar') return;
    if (retomada.intencao.tipo !== 'editar-anuncio') {
      throw new Error('a intencao tem de ser de edicao');
    }
    assert.equal(retomada.intencao.id, 'anuncio-42');
  });

  test('com sessão válida, o clique vai direto (sem guardar)', () => {
    const a = aoPedirNavegar(MEUS, false, true);
    assert.equal(a.tipo, 'executar');
  });
});

/* ══════════════ a sessão chega ausente ══════════════ */

describe('clique durante o carregamento + sessão ausente', () => {
  test('a intenção guardada vira login, preservando o destino', () => {
    const guarda = aoPedirNavegar(EDITAR, true, false);
    if (guarda.tipo !== 'guardar') throw new Error('deveria guardar');

    const retomada = resolverPendente(guarda.intencao, false, false);
    assert.equal(retomada.tipo, 'abrir-login');
    if (retomada.tipo !== 'abrir-login') throw new Error('deveria abrir login');
    if (retomada.intencao.tipo !== 'editar-anuncio') {
      throw new Error('a intencao tem de ser de edicao');
    }
    // O destino precisa preservar o id: sem ele, a pessoa entraria e
    // abriria um formulário em branco.
    assert.equal(retomada.intencao.id, 'anuncio-42');
  });

  test('com sessão ausente, o clique abre login direto', () => {
    assert.equal(aoPedirNavegar(MEUS, false, false).tipo, 'abrir-login');
  });

  test('o destino do login leva o id, para a volta funcionar', () => {
    // `abrirLoginGuardandoDestino` escreve `?redirect=…&id=…` na URL, e
    // é de lá que `destinoAposEntrar` lê no `onEntrou`.
    const destino = destinoDaIntencao(EDITAR);
    assert.equal(destino, '/editar-anuncio?id=anuncio-42');
    assert.equal(destinoDaIntencao(MEUS), '/meus-anuncios');
  });
});

/* ══════════════ execução única ══════════════ */

describe('a intenção é consumida uma única vez', () => {
  test('depois de consumida, não há nada pendente', () => {
    // O estado que o `App.tsx` mantém é `null` depois do consumo. É esse
    // `null` que impede a repetição.
    const executada = resolverPendente(null, false, true);
    assert.equal(executada.tipo, 'aguardar');
  });

  test('re-render com a sessão já resolvida não repete', () => {
    // Simula o efeito do React rodando de novo: a intenção já foi
    // consumida, então o estado é `null` e nada acontece.
    let pendente: IntencaoNavegar | null = EDITAR;

    const primeira = resolverPendente(pendente, false, true);
    assert.equal(primeira.tipo, 'executar');
    pendente = null;   // consume

    const segunda = resolverPendente(pendente, false, true);
    const terceira = resolverPendente(pendente, false, true);
    assert.equal(segunda.tipo, 'aguardar');
    assert.equal(terceira.tipo, 'aguardar');
  });

  test('troca de sessão não repete a navegação', () => {
    // Logout e login de novo: o efeito dispara com `sessao` mudando, mas
    // a intenção já foi consumida.
    let executou = 0;
    let pendente: IntencaoNavegar | null = EDITAR;

    const rodar = (carregando: boolean, temSessao: boolean) => {
      const r = resolverPendente(pendente, carregando, temSessao);
      if (r.tipo !== 'aguardar') { executou += 1; pendente = null; }
    };

    rodar(false, true);    // executa
    rodar(false, true);    // re-render
    rodar(false, false);   // logout
    rodar(false, true);    // login de novo
    assert.equal(executou, 1, 'a navegação só pode acontecer uma vez');
  });

  test('um clique NOVO durante a verificação cria intenção nova', () => {
    // Consumir não pode impedir a pessoa de pedir de novo.
    let pendente: IntencaoNavegar | null = null;
    let executou = 0;

    const clicar = (intencao: IntencaoNavegar, carregando: boolean, temSessao: boolean) => {
      const a = aoPedirNavegar(intencao, carregando, temSessao);
      if (a.tipo === 'guardar') { pendente = a.intencao; return; }
      if (a.tipo === 'executar') { executou += 1; pendente = null; return; }
      pendente = null;
    };

    clicar(EDITAR, true, false);   // clicou cedo
    const retomada = resolverPendente(pendente, false, true);
    if (retomada.tipo === 'executar') { executou += 1; pendente = null; }
    assert.equal(executou, 1);

    clicar(MEUS, false, true);     // clicou de novo, sessão já pronta
    assert.equal(executou, 2, 'o segundo clique é uma navegação nova, não uma repetição');
  });
});

/* ══════════════ a intenção sobrevive enquanto carrega ══════════════ */

describe('enquanto a verificação não termina, a intenção permanece', () => {
  test('resolver com carregando=true devolve aguardar, sem consumir', () => {
    const r = resolverPendente(EDITAR, true, true);
    assert.equal(r.tipo, 'aguardar');
  });

  test('sem intenção não há o que fazer', () => {
    assert.equal(resolverPendente(null, true, false).tipo, 'aguardar');
    assert.equal(resolverPendente(null, false, false).tipo, 'aguardar');
  });
});
