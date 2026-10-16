/**
 * Teste focado: pedir navegação para rota privada nos TRÊS estados.
 *
 * Este arquivo existe por causa de um defeito concreto. `navigateToMeusAnuncios`
 * e `navigateToEditListing` usavam `!sessaoOk`, o que tratava "a verificação
 * está em andamento" e "a verificação terminou e não há sessão" do mesmo jeito.
 *
 * O custo disso não é teórico: quem está logado dá F5, o servidor ainda não
 * respondeu, a pessoa clica no próprio anúncio, e o modal de login abre por
 * cima do feed. Ela conclui que foi desconectada — e estava logada.
 *
 *   node --import ./test-helpers/register.mjs --test src/services/navegacaoPrivada.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { decidirNavegarPrivado } from './rotas.ts';

/* ─────────── a decisão pura ─────────── */

describe('decidirNavegarPrivado — os três estados', () => {
  test('CARREGANDO: aguardar', () => {
    // Nem login, nem URL, nem tela. A resposta chega em instantes.
    assert.equal(decidirNavegarPrivado(true, false), 'aguardar');
  });

  test('CARREGANDO com sessão em cache: ainda aguardar', () => {
    // `sessao` em cache pode ser um token já expirado. O que vale é a
    // validação do servidor, e ela ainda não chegou.
    assert.equal(decidirNavegarPrivado(true, true), 'aguardar');
  });

  test('CARREGADO e COM sessão: permitir', () => {
    assert.equal(decidirNavegarPrivado(false, true), 'permitir');
  });

  test('CARREGADO e SEM sessão: pedir login', () => {
    assert.equal(decidirNavegarPrivado(false, false), 'pedir-login');
  });
});

/* ─────────── o que cada estado provoca de fato ─────────── */

describe('efeito de cada estado no navegador', () => {
  /**
   * Reproduz o corpo das duas funções de navegação do `App.tsx`.
   *
   * Não é o código real — é a mesma sequência de decisões, escrita de
   * forma que se possa observar. O que importa é que, no estado
   * "carregando", nada acontece: nem o modal, nem o histórico.
   */
  const navegar = (
    sessaoCarregando: boolean,
    temSessao: boolean
  ): { loginAberto: boolean; fezPushState: boolean; trocouTela: boolean } => {
    const efeito = { loginAberto: false, fezPushState: false, trocouTela: false };

    const decisao = decidirNavegarPrivado(sessaoCarregando, temSessao);
    if (decisao === 'aguardar') return efeito;
    if (decisao === 'pedir-login') {
      efeito.loginAberto = true;
      return efeito;
    }
    efeito.fezPushState = true;
    efeito.trocouTela = true;
    return efeito;
  };

  test('durante o carregamento não pede login, não faz pushState, não troca tela', () => {
    const e = navegar(true, false);
    assert.equal(e.loginAberto, false, 'não pode pedir login antes de saber');
    assert.equal(e.fezPushState, false, 'não pode gravar rota privada na URL');
    assert.equal(e.trocouTela, false, 'não pode trocar para a tela privada');
  });

  test('o mesmo vale com sessão em cache durante o carregamento', () => {
    const e = navegar(true, true);
    assert.equal(e.loginAberto, false);
    assert.equal(e.fezPushState, false);
    assert.equal(e.trocouTela, false);
  });

  test('com sessão confirmada, navega sem pedir login', () => {
    const e = navegar(false, true);
    assert.equal(e.loginAberto, false);
    assert.equal(e.fezPushState, true);
    assert.equal(e.trocouTela, true);
  });

  test('verificação concluída sem sessão pede login e NÃO navega', () => {
    const e = navegar(false, false);
    assert.equal(e.loginAberto, true);
    // A URL não pode ter mudado: um replaceState depois desfaz a rota,
    // mas deixa o histórico gravado apontando para a rota privada.
    assert.equal(e.fezPushState, false);
    assert.equal(e.trocouTela, false);
  });
});

/* ─────────── a regressão que motivou o teste ─────────── */

describe('a checagem antiga tratava carregando e sem sessão como iguais', () => {
  test('a diferença entre as duas checagens é real, não cosmética', () => {
    // O caminho antigo: `!sessaoOk`, que vale para os dois casos.
    const sessaoVaziaDuranteCarga = false; // `sessao === null` neste instante
    const carregando = true;

    // O caminho antigo era `if (!sessaoOk) { abrir login }`. Ou seja:
    // ele ABRIA o login sempre que `sessaoOk` era falso, e `sessaoOk` é
    // falso tanto no carregamento quanto sem sessão. Reproduzimos o
    // `abreLogin`, que é o que a checagem antiga fazia.
    const sessaoOk = !(carregando || sessaoVaziaDuranteCarga);
    const abreLogin = !sessaoOk;
    const novo = decidirNavegarPrivado(carregando, sessaoVaziaDuranteCarga);

    assert.equal(abreLogin, true, 'a checagem antiga abria o login à toa');
    assert.equal(novo, 'aguardar', 'a nova espera o servidor responder');
  });

  test('mas os dois coincidem quando a verificação terminou sem sessão', () => {
    const carregando = false;
    const temSessao = false;

    // `sessaoOk` era `!carregando && temSessao`; o login abria quando
    // ela era falsa. Terminada a verificação sem sessão, os dois
    // caminhos mandam pedir login.
    const abreLogin = !(!carregando && temSessao);
    const novo = decidirNavegarPrivado(carregando, temSessao);

    // A correção não pode ter quebrado o caso que já funcionava.
    assert.equal(abreLogin, true);
    assert.equal(novo, 'pedir-login');
  });

  test('e também quando há sessão confirmada', () => {
    const carregando = false;
    const temSessao = true;

    const abreLogin = !(!carregando && temSessao);
    const novo = decidirNavegarPrivado(carregando, temSessao);

    assert.equal(abreLogin, false, 'com sessão, a checagem antiga não abria nada');
    assert.equal(novo, 'permitir');
  });
});
