# ⚖️ Fuga do Tribunal — como rodar

Jessica × Mike fugindo por TRÊS sessões conectadas por portas (frente e trás
de cada parede divisória), através de **5 níveis**:

1. **O Tribunal** — policiais de azul invadindo pelos dois lados
2. **O Arquivo** — labirinto de estantes, mais policiais
3. **O Escritório** — sem policiais: **Harvey + Donna** caçam o Mike, **Litt + Rachel** caçam a Jessica. Cada um tem nome flutuando sobre a cabeça e um SUPERPODER:
   - **Harvey** ⚡ investida: quando te vê perto, dispara em 2× de velocidade ("HARVEY FECHANDO O CASO")
   - **Donna** 🔮 teleporte: antecipa seu movimento e de tempos em tempos JÁ ESTÁ no seu caminho ("DONNA JÁ SABIA…")
   - **Litt** 🧱 construção: ergue pilhas de processos no seu caminho de fuga que bloqueiam de verdade ("VOCÊ FOI LITT UP!") — derretem em 6s
   - **Rachel** 👻 invisibilidade: some da tela E do minimapa em ciclos ("RACHEL SUMIU…")

   Caçador só pega o próprio alvo — dá pra passar reto pelos do rival.
4. **A Biblioteca** — mesas longas e estantes de códigos, 9+ policiais
5. **O Julgamento Final** — salão aberto, quase sem esconderijo, 13+ policiais
6. **A Selva** — fugiram do tribunal! Clareiras com árvores, moitas e pedras, caçados por **onças, macacos e javalis**

**3 vidas por nível** (bolinhas no cartão de cada jogador). Preso = perde vida
e dá ponto pro rival; cada prisão traz +1 policial. Quando alguém fica sem
vidas, TODO MUNDO avança pro próximo nível (vidas renovadas). No fim do nível
5, vence quem tiver mais pontos.

## 1. Subir o servidor local

```bash
cd futebol
node server.js
```

O jogo fica em `http://localhost:8080`.

## 2. Expor com o Cloudflare Tunnel

Em outro terminal:

```bash
cloudflared tunnel --url http://localhost:8080
```

O cloudflared imprime uma URL do tipo `https://alguma-coisa.trycloudflare.com`.

## 3. Jogar (2 pessoas, 2 celulares)

1. Abra a **URL do túnel** no navegador do computador (não o localhost — assim o QR Code já aponta pro endereço público).
2. **Os dois celulares escaneiam o MESMO QR Code**: o primeiro que conectar vira a **Jessica** (azul), o segundo vira o **Mike** (vermelho). O celular mostra quem você é.
3. Gire os celulares pra paisagem e toque em "Abrir a sessão" no computador.

**Superpoderes dos fugitivos** (10s de efeito, 25s de recarga — botão dourado no celular, Q/P no teclado):
- **Jessica ✈ Voar**: levanta voo por cima de móveis, paredes e barricadas; ninguém alcança ela no ar (mas os guardas acampam o pouso!)
- **Mike 👻 Sumir**: invisível pra todos os guardas — que ficam patrulhando perdidos — e some do minimapa do rival. Exceção: a **Donna** continua vendo (e prendendo) ele, porque ela é a Donna.

No celular: joystick dinâmico (nasce onde o dedo toca) — empurrar **até o fim do curso liga o sprint** sozinho —, botão **Esquiva** com anel de recarga e um **minimapa ao vivo** no topo da tela (você destacado na sua cor, rival, guardas, barricadas — e a Rachel invisível some dele também).

O teclado também funciona como reserva pra qualquer um dos dois:

| Jogador | Mover | Sprint | Esquiva |
|---|---|---|---|
| Jessica | WASD | Espaço (segurar) | E |
| Mike | Setas | Shift (segurar) | Enter |

## Dicas

- Sprint gasta stamina (a barra no canto); andar recupera. A esquiva custa 20 de stamina.
- Use os móveis pra despistar e as PORTAS entre as sessões pra fugir de sala em sala — os guardas precisam contornar até a porta.
- Os oficiais perseguem o fugitivo mais próximo: usem isso pra "passar o bastão" um pro outro.

## Notas

- A conexão celular ↔ jogo usa WebRTC (PeerJS). No mesmo Wi-Fi os inputs vão direto P2P — o túnel só serve a página.
- Se a tela do celular apagar, a página pede o Wake Lock de novo ao voltar.
- A partida dura 5 minutos (ajustável em `DURACAO` no `js/game.js`).
