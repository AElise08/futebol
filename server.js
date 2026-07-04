// Servidor estático sem dependências — node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTA = process.env.PORT || 8080;
const RAIZ = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

http.createServer((req, res) => {
  let alvo = decodeURIComponent(req.url.split('?')[0]);
  if (alvo === '/') alvo = '/index.html';
  const arquivo = path.join(RAIZ, path.normalize(alvo));
  if (!arquivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  fs.readFile(arquivo, (err, dados) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(arquivo)] || 'application/octet-stream' });
    res.end(dados);
  });
}).listen(PORTA, () => {
  console.log(`⚽ Futebol 3D rodando em http://localhost:${PORTA}`);
  console.log(`   Para expor com o Cloudflare Tunnel:`);
  console.log(`   cloudflared tunnel --url http://localhost:${PORTA}`);
});
