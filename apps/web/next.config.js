/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@jconv/compartilhado'],
  // Web (Vercel) e API (Railway) ficam em domínios diferentes — um cookie definido pela API
  // nunca chegaria de volta pro servidor do Next (middleware, Server Components) porque o
  // navegador só anexa cookies em requisições pro domínio que os definiu. Este rewrite faz o
  // navegador conversar só com o próprio domínio do site; o Next repassa a requisição (e os
  // cabeçalhos Set-Cookie da resposta) pra API por trás dos panos, unificando o cookie sob o
  // domínio do site.
  async rewrites() {
    const urlApi = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    return [{ source: '/api/:caminho*', destination: `${urlApi}/:caminho*` }];
  },
};

module.exports = nextConfig;
