/**
 * Fotos do anúncio — armazenamento de arquivo, URL durável.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O PROBLEMA QUE ESTE ARQUIVO RESOLVE
 * ═══════════════════════════════════════════════════════════════════════
 * O wizard comprime a foto do usuário para WebP 800px e entrega um DATA
 * URL: `data:image/webp;base64,AAAA...`. Isso é ótimo para mostrar
 * numa `<img>` e péssimo para guardar num banco:
 *
 *   - uma foto de 800px em WebP Base64 dá ~100-200 KB de TEXTO;
 *   - quatro fotos dão meio megabyte numa coluna `text[]`;
 *   - o `data:` é transported como texto em toda leitura da vitrine —
 *     cada visitor que abre o feed baixa as fotos em Base64, decodifica,
 *     e joga fora;
 *   - e o dado é do usuário dentro de um anúncio: qualquer backup do
 *     banco vira um backup de fotos de gente.
 *
 * A saída é o bucket do Supabase Storage: a foto vai como ARQUIVO, e no
 * anúncio fica só a URL.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * A REGRA QUE NÃO SE NEGOCIA
 * ═══════════════════════════════════════════════════════════════════════
 * DATA URL NUNCA VAI PARA O BANCO.
 *
 * Não há "deixa passar se não couber". O que não sobe não é gravado: o
 * anúncio é salvo sem aquela foto, e a pessoa é avisada. Um anúncio
 * sem foto é um anúncio sem foto; um anúncio com um megabyte de Base64
 * no banco é um problema para todo mundo menos para quem olha a tela.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O BUCKET
 * ═══════════════════════════════════════════════════════════════════════
 * O bucket `anuncios` AINDA NÃO EXISTE no projeto. Verifiquei: a
 * listagem de buckets do Storage volta vazia. Criar bucket é DDL, e
 * DDL não é executado aqui — a migração está em
 * `supabase/migrations/20261018_storage_anuncios.sql`, para revisão.
 *
 * Até a migração ser aplicada, o upload falha, as fotos são DESCARTADAS
 * e o anúncio é salvo sem elas. O app continua funcionando.
 */

/** O bucket onde as fotos moram. Precisa existir no projeto. */
export const BUCKET_ANUNCIOS = 'anuncios';

/** O pedaço do cliente que o Storage usa. O resto não interessa. */
export interface StorageLike {
  from(bucket: string): {
    upload(
      path: string,
      body: unknown,
      opts?: { upsert?: boolean; contentType?: string; cacheControl?: string }
    ): PromiseLike<{ data: { path: string } | null; error: { message: string } | null }>;
    getPublicUrl(path: string): { data: { publicUrl: string } };
  };
}

export interface ClienteComStorage {
  storage?: StorageLike;
}

/** Esta string é um Base64 embutido, e não uma URL de arquivo. */
export const ehDataUrl = (valor: string): boolean =>
  typeof valor === 'string' && valor.startsWith('data:');

/** A lista tem alguma foto em Base64? */
export const temBase64 = (fotos?: string[]): boolean =>
  Array.isArray(fotos) && fotos.some(ehDataUrl);

/**
 * Converte um data URL no binário que o Storage entende.
 *
 * `atob` existe no navegador e no Node 16+. O prefixo é
 * `data:<mime>;base64,` — o resto é Base64 puro.
 */
export const dataUrlParaBinario = (
  dataUrl: string
): { bytes: Uint8Array; mime: string } | null => {
  if (!ehDataUrl(dataUrl)) return null;

  const virgula = dataUrl.indexOf(',');
  if (virgula < 0) return null;

  const cabecalho = dataUrl.slice(5, virgula); // sem o "data:"
  const mime = cabecalho.split(';')[0] || 'application/octet-stream';
  const base64 = dataUrl.slice(virgula + 1);

  try {
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return { bytes, mime };
  } catch {
    return null;
  }
};

/** O que o upload devolve. */
export interface ResultadoFotos {
  /** As URLs que podem ser gravadas no anúncio. */
  urls: string[];
  /** Quantas fotos não puderam ser enviadas. */
  perdidas: number;
  /** Por que falharam, para a tela poder avisar. */
  motivo: string | null;
}

/**
 * Sobe as fotos e devolve as URLs.
 *
 * Regras:
 *   - foto que JÁ é URL passa direto, sem subir de novo;
 *   - foto em Base64 sobe para o bucket e vira URL;
 *   - foto que não sobe é DESCARTADA. Ela não volta como Base64.
 *
 * O caminho no bucket é por anúncio e por pessoa: `anuncios/<uid>/<id>/<n>.webp`.
 * O prefixo da pessoa é o que permite a política do Storage dizer "cada
 * um escreve só na própria pasta" — sem isso, qualquer usuário
 * autenticado escreveria na pasta de outro.
 */
export const enviarFotos = async (
  cliente: ClienteComStorage | null,
  fotos: string[] | undefined,
  caminhoBase: string
): Promise<ResultadoFotos> => {
  const urls: string[] = [];
  let perdidas = 0;
  let motivo: string | null = null;

  if (!fotos || fotos.length === 0) {
    return { urls, perdidas, motivo };
  }

  for (let i = 0; i < fotos.length; i++) {
    const foto = fotos[i];
    if (typeof foto !== 'string' || !foto) {
      perdidas++;
      continue;
    }

    // Já é URL: entra como está.
    if (!ehDataUrl(foto)) {
      urls.push(foto);
      continue;
    }

    // Base64: precisa subir.
    const binario = dataUrlParaBinario(foto);
    if (!binario) {
      perdidas++;
      motivo = motivo ?? 'uma das fotos estava corrompida';
      continue;
    }

    const storage = cliente?.storage;
    if (!storage) {
      perdidas++;
      motivo = motivo ?? 'o servidor de arquivos não está configurado';
      continue;
    }

    const extensao = binario.mime.includes('png') ? 'png' : 'webp';
    const caminho = `${caminhoBase}/${i}.${extensao}`;

    try {
      const { error } = await storage
        .from(BUCKET_ANUNCIOS)
        .upload(caminho, binario.bytes, {
          upsert: true,
          contentType: binario.mime,
          cacheControl: '31536000',
        });

      if (error) {
        perdidas++;
        motivo = motivo ?? error.message;
        continue;
      }

      const publica = storage.from(BUCKET_ANUNCIOS).getPublicUrl(caminho);
      const url = publica?.data?.publicUrl;
      if (!url) {
        perdidas++;
        motivo = motivo ?? 'o servidor devolveu a foto sem URL';
        continue;
      }
      urls.push(url);
    } catch (e) {
      perdidas++;
      motivo = motivo ?? (e instanceof Error ? e.message : 'falha no envio da foto');
    }
  }

  return { urls, perdidas, motivo };
};
