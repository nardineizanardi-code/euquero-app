/**
 * Resolve os imports que o Vite aceita e o Node ESM nao:
 *   '../types'  ->  '../types/index.ts'
 *
 * Existe SO para rodar os testes no Node. Nao faz parte do app e nada aqui
 * entra no bundle — o Vite nem olha esta pasta.
 */

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    const code = err && err.code;
    if (code === 'ERR_UNSUPPORTED_DIR_IMPORT' || code === 'ERR_MODULE_NOT_FOUND') {
      for (const suffix of ['/index.ts', '/index.tsx', '.ts', '.tsx']) {
        try {
          return await next(specifier + suffix, context);
        } catch { /* tenta a proxima */ }
      }
    }
    throw err;
  }
}

/**
 * Emula o `import.meta.env` que o Vite injeta no build.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE ISTO EXISTE
 *
 * `import.meta` é um objeto POR MÓDULO. Cada arquivo tem o seu. Não há
 * `globalThis.importMeta`, e não dá para o teste escrever no `env` do
 * módulo do app: o `import.meta` do arquivo de teste e o do arquivo testado
 * são dois objetos diferentes, e mexer em um não toca no outro.
 *
 * A saída é reescrever `import.meta.env` para `globalThis.__EQ_ENV__` na
 * hora de carregar o fonte. É exatamente o que o Vite faz no build — ele
 * substitui `import.meta.env.VITE_X` por uma constante literal — então o
 * código que os testes exercitam é o mesmo de produção, com a diferença
 * de que a fonte do ambiente vem de uma global.
 *
 * Efeito colateral útil: se `globalThis.__EQ_ENV__` não existir, o código
 * cai no `undefined` e o `typeof` guard do app trata como "sem
 * configuração" — que é o estado de um teste novo, e o comportamento
 * correto.
 */
export async function load(url, context, next) {
  const resultado = await next(url, context);

  // Só mexe em fonte do nosso projeto, e só em texto.
  if (!url.includes('/src/')) return resultado;

  // O Node entrega o fonte de .ts em dois formatos dependendo da versão:
  // como string, ou como Uint8Array (é o caso de 'module-typescript',
  // onde a tipagem é removida em memoria). Os dois precisam ser tratados,
  // e o `format` nao serve de filtro — ele muda entre versoes.
  const bruto = resultado.source;
  const texto =
    typeof bruto === 'string'
      ? bruto
      : bruto instanceof Uint8Array
        ? new TextDecoder().decode(bruto)
        : null;
  if (texto === null) return resultado;

  if (!texto.includes('import.meta.env')) return resultado;

  return {
    ...resultado,
    source: texto.replace(/import\.meta\.env/g, 'globalThis.__EQ_ENV__'),
  };
}
