/**
 * Anúncios reais — a ponte entre o app e o banco.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE ESTE ARQUIVO FAZ
 * ═══════════════════════════════════════════════════════════════════════
 * Três coisas, e nada além:
 *
 *   1. LÊ a vitrine pública do Supabase (`public_listings`), com a
 *      allowlist de colunas seguras. Sem sessão, e é assim mesmo: a vitrine
 *      é pública por desenho.
 *   2. LÊ os anúncios do dono (`listings`, sob RLS), quando há sessão.
 *   3. ESCREVE — criar, editar, excluir — sempre com o dono do token, e
 *      sempre filtrando por `owner_id`.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O PRINCÍPIO QUE SEGURA TUDO: FALHA NÃO É DESTRUÇÃO
 * ═══════════════════════════════════════════════════════════════════════
 * Nenhuma operação que falhe apaga o que já existia. O app tem uma
 * segunda vida, local, no `localStorage` — e é ela que aparece quando o
 * banco não responde, quando não há configuração, ou quando o usuário
 * não está logado.
 *
 * O inverso também vale: quando o banco responde, o que veio do banco
 * aparece. A lista é a UNIÃO das duas fontes, com o banco mandando no
 * conflito (mesmo id → o do banco, que é o que tem o id do banco).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * POR QUE UM CLIENTE SÓ
 * ═══════════════════════════════════════════════════════════════════════
 * O cliente vem de `sessao.ts` (`obterClienteParaTela`). Criar um segundo
 * cliente para a mesma projeto tem uma consequência chata: o SDK carrega
 * a sessão do storage de forma ASSÍNCRONA, e uma escrita disparada antes
 * desse carregamento sairia sem token — anônima, e barrada pela RLS sem
 * mensagem útil. O mesmo cliente que já rodou `getUser()` já tem a sessão
 * carregada.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE ESTE ARQUIVO NÃO É
 * ═══════════════════════════════════════════════════════════════════════
 * Não é segurança. O guard daqui é a interface — evita que o botão de
 * excluir apareça onde não deve. Quem protege o dado é a RLS, no banco.
 * Se a RLS estiver errada, a interface mostrar o botão certo não
 * conserta nada; por isso a escrita aqui leva o `owner_id` no filtro
 * mesmo assim, e não confia só no botão.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ListingItem } from '../types/index.ts';
import { obterClienteParaTela, temConfigSessao } from './sessao.ts';
import type { Sessao } from './sessao.ts';
import {
  listPublicListings,
  listMyListings,
  createListing,
  updateListing,
  deleteListing,
} from './listingRepository.ts';
import type { SupabaseLike } from './listingRepository.ts';
import { enviarFotos } from './fotos.ts';
import { INITIAL_LISTINGS } from '../data/initialData.ts';
import { contatarVendedor, listarMensagensDoDono } from './contato.ts';
import type { MensagemContato } from './contato.ts';

/** De onde veio o anúncio que está na tela. */
export type OrigemAnuncio = 'local' | 'backend';

export interface EstadoBackend {
  /** Anúncios que o banco entregou (vitrine pública + os do dono). */
  publicos: ListingItem[];
  /** Anúncios do dono logado, lidos da tabela sob RLS. */
  meus: ListingItem[];
  /** ids dos anúncios do dono. É o que autoriza editar e excluir. */
  idsMeus: ReadonlySet<string>;
  /** O banco está configurado? */
  configurado: boolean;
  /** Carregando a vitrine pública. */
  carregando: boolean;
  /** Houve erro na última operação de escrita. */
  erro: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════
   O CLIENTE
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * O cliente do Supabase, ou `null` se o app não tem configuração.
 *
 * `temConfigSessao()` é consultado antes: sem configuração, o `sessao.ts`
 * AVISA no console toda vez que alguém chama o cliente. O aviso é
 * correto, mas num app sem backend configurado ele vira ruído — e aqui
 * a ausência de backend é um estado normal, não um erro.
 */
const cliente = (): SupabaseLike | null => {
  if (!temConfigSessao()) return null;
  return obterClienteParaTela() as unknown as SupabaseLike | null;
};

/* ═══════════════════════════════════════════════════════════════════════
   A UNIÃO DAS DUAS FONTES
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * O id dos anúncios de DEMONSTRAÇÃO.
 *
 * Os dados de vitrine do app (`INITIAL_LISTINGS`) usam ids `buy-N` e
 * `sell-N`. São eles — e só eles — que são peça de mostra. Tudo que
 * vier de fora disso (do banco, ou criado pela pessoa) é real.
 *
 * A lista vem do próprio `INITIAL_LISTINGS`, e não de um padrão
 * escrito à mão: se alguém acrescentar um anúncio de demonstração
 * novo, ele entra na lista sozinho, sem ninguém lembrar de marcar.
 */
const IDS_DEMONSTRACAO: ReadonlySet<string> = new Set(
  INITIAL_LISTINGS.map((l) => String(l.id ?? '')).filter(Boolean)
);

/** Este anúncio é de demonstração? */
export const ehDemonstracao = (item: ListingItem): boolean =>
  IDS_DEMONSTRACAO.has(String(item.id ?? ''));

/**
 * Junta a lista local com a do banco.
 *
 * O banco manda no conflito de id. O motivo: o id do banco é o id de
 * verdade — é o que a view pública devolve, e é o que o RLS reconhece
 * como pertencendo a alguém. A cópia local do mesmo anúncio, com id
 * diferente, é a mesma oferta duas vezes no feed.
 *
 * A ordem é a do banco primeiro (o mais recente, pela ordenação estável
 * da consulta), e o local depois. Assim o anúncio recém-salvo aparece no
 * topo sem esperar a próxima carga.
 *
 * E cada item sai daqui MARCADO: `demonstracao` ou `real`. A peça de
 * vitrine e o anúncio de gente precisam ser distinguíveis na tela —
 * senão o feed mostra os dois do mesmo jeito, e o contador não
— a diferença entre "12 anúncios" e "12 anúncios, 10 de mentira".
 */
export const juntarAnuncios = (
  locais: ListingItem[],
  doBackend: ListingItem[]
): ListingItem[] => {
  const vistos = new Set<string>();
  const juntos: ListingItem[] = [];

  // O banco primeiro, e o local depois — mas o filtro de id passa pelos
  // DOIS, sempre. Um atalho que devolvesse a lista local sem filtrar
  // deixaria passar um anúncio sem id: ele não tem link, não tem edição
  // e não tem exclusão, e apareceria no feed como um card que não
  // abre nada.
  for (const item of doBackend) {
    if (!item || !item.id || vistos.has(item.id)) continue;
    vistos.add(item.id);
    juntos.push({ ...item, origem: 'real' });
  }
  for (const item of locais) {
    if (!item || !item.id || vistos.has(item.id)) continue;
    vistos.add(item.id);
    juntos.push({ ...item, origem: ehDemonstracao(item) ? 'demonstracao' : 'real' });
  }

  return juntos;
};

/* ═══════════════════════════════════════════════════════════════════════
   O HOOK
   ═══════════════════════════════════════════════════════════════════════ */

export interface ResultadoAnunciosBackend extends EstadoBackend {
  /** Salva um anúncio no banco. Devolve o anúncio como o banco o gravou. */
  salvar: (item: ListingItem) => Promise<ListingItem>;
  /** Edita um anúncio do dono. */
  editar: (id: string, item: ListingItem) => Promise<ListingItem>;
  /** Exclui um anúncio do dono. */
  excluir: (id: string) => Promise<void>;
  /** Recarrega a vitrine e os anúncios do dono. */
  recarregar: () => Promise<void>;
  /** Este anúncio é do dono? Só aí a edição e a exclusão são oferecidas. */
  ehMeu: (id: string) => boolean;
  /** Escreve para o vendedor. O telefone não sai do servidor. */
  contatar: (
    anuncio: ListingItem,
    texto: string
  ) => Promise<{ matchId: string; mensagemId: string }>;
  /** As mensagens que chegaram para os anúncios do dono. */
  mensagensRecebidas: () => Promise<Array<MensagemContato & { listingId: string }>>;
  /** As mensagens de uma conversa específica. */
  carregarMensagens: (matchId: string) => Promise<MensagemContato[]>;
  /** Dispensar o aviso de erro do backend. */
  setBackendErro: (mensagem: string | null) => void;
}

export const useAnunciosBackend = (
  sessao: Sessao | null
): ResultadoAnunciosBackend => {
  const [publicos, setPublicos] = useState<ListingItem[]>([]);
  const [meus, setMeus] = useState<ListingItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [configurado, setConfigurado] = useState(false);

  /**
   * Guarda a sessão em que a carga foi feita.
   *
   * Sem isto, uma carga que termina DEPOIS do logout traria de volta os
   * anúncios do dono para quem já saiu. A carga antiga é descartada.
   */
  const sessaoRef = useRef<string | null>(null);
  sessaoRef.current = sessao?.uid ?? null;

  const recarregar = useCallback(async () => {
    const cli = cliente();
    setConfigurado(cli !== null);
    if (!cli) {
      setPublicos([]);
      setMeus([]);
      return;
    }

    setCarregando(true);
    const uidNoMomento = sessaoRef.current;

    try {
      const pagina = await listPublicListings(cli, { limit: 60 });
      // A carga é da sessão que a iniciou. Se a pessoa saiu no meio do
      // caminho, este resultado já é de outra pessoa.
      if (sessaoRef.current !== uidNoMomento) return;
      setPublicos(pagina.items);

      if (uidNoMomento) {
        const meusAnuncios = await listMyListings(cli, { limit: 100 });
        if (sessaoRef.current !== uidNoMomento) return;
        setMeus(meusAnuncios);
      } else {
        setMeus([]);
      }
    } catch (e) {
      if (sessaoRef.current !== uidNoMomento) return;
      // Falha aqui é FALHA DE LEITURA: o que já estava na tela fica.
      setErro(e instanceof Error ? e.message : 'não foi possível ler os anúncios');
    } finally {
      if (sessaoRef.current === uidNoMomento) setCarregando(false);
    }
  }, []);

  // Carga inicial e a cada troca de sessão. O `uid` na dependência, e não
  // o objeto da sessão: trocar de conta tem que recarregar, mas um
  // `setSessao` com o mesmo objeto não.
  useEffect(() => {
    let vivo = true;
    const carregar = async () => {
      if (!vivo) return;
      await recarregar();
    };
    void carregar();
    return () => {
      vivo = false;
    };
  }, [sessao?.uid, recarregar]);

  const idsMeus = useMemo(() => {
    const ids = new Set<string>();
    for (const item of meus) {
      if (item && typeof item.id === 'string' && item.id) ids.add(item.id);
    }
    return ids;
  }, [meus]);

  const ehMeu = useCallback((id: string) => idsMeus.has(id), [idsMeus]);

  const salvar = useCallback(async (item: ListingItem): Promise<ListingItem> => {
    const cli = cliente();
    if (!cli) throw new Error('sem backend configurado');
    if (!sessao) throw new Error('é preciso estar logado para salvar no banco');

    setErro(null);
    try {
      // ─────────────────────────────────────────────────────────────
      // AS FOTOS ANTES DO ANÚNCIO
      //
      // O `images` que chega aqui pode ser Base64 (o wizard entrega
      // data URL). Base64 NO BANCO é proibido: pesa, vaza em backup e
      // trafega em toda leitura da vitrine.
      //
      // Então: sobe as fotos, guarda as URLs, e o que não sobe é
      // DESCARTADO. O anúncio vai para o banco com as URLs — ou sem
      // foto nenhuma, se o upload falhar. De qualquer jeito, sem
      // Base64.
      //
      // O caminho da pasta é `anuncios/<uid>/<id>`, e o id do anúncio
      // ainda não existe (o banco é quem gera). Então a pasta é a do
      // dono com um carimbo de tempo — a URL final não precisa casar
      // com o id do anúncio, e o anúncio não precisa saber o id antes
      // de ser salvo.
      // ─────────────────────────────────────────────────────────────
      const fotos = await enviarFotos(
        cli,
        item.images,
        `${sessao.uid}/${Date.now()}`
      );

      if (fotos.perdidas > 0) {
        setErro(
          fotos.motivo
            ? `as fotos não puderam ser enviadas (${fotos.motivo}); o anúncio foi salvo sem elas`
            : 'as fotos não puderam ser enviadas; o anúncio foi salvo sem elas'
        );
      }

      const paraGravar: ListingItem = { ...item, images: fotos.urls };

      const { item: salvo } = await createListing(cli, paraGravar, sessao.uid);
      setMeus((prev) => [salvo, ...prev.filter((x) => x.id !== salvo.id)]);
      setPublicos((prev) => [salvo, ...prev.filter((x) => x.id !== salvo.id)]);
      return salvo;
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'falha ao salvar';
      setErro(mensagem);
      throw e;
    }
  }, [sessao]);

  const editar = useCallback(async (id: string, item: ListingItem): Promise<ListingItem> => {
    const cli = cliente();
    if (!cli) throw new Error('sem backend configurado');
    if (!sessao) throw new Error('é preciso estar logado para editar');

    setErro(null);
    try {
      const { item: editado } = await updateListing(cli, id, item, sessao.uid);
      setMeus((prev) => prev.map((x) => (x.id === id ? editado : x)));
      setPublicos((prev) => prev.map((x) => (x.id === id ? editado : x)));
      return editado;
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'falha ao editar';
      setErro(mensagem);
      throw e;
    }
  }, [sessao]);

  const excluir = useCallback(async (id: string): Promise<void> => {
    const cli = cliente();
    if (!cli) throw new Error('sem backend configurado');
    if (!sessao) throw new Error('é preciso estar logado para excluir');

    setErro(null);
    try {
      await deleteListing(cli, id, sessao.uid);
      setMeus((prev) => prev.filter((x) => x.id !== id));
      setPublicos((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'falha ao excluir';
      setErro(mensagem);
      throw e;
    }
  }, [sessao]);

  /* ══════════════════════════════════════════════════════════════════
     CONTATO

     O comprador escreve para o vendedor, e a mensagem vai para o
     BANCO. O telefone do vendedor não sai do servidor — e o do
     comprador também não: o vendedor vê o NOME, que vem de
     `profiles.full_name`.

     Sem sessão, a função recusa. E a recusa é explícita: nada de
     "mensagem enviada" sobre uma entrega que não aconteceu.
     ══════════════════════════════════════════════════════════════════ */

  const contatar = useCallback(
    async (
      anuncio: ListingItem,
      texto: string
    ): Promise<{ matchId: string; mensagemId: string }> => {
      const cli = cliente();
      if (!cli) throw new Error('sem backend configurado');
      if (!sessao) {
        throw new Error('é preciso estar logado para contatar o vendedor');
      }

      setErro(null);
      try {
        const { matchId, mensagem } = await contatarVendedor(cli, {
          listingId: anuncio.id,
          buyerId: sessao.uid,
          texto,
          tituloAnuncio: anuncio.title,
          cidade: anuncio.locationCity,
          estado: anuncio.locationState,
        });
        return { matchId, mensagemId: mensagem.id };
      } catch (e) {
        const mensagem = e instanceof Error ? e.message : 'falha ao contatar';
        setErro(mensagem);
        throw e;
      }
    },
    [sessao]
  );

  /**
   * As mensagens que chegaram para os anúncios do dono.
   *
   * É o outro lado do contato: o comprador escreveu, o vendedor lê.
   */
  const setBackendErro = useCallback((mensagem: string | null) => {
    setErro(mensagem);
  }, []);

  const mensagensRecebidas = useCallback(async (): Promise<
    Array<MensagemContato & { listingId: string }>
  > => {
    const cli = cliente();
    if (!cli || !sessao) return [];
    return listarMensagensDoDono(cli, sessao.uid);
  }, [sessao]);

  const carregarMensagens = useCallback(
    async (matchId: string): Promise<MensagemContato[]> => {
      const cli = cliente();
      if (!cli) return [];
      const { listarMensagens } = await import('./contato.ts');
      return listarMensagens(cli, matchId);
    },
    []
  );

  return {
    publicos,
    meus,
    idsMeus,
    configurado,
    carregando,
    erro,
    salvar,
    editar,
    excluir,
    recarregar,
    ehMeu,
    contatar,
    mensagensRecebidas,
    carregarMensagens,
    setBackendErro,
  };
};
