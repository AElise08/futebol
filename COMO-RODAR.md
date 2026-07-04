# ⚽ Futebol 3D — como rodar

## 1. Subir o servidor local

```bash
cd futebol
node server.js
```

O jogo fica em `http://localhost:8080`.

## 2. Expor com o Cloudflare Tunnel

Em outro terminal:

```bash
# se ainda não tiver o cloudflared:
brew install cloudflared

cloudflared tunnel --url http://localhost:8080
```

O cloudflared imprime uma URL do tipo `https://alguma-coisa.trycloudflare.com`.

## 3. Jogar

1. Abra a **URL do túnel** no navegador do computador (não o localhost — assim o QR Code já aponta pro endereço público).
2. Escaneie o QR Code com a câmera do celular.
3. O celular vira o controle (gire pra paisagem). Toque em "Começar partida" no computador.

O teclado também funciona a qualquer momento:

| Tecla | Ação |
|---|---|
| WASD / setas | mover |
| Espaço | sprint (segurar) |
| Z | passe |
| X ~ | — |
| C | chute |
| V | desarme |
| Shift | trocar jogadora |

## Notas

- A conexão celular ↔ jogo usa WebRTC (PeerJS). Se os dois estiverem no mesmo Wi-Fi, o tráfego dos inputs vai direto P2P com latência mínima — o túnel só serve a página.
- Se a tela do celular apagar, a página pede o Wake Lock de novo ao voltar.
- A partida dura 5 minutos (ajustável em `DURACAO` no `js/game.js`).
