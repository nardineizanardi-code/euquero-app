/**
 * Regressão: acesso direto a rota privada tem que ABRIR O LOGIN.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE TESTE PROVA
 *
 * Quando a guarda decide `'bloqueada'` — sessão já verificada, rota
 * privada, sem sessão — o login abre, o destino fica guardado na URL,
 * e a pessoa volta para a tela inicial.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O BUG QUE ESTE TESTE TRAVA
 *
 * A guarda reescrevia a URL e mandava a pessoa para o feed, sem abrir
 * o login. O `?redirect=` ficava gravado e nunca era lido, porque só o
 * `onEntrou` o lê — e o `onEntrou` só existe depois que o login abriu.
 *
 * O botão de perfil e o link do menu abriam o login; o endereço
 * digitado, não. O sintoma era a rota privada "funcionando": a tela
 * não aparecia (a guarda segurava), a URL ficava com o destino, e
 * nenhuma tela de login aparecia para a pessoa entender o que houve.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE OS EFEITOS SÃO INJETADOS
 *
 * O componente que abre o modal é um `.tsx`, e o Node não compila JSX.
 * A mesma ideia de `__injetarCliente` em `sessao.ts`: o serviço recebe
 * o que precisa fazer em vez de fabricar um dentro. Assim o teste
 * observa o que a guarda fez — inclusive SE O LOGIN ABRIU — sem
 * navegador e sem reescrever módulo ESM.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE TESTE NÃO PROVA
 *
 * Que o Supabase devolve a sessão, que o `onEntrou` leva a pessoa de
 * volta para `/meus-anuncios` depois de entrar, nem que o modal
 * aparece na tela. Isso exige o app rodando.
 *
 * Roda com o que já vem no projeto:
 *   node --import ./test-helpers/register.mjs --test src/services/guardaLogin.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  aplicarGuarda,
  decidirGuarda,
  destinoAposEntrar,
  type EfeitosGuarda,
} from './rotas.ts';

/** Efeitos que só registram o que a guarda fez. */
const efeitosQueGravam = () => {
  const registro = {
    urls: [] as string[],
    voltasParaInicio: 0,
    loginsAbertos: 0,
  };
  const efeitos: EfeitosGuarda = {
    trocarUrl: (destino) => { registro.urls.push(destino); },
    voltarParaInicio: () => { registro.voltasParaInicio += 1; },
    abrirLogin: () => { registro.loginsAbertos += 1; },
  };
  return { registro, efeitos };
};

/* ─────────────── acesso direto a rota privada ─────────────── */

describe('acesso direto a rota privada, sem sessão', () => {
  test('ABRE o login', () => {
    const { registro, efeitos } = efeitosQueGravam();
    aplicarGuarda('bloqueada', '/meus-anuncios', '', efeitos);
    assert.equal(
      registro.loginsAbertos, 1,
      'a guarda tinha que abrir o login uma vez'
    );
  });

  test('guarda o destino na URL, para a volta depois de entrar', () => {
    const { registro, efeitos } = efeitosQueGravam();
    aplicarGuarda('bloqueada', '/meus-anuncios', '', efeitos);
    assert.equal(registro.urls.length, 1, 'a URL tinha que ser reescrita uma vez');
    assert.match(
      registro.urls[0], /redirect=%2Fmeus-anuncios/,
      'o destino tinha que ficar guardado em ?redirect='
    );
  });

  test('volta para a tela inicial', () => {
    const { registro, efeitos } = efeitosQueGravam();
    aplicarGuarda('bloqueada', '/meus-anuncios', '', efeitos);
    assert.equal(registro.voltasParaInicio, 1);
  });

  test('o destino guardado é uma rota que o onEntrou sabe ler', () => {
    // O round trip: o `?redirect=` que a guarda grava é o mesmo que o
    // `onEntrou` transforma de volta em rota, quando o login fechar.
    const { registro, efeitos } = efeitosQueGravam();
    aplicarGuarda('bloqueada', '/meus-anuncios', '', efeitos);
    const busca = registro.urls[0].split('?')[1] ?? '';
    const destino = destinoAposEntrar(`?${busca}`);
    assert.ok(destino, 'o destino não podia ser nulo');
    assert.equal(destino?.rota, '/meus-anuncios');
  });

  test('preserva o id do anúncio na edição', () => {
    // Sem o id, `/editar-anuncio` abre um formulário em branco, e a
    // pessoa entraria sem reconhecer qual anúncio está vendo.
    const { registro, efeitos } = efeitosQueGravam();
    aplicarGuarda('bloqueada', '/editar-anuncio', '?id=anuncio-123', efeitos);
    assert.match(registro.urls[0], /redirect=%2Feditar-anuncio/);
    assert.match(registro.urls[0], /id=anuncio-123/);
  });
});

/* ─────────────── fora do caso bloqueado, nada acontece ─────────────── */

describe('a guarda não abre o login fora do caso bloqueado', () => {
  test('não abre enquanto a verificação da sessão está em andamento', () => {
    const { registro, efeitos } = efeitosQueGravam();
    aplicarGuarda('carregando', '/meus-anuncios', '', efeitos);
    assert.equal(registro.loginsAbertos, 0, 'não pode abrir antes de saber');
    assert.equal(registro.urls.length, 0, 'não pode mexer na URL antes de saber');
    assert.equal(registro.voltasParaInicio, 0, 'não pode trocar de tela antes de saber');
  });

  test('não abre em rota pública', () => {
    const { registro, efeitos } = efeitosQueGravam();
    aplicarGuarda('permitida', '/', '', efeitos);
    assert.equal(registro.loginsAbertos, 0);
    assert.equal(registro.urls.length, 0);
  });

  test('não abre com sessão válida', () => {
    const { registro, efeitos } = efeitosQueGravam();
    aplicarGuarda('permitida', '/meus-anuncios', '', efeitos);
    assert.equal(registro.loginsAbertos, 0);
    assert.equal(registro.urls.length, 0);
  });

  test('decidirGuarda só devolve "abrir-login" no caso bloqueado', () => {
    assert.equal(decidirGuarda('carregando', '/meus-anuncios', '').tipo, 'nenhuma');
    assert.equal(decidirGuarda('permitida', '/meus-anuncios', '').tipo, 'nenhuma');
    assert.equal(decidirGuarda('permitida', '/', '').tipo, 'nenhuma');
    assert.equal(decidirGuarda('bloqueada', '/meus-anuncios', '').tipo, 'abrir-login');
  });
});

/* ─────────────── a fiação no componente ─────────────── */

/**
 * O componente é um `.tsx`, e o Node não compila JSX — não dá para
 * importar `App.tsx` no teste. O que resta é olhar o fonte.
 *
 * A checagem é estreita de propósito: ela afirma que o efeito da
 * guarda passa `abrirLogin` ligado ao `setAuthAberto(true)`. É
 * exatamente o que faltava no bug — a guarda reescrevia a URL e
 * segurava a tela, mas nunca abria o login. Sem esta linha, apagar a
 * fiação no `App.tsx` deixaria o teste acima passando.
 */
describe('a fiação da guarda no App', () => {
  const fonte = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

  test('o efeito da guarda passa por aplicarGuarda', () => {
    assert.match(
      fonte,
      /aplicarGuarda\(/,
      'a guarda deveria decidir e agir por aplicarGuarda'
    );
  });

  test('o efeito da guarda abre o login', () => {
    assert.match(
      fonte,
      /abrirLogin:\s*\(\)\s*=>\s*setAuthAberto\(true\)/,
      'a guarda tem que abrir a tela de login quando a rota é bloqueada'
    );
  });
});
