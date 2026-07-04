// ============================================================
// FUTEBOL 3D — jogo completo no navegador
// three.js (render) + cannon-es (física) + PeerJS (celular como controle)
// ============================================================
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// ------------------------------------------------------------
// Constantes do jogo
// ------------------------------------------------------------
const CAMPO = { comp: 60, larg: 40 };          // x: -30..30 | z: -20..20
const GOL = { larg: 6, alt: 2.2 };             // boca do gol
const DURACAO = 300;                           // segundos de partida
// --- controle de jogadora ---
const TROCA_AUTOMATICA = false;  // false = o jogo NÃO troca de jogadora sozinho (você fica na Mel)
const TROCA_MANUAL = true;       // true = botão Trocar / Shift ainda funciona se você quiser trocar de propósito
//   → jogo de UMA jogadora só: deixe os dois como false
//   → comportamento original (troca automática): deixe os dois como true
const CORES = {
  azul: 0x2f7de1, azulEscuro: 0x1c4f96,
  verm: 0xd8452e, vermEscuro: 0x8f2b1c,
  gkAzul: 0xf2c531, gkVerm: 0x8e5bd6,
  pele: [0xf1c7a8, 0xc98d5f, 0x8a5a37, 0x5f3c22],
};
const NOMES = {
  azul: ['Lua', 'Bia', 'Duda', 'Rafa', 'Mel'],
  verm: ['Íris', 'Vera', 'Kim', 'Ana', 'Zoe'],
};

// ------------------------------------------------------------
// Cena, câmera, renderer
// ------------------------------------------------------------
const cena = new THREE.Scene();
cena.background = new THREE.Color(0x0a1410);
cena.fog = new THREE.Fog(0x0a1410, 70, 140);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 300);
camera.position.set(0, 22, 34);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('cena').appendChild(renderer.domElement);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Iluminação: noite de jogo, refletores
cena.add(new THREE.HemisphereLight(0xbfd9ff, 0x1a2b1f, 0.55));
const refletor = new THREE.DirectionalLight(0xfff4e0, 1.6);
refletor.position.set(25, 45, 20);
refletor.castShadow = true;
refletor.shadow.mapSize.set(2048, 2048);
refletor.shadow.camera.left = -38; refletor.shadow.camera.right = 38;
refletor.shadow.camera.top = 30; refletor.shadow.camera.bottom = -30;
refletor.shadow.camera.far = 110;
cena.add(refletor);
const contra = new THREE.DirectionalLight(0xcfe0ff, 0.4);
contra.position.set(-30, 30, -25);
cena.add(contra);

// ------------------------------------------------------------
// Campo (textura desenhada em canvas: faixas de grama + linhas)
// ------------------------------------------------------------
function criaTexturaCampo() {
  const cv = document.createElement('canvas');
  cv.width = 1536; cv.height = 1024;
  const g = cv.getContext('2d');
  const px = cv.width / (CAMPO.comp + 8);        // escala com margem
  const py = cv.height / (CAMPO.larg + 8);
  const X = x => (x + CAMPO.comp / 2 + 4) * px;
  const Z = z => (z + CAMPO.larg / 2 + 4) * py;

  // faixas de grama
  for (let i = 0; i < 16; i++) {
    g.fillStyle = i % 2 ? '#1f7a3d' : '#1b6b36';
    g.fillRect((cv.width / 16) * i, 0, cv.width / 16 + 1, cv.height);
  }
  // linhas
  g.strokeStyle = 'rgba(255,255,255,0.92)';
  g.lineWidth = 4;
  g.strokeRect(X(-30), Z(-20), X(30) - X(-30), Z(20) - Z(-20)); // limites
  g.beginPath(); g.moveTo(X(0), Z(-20)); g.lineTo(X(0), Z(20)); g.stroke(); // meio
  g.beginPath(); g.arc(X(0), Z(0), 7 * px, 0, Math.PI * 2); g.stroke(); // círculo central
  for (const lado of [-1, 1]) { // áreas
    g.strokeRect(X(lado * 30), Z(-8), (X(lado * 30 - lado * 7) - X(lado * 30)), Z(8) - Z(-8));
    g.strokeRect(X(lado * 30), Z(-4), (X(lado * 30 - lado * 3) - X(lado * 30)), Z(4) - Z(-4));
    g.beginPath(); g.arc(X(lado * 25), Z(0), 0.4 * px, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); // marca do pênalti
  }
  g.beginPath(); g.arc(X(0), Z(0), 0.4 * px, 0, Math.PI * 2); g.fill(); // centro
  const tx = new THREE.CanvasTexture(cv);
  tx.anisotropy = 8;
  return tx;
}

const gramado = new THREE.Mesh(
  new THREE.PlaneGeometry(CAMPO.comp + 8, CAMPO.larg + 8),
  new THREE.MeshLambertMaterial({ map: criaTexturaCampo() })
);
gramado.rotation.x = -Math.PI / 2;
gramado.receiveShadow = true;
cena.add(gramado);

// ------------------------------------------------------------
// Gols (traves + rede)
// ------------------------------------------------------------
function criaGol(lado) {
  const grupo = new THREE.Group();
  const matTrave = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const r = 0.07;
  for (const z of [-GOL.larg / 2, GOL.larg / 2]) {
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(r, r, GOL.alt, 10), matTrave);
    poste.position.set(0, GOL.alt / 2, z);
    poste.castShadow = true;
    grupo.add(poste);
  }
  const trav = new THREE.Mesh(new THREE.CylinderGeometry(r, r, GOL.larg, 10), matTrave);
  trav.rotation.x = Math.PI / 2;
  trav.position.set(0, GOL.alt, 0);
  grupo.add(trav);
  // rede simples: planos em wireframe
  const matRede = new THREE.MeshBasicMaterial({ color: 0xdddddd, wireframe: true, transparent: true, opacity: 0.28 });
  const fundo = new THREE.Mesh(new THREE.PlaneGeometry(GOL.larg, GOL.alt, 10, 5), matRede);
  fundo.position.set(lado * 1.5, GOL.alt / 2, 0);
  fundo.rotation.y = Math.PI / 2;
  grupo.add(fundo);
  const topo = new THREE.Mesh(new THREE.PlaneGeometry(1.5, GOL.larg, 4, 10), matRede);
  topo.rotation.z = Math.PI / 2; topo.rotation.y = Math.PI / 2;
  topo.position.set(lado * 0.75, GOL.alt, 0);
  grupo.add(topo);
  grupo.position.x = lado * 30;
  return grupo;
}
cena.add(criaGol(1), criaGol(-1));

// ------------------------------------------------------------
// Arquibancada com torcida instanciada
// ------------------------------------------------------------
function criaTorcida() {
  const total = 2600;
  const geo = new THREE.BoxGeometry(0.55, 0.7, 0.45);
  const mat = new THREE.MeshLambertMaterial();
  const inst = new THREE.InstancedMesh(geo, mat, total);
  const m = new THREE.Matrix4();
  const cor = new THREE.Color();
  let i = 0;
  const setores = [
    { eixo: 'z', pos: -24, ini: -28, fim: 28, time: 'azul' },
    { eixo: 'z', pos: 24, ini: -28, fim: 28, time: 'verm' },
    { eixo: 'x', pos: -34, ini: -18, fim: 18, time: 'azul' },
    { eixo: 'x', pos: 34, ini: -18, fim: 18, time: 'verm' },
  ];
  for (const s of setores) {
    const fileiras = 6;
    for (let f = 0; f < fileiras; f++) {
      const passo = 1.1;
      for (let c = s.ini; c <= s.fim; c += passo) {
        if (i >= total) break;
        const recuo = f * 1.2;
        const y = 1.2 + f * 0.9 + (Math.random() * 0.25);
        const jx = (Math.random() - 0.5) * 0.3, jz = (Math.random() - 0.5) * 0.3;
        if (s.eixo === 'z') m.setPosition(c + jx, y, s.pos + Math.sign(s.pos) * recuo + jz);
        else m.setPosition(s.pos + Math.sign(s.pos) * recuo + jx, y, c + jz);
        inst.setMatrixAt(i, m);
        const rnd = Math.random();
        if (rnd < 0.55) cor.setHex(s.time === 'azul' ? CORES.azul : CORES.verm);
        else if (rnd < 0.8) cor.setHex(0xe8e8e8);
        else cor.setHSL(Math.random(), 0.5, 0.55);
        inst.setColorAt(i, cor);
        i++;
      }
    }
  }
  inst.count = i;
  cena.add(inst);
  // estrutura das arquibancadas
  const matArq = new THREE.MeshLambertMaterial({ color: 0x18231c });
  for (const s of setores) {
    const compr = (s.fim - s.ini) + 4;
    const bloco = new THREE.Mesh(new THREE.BoxGeometry(s.eixo === 'z' ? compr : 8.5, 6, s.eixo === 'z' ? 8.5 : compr), matArq);
    if (s.eixo === 'z') bloco.position.set(0, 2.6, s.pos + Math.sign(s.pos) * 3.2);
    else bloco.position.set(s.pos + Math.sign(s.pos) * 3.2, 2.6, 0);
    cena.add(bloco);
  }
}
criaTorcida();

// ------------------------------------------------------------
// Física (cannon-es)
// ------------------------------------------------------------
const mundo = new CANNON.World({ gravity: new CANNON.Vec3(0, -19, 0) });
mundo.broadphase = new CANNON.SAPBroadphase(mundo);

const matChao = new CANNON.Material('chao');
const matBola = new CANNON.Material('bola');
mundo.addContactMaterial(new CANNON.ContactMaterial(matChao, matBola, {
  friction: 0.4, restitution: 0.55,
}));

const chaoBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane(), material: matChao });
chaoBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
mundo.addBody(chaoBody);

// paredes invisíveis (estilo society/futsal: bola rebate, sem laterais)
function parede(hx, hy, hz, x, y, z) {
  const b = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(hx, hy, hz)) });
  b.position.set(x, y, z);
  mundo.addBody(b);
}
parede(31, 3, 0.3, 0, 3, -20.4);   // lateral de cima
parede(31, 3, 0.3, 0, 3, 20.4);    // lateral de baixo
for (const lado of [-1, 1]) {
  // fundos, deixando a boca do gol livre (|z| < 3)
  parede(0.3, 3, 8.6, lado * 30.4, 3, -(3 + 8.5));
  parede(0.3, 3, 8.6, lado * 30.4, 3, (3 + 8.5));
  parede(0.3, 1.5, 3, lado * 31.7, 1.5, 0);          // rede de fundo
  parede(0.75, 0.3, 3, lado * 30.75, GOL.alt + 0.28, 0); // rede de cima
  // traves físicas
  for (const z of [-GOL.larg / 2, GOL.larg / 2]) {
    parede(0.07, GOL.alt / 2, 0.07, lado * 30, GOL.alt / 2, z);
  }
  parede(0.07, 0.07, GOL.larg / 2, lado * 30, GOL.alt, 0); // travessão
}

// Bola
const bolaBody = new CANNON.Body({
  mass: 0.45,
  shape: new CANNON.Sphere(0.35),
  material: matBola,
  linearDamping: 0.32,
  angularDamping: 0.35,
});
bolaBody.position.set(0, 0.35, 0);
mundo.addBody(bolaBody);

function criaTexturaBola() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = '#f5f5f5'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#1a1a1a';
  for (let i = 0; i < 14; i++) {
    const x = (i % 5) * 60 + (Math.floor(i / 5) % 2) * 30, y = Math.floor(i / 5) * 70 + 20;
    g.beginPath();
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
      g[p ? 'lineTo' : 'moveTo'](x + Math.cos(a) * 16, y + Math.sin(a) * 16);
    }
    g.fill();
  }
  return new THREE.CanvasTexture(cv);
}
const bolaMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 24, 18),
  new THREE.MeshLambertMaterial({ map: criaTexturaBola() })
);
bolaMesh.castShadow = true;
cena.add(bolaMesh);

// ------------------------------------------------------------
// Jogadores (modelos procedurais com animação de corrida)
// ------------------------------------------------------------
function criaModeloJogador(corCamisa, corCalcao) {
  const g = new THREE.Group();
  const pele = CORES.pele[Math.floor(Math.random() * CORES.pele.length)];
  const matCamisa = new THREE.MeshLambertMaterial({ color: corCamisa });
  const matCalcao = new THREE.MeshLambertMaterial({ color: corCalcao });
  const matPele = new THREE.MeshLambertMaterial({ color: pele });

  const tronco = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 4, 10), matCamisa);
  tronco.position.y = 1.05; tronco.castShadow = true;
  g.add(tronco);

  const calcao = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.24, 10), matCalcao);
  calcao.position.y = 0.72;
  g.add(calcao);

  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), matPele);
  cabeca.position.y = 1.52; cabeca.castShadow = true;
  g.add(cabeca);
  const cabelo = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x2a1c10 }));
  cabelo.position.y = 1.545;
  g.add(cabelo);

  const membro = (mat, comp, raio) => {
    const pivo = new THREE.Group();
    const geo = new THREE.CylinderGeometry(raio, raio * 0.85, comp, 8);
    geo.translate(0, -comp / 2, 0);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    pivo.add(m);
    return pivo;
  };
  const pernaE = membro(matPele, 0.58, 0.085); pernaE.position.set(0, 0.62, -0.11);
  const pernaD = membro(matPele, 0.58, 0.085); pernaD.position.set(0, 0.62, 0.11);
  const bracoE = membro(matCamisa, 0.5, 0.07); bracoE.position.set(0, 1.32, -0.3);
  const bracoD = membro(matCamisa, 0.5, 0.07); bracoD.position.set(0, 1.32, 0.3);
  g.add(pernaE, pernaD, bracoE, bracoD);
  g.userData.membros = { pernaE, pernaD, bracoE, bracoD };
  return g;
}

class Jogador {
  constructor(time, nome, homeX, homeZ, ehGK = false) {
    this.time = time;                    // 'azul' | 'verm'
    this.nome = nome;
    this.ehGK = ehGK;
    this.home = new THREE.Vector3(homeX, 0, homeZ);
    this.pos = this.home.clone();
    this.vel = new THREE.Vector3();
    this.dir = new THREE.Vector3(time === 'azul' ? 1 : -1, 0, 0);
    this.fase = Math.random() * 10;
    this.lunge = 0;                      // tempo restante de carrinho
    this.velBase = 6 + Math.random() * 0.8;
    this.velSprint = this.velBase + 3;
    const camisa = ehGK
      ? (time === 'azul' ? CORES.gkAzul : CORES.gkVerm)
      : (time === 'azul' ? CORES.azul : CORES.verm);
    const calcao = time === 'azul' ? CORES.azulEscuro : CORES.vermEscuro;
    this.mesh = criaModeloJogador(camisa, calcao);
    cena.add(this.mesh);
  }

  mover(alvoVel, dt) {
    // aceleração suave até a velocidade alvo
    this.vel.lerp(alvoVel, Math.min(1, dt * 8));
    this.pos.addScaledVector(this.vel, dt);
    // limites do campo (com folga)
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -30.5, 30.5);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, -20.5, 20.5);
    if (this.vel.lengthSq() > 0.3) {
      this.dir.copy(this.vel).normalize();
    }
  }

  atualizarVisual(dt) {
    this.mesh.position.copy(this.pos);
    const anguloAlvo = Math.atan2(this.dir.x, this.dir.z);
    let d = anguloAlvo - this.mesh.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.mesh.rotation.y += d * Math.min(1, dt * 10);
    // corrida procedural
    const veloc = this.vel.length();
    this.fase += veloc * dt * 2.4;
    const amp = Math.min(veloc / 9, 1) * 0.75;
    const { pernaE, pernaD, bracoE, bracoD } = this.mesh.userData.membros;
    pernaE.rotation.x = Math.sin(this.fase) * amp;
    pernaD.rotation.x = -Math.sin(this.fase) * amp;
    bracoE.rotation.x = -Math.sin(this.fase) * amp * 0.8;
    bracoD.rotation.x = Math.sin(this.fase) * amp * 0.8;
    // carrinho: inclina o corpo
    this.mesh.rotation.x = this.lunge > 0 ? -0.6 : 0;
  }

  distBola() {
    const dx = this.pos.x - bolaBody.position.x;
    const dz = this.pos.z - bolaBody.position.z;
    return Math.hypot(dx, dz);
  }
}

// Escalações (azul ataca +X, vermelho ataca -X)
const times = { azul: [], verm: [] };
function montarTime(time, sinal) {
  const n = NOMES[time];
  times[time] = [
    new Jogador(time, n[0], sinal * -28, 0, true),   // goleira
    new Jogador(time, n[1], sinal * -17, -7),
    new Jogador(time, n[2], sinal * -17, 7),
    new Jogador(time, n[3], sinal * -7, 0),
    new Jogador(time, n[4], sinal * 2, 3 * sinal),
  ];
}
montarTime('azul', 1);
montarTime('verm', -1);
const todos = [...times.azul, ...times.verm];

// anel indicador do jogador controlado
const anel = new THREE.Mesh(
  new THREE.RingGeometry(0.55, 0.72, 28),
  new THREE.MeshBasicMaterial({ color: 0x52d273, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
);
anel.rotation.x = -Math.PI / 2;
anel.position.y = 0.03;
cena.add(anel);

let controlado = times.azul[4]; // começa com a atacante

// ------------------------------------------------------------
// Entrada: teclado + celular (PeerJS)
// ------------------------------------------------------------
const teclas = {};
addEventListener('keydown', e => {
  teclas[e.code] = true;
  if (['KeyZ', 'KeyC', 'KeyV', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
    filaBotoes.push({ KeyZ: 'passe', KeyC: 'chute', KeyV: 'desarme', ShiftLeft: 'trocar', ShiftRight: 'trocar' }[e.code]);
  }
});
addEventListener('keyup', e => { teclas[e.code] = false; });

const filaBotoes = [];
const celular = { ativo: false, x: 0, y: 0, sprint: false, conn: null };

const peer = new Peer();
peer.on('open', id => {
  const base = location.href.replace(/[^/]*(\?.*)?$/, '');
  const url = base + 'controle.html?peer=' + id;
  new QRCode(document.getElementById('qr-alvo'), { text: url, width: 196, height: 196, correctLevel: QRCode.CorrectLevel.M });
  document.getElementById('qr-status').textContent = 'Aponte a câmera do celular';
});
peer.on('connection', conn => {
  celular.conn = conn;
  conn.on('data', d => {
    if (d.t === 'st') { celular.x = d.x; celular.y = d.y; celular.sprint = d.sp; celular.ativo = true; }
    else if (d.t === 'b') filaBotoes.push(d.b);
  });
  conn.on('open', () => {
    document.getElementById('conexao').classList.add('on');
    document.getElementById('conexao-txt').textContent = 'Celular conectado';
    document.getElementById('qr-status').textContent = 'Conectado ✓';
    document.getElementById('qr-status').classList.add('on');
  });
  conn.on('close', () => {
    celular.ativo = false; celular.conn = null;
    document.getElementById('conexao').classList.remove('on');
    document.getElementById('conexao-txt').textContent = 'Sem controle';
  });
});
function vibraCelular(padrao) {
  if (celular.conn?.open) celular.conn.send({ t: 'v', p: padrao });
}

function lerEntrada() {
  let x = 0, z = 0, sprint = false;
  if (teclas.KeyW || teclas.ArrowUp) z -= 1;
  if (teclas.KeyS || teclas.ArrowDown) z += 1;
  if (teclas.KeyA || teclas.ArrowLeft) x -= 1;
  if (teclas.KeyD || teclas.ArrowRight) x += 1;
  sprint = !!teclas.Space;
  // celular tem prioridade quando o analógico está ativo
  if (Math.hypot(celular.x, celular.y) > 0.12) {
    x = celular.x; z = celular.y;
  }
  if (celular.sprint) sprint = true;
  const mag = Math.hypot(x, z);
  if (mag > 1) { x /= mag; z /= mag; }
  return { x, z, sprint };
}

// ------------------------------------------------------------
// Áudio sintetizado (chute, apito, gol, torcida)
// ------------------------------------------------------------
let actx = null, torcidaGain = null;
function iniciarAudio() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  // ruído contínuo da torcida
  const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
  const data = buf.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < data.length; i++) {
    ultimo = (ultimo + (Math.random() * 2 - 1) * 0.04) * 0.985;
    data[i] = ultimo * 3;
  }
  const fonte = actx.createBufferSource();
  fonte.buffer = buf; fonte.loop = true;
  const filtro = actx.createBiquadFilter();
  filtro.type = 'bandpass'; filtro.frequency.value = 500; filtro.Q.value = 0.5;
  torcidaGain = actx.createGain();
  torcidaGain.gain.value = 0.05;
  fonte.connect(filtro).connect(torcidaGain).connect(actx.destination);
  fonte.start();
}
function somChute(forca = 1) {
  if (!actx) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(140 + forca * 60, actx.currentTime);
  o.frequency.exponentialRampToValueAtTime(50, actx.currentTime + 0.09);
  g.gain.setValueAtTime(0.35 * forca, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.12);
  o.connect(g).connect(actx.destination);
  o.start(); o.stop(actx.currentTime + 0.13);
}
function somApito(longo = false) {
  if (!actx) return;
  const dur = longo ? 0.7 : 0.3;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'square'; o.frequency.value = 2350;
  const trem = actx.createOscillator(), tg = actx.createGain();
  trem.frequency.value = 28; tg.gain.value = 900;
  trem.connect(tg).connect(o.frequency);
  g.gain.setValueAtTime(0.08, actx.currentTime);
  g.gain.setValueAtTime(0.001, actx.currentTime + dur);
  o.connect(g).connect(actx.destination);
  o.start(); trem.start();
  o.stop(actx.currentTime + dur); trem.stop(actx.currentTime + dur);
}
function somGol() {
  if (!actx) return;
  torcidaGain.gain.cancelScheduledValues(actx.currentTime);
  torcidaGain.gain.setValueAtTime(0.35, actx.currentTime);
  torcidaGain.gain.exponentialRampToValueAtTime(0.05, actx.currentTime + 4);
}

// ------------------------------------------------------------
// Estado da partida
// ------------------------------------------------------------
const jogo = {
  rolando: false,
  tempo: DURACAO,
  gols: { azul: 0, verm: 0 },
  pausaGol: 0,
  trocaCooldown: 0,
  stamina: 100,
  dono: null,          // jogador mais perto controlando a bola
};

function reposicionar() {
  for (const time of ['azul', 'verm']) {
    for (const j of times[time]) {
      j.pos.copy(j.home);
      j.vel.set(0, 0, 0);
    }
  }
  bolaBody.position.set(0, 0.35, 0);
  bolaBody.velocity.set(0, 0, 0);
  bolaBody.angularVelocity.set(0, 0, 0);
  controlado = times.azul[4];
}

function aviso(txt, ms = 1600) {
  const el = document.getElementById('aviso');
  el.textContent = txt;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

function marcarGol(time) {
  jogo.gols[time]++;
  document.getElementById('gol-azul').textContent = jogo.gols.azul;
  document.getElementById('gol-verm').textContent = jogo.gols.verm;
  jogo.pausaGol = 2.6;
  aviso('GOL!', 2200);
  somGol(); somApito();
  vibraCelular([80, 60, 80, 60, 200]);
}

function fimDeJogo() {
  jogo.rolando = false;
  somApito(true);
  const { azul, verm } = jogo.gols;
  const titulo = azul > verm ? 'Vitória azul!' : verm > azul ? 'Vitória vermelha!' : 'Empate';
  document.getElementById('fim-titulo').textContent = titulo;
  document.getElementById('fim-resultado').textContent = `AZU ${azul} – ${verm} VER`;
  document.getElementById('fim').classList.add('show');
}

// ------------------------------------------------------------
// Mecânicas: posse, drible, passe, chute, desarme, goleira
// ------------------------------------------------------------
function acharDono() {
  let melhor = null, melhorD = 1.15;
  if (bolaBody.position.y > 1.4) { jogo.dono = null; return; }
  for (const j of todos) {
    const d = j.distBola();
    if (d < melhorD) { melhorD = d; melhor = j; }
  }
  jogo.dono = melhor;
}

function conduzir(j, dt) {
  // bola "gruda" um pouco à frente de quem domina
  const alvoX = j.pos.x + j.dir.x * 0.85;
  const alvoZ = j.pos.z + j.dir.z * 0.85;
  const forca = 6.5;
  bolaBody.velocity.x += (alvoX - bolaBody.position.x) * forca * dt * 10;
  bolaBody.velocity.z += (alvoZ - bolaBody.position.z) * forca * dt * 10;
  bolaBody.velocity.x *= 0.92;
  bolaBody.velocity.z *= 0.92;
}

function chutar(dirX, dirZ, potencia, altura) {
  const n = Math.hypot(dirX, dirZ) || 1;
  bolaBody.velocity.set((dirX / n) * potencia, altura, (dirZ / n) * potencia);
  bolaBody.angularVelocity.set(-(dirZ / n) * 8, 0, (dirX / n) * 8);
  somChute(Math.min(potencia / 22, 1));
  vibraCelular([40]);
}

function executarPasse(j) {
  if (jogo.dono !== j) return;
  // melhor companheira: à frente, no cone da direção
  let melhor = null, melhorNota = -1;
  for (const c of times[j.time]) {
    if (c === j) continue;
    const dx = c.pos.x - j.pos.x, dz = c.pos.z - j.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 2 || d > 26) continue;
    const dot = (dx * j.dir.x + dz * j.dir.z) / d;
    const nota = dot - d * 0.015;
    if (dot > 0.1 && nota > melhorNota) { melhorNota = nota; melhor = c; }
  }
  if (!melhor) { // sem opção: toca pra frente
    chutar(j.dir.x, j.dir.z, 11, 1.2);
    return;
  }
  const leadX = melhor.pos.x + melhor.vel.x * 0.35;
  const leadZ = melhor.pos.z + melhor.vel.z * 0.35;
  const d = Math.hypot(leadX - j.pos.x, leadZ - j.pos.z);
  chutar(leadX - j.pos.x, leadZ - j.pos.z, THREE.MathUtils.clamp(d * 1.05, 8, 18), d > 14 ? 3 : 1.2);
}

function executarChute(j) {
  if (jogo.dono !== j && j.distBola() > 1.6) return;
  const golX = j.time === 'azul' ? 30 : -30;
  const alvoZ = (Math.random() - 0.5) * (GOL.larg - 1.6);
  const dx = golX - j.pos.x, dz = alvoZ - j.pos.z;
  const d = Math.hypot(dx, dz);
  chutar(dx, dz, THREE.MathUtils.clamp(15 + d * 0.35, 16, 26), THREE.MathUtils.clamp(d * 0.16, 1.5, 5.5));
}

function executarDesarme(j) {
  if (j.lunge > 0) return;
  j.lunge = 0.32;
  const burst = j.dir.clone().multiplyScalar(11);
  j.vel.copy(burst);
}

function resolverDesarmes(dt) {
  for (const j of todos) {
    if (j.lunge <= 0) continue;
    j.lunge -= dt;
    if (j.distBola() < 1.3 && jogo.dono && jogo.dono.time !== j.time) {
      // roubada: bola sai na direção do carrinho
      chutar(j.dir.x + (Math.random() - 0.5) * 0.4, j.dir.z + (Math.random() - 0.5) * 0.4, 9, 1);
      jogo.dono = null;
    }
  }
}

function goleiraIA(gk, dt) {
  const linha = gk.time === 'azul' ? -28.4 : 28.4;
  const bp = bolaBody.position;
  const distGol = Math.abs(bp.x - linha);
  const alvo = new THREE.Vector3(linha, 0, 0);
  // acompanha a bola lateralmente, sai um pouco quando a bola aproxima
  alvo.z = THREE.MathUtils.clamp(bp.z * (distGol < 14 ? 0.8 : 0.35), -3.2, 3.2);
  if (distGol < 9 && Math.abs(bp.z) < 7) {
    alvo.x = linha + Math.sign(bp.x - linha) * Math.min(2.5, distGol * 0.3);
  }
  const delta = alvo.clone().sub(gk.pos);
  const veloc = delta.length() > 0.2 ? delta.normalize().multiplyScalar(distGol < 10 ? 8.5 : 5) : new THREE.Vector3();
  gk.mover(veloc, dt);

  // defesa: bola perto da goleira
  const d = gk.distBola();
  if (d < 1.15 && bp.y < 1.9) {
    const vBola = Math.hypot(bolaBody.velocity.x, bolaBody.velocity.z);
    const paraFora = gk.time === 'azul' ? 1 : -1;
    if (vBola > 14) {
      // espalmada: rebate pro lado
      bolaBody.velocity.set(paraFora * 8, 4, (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 4));
      somChute(0.7);
    } else {
      // segura e repõe: chutão pro campo de ataque
      chutar(paraFora, (Math.random() - 0.5) * 0.7, 20, 6);
      aviso('Defesa!', 900);
    }
    vibraCelular([30]);
  }
}

// ------------------------------------------------------------
// IA de linha (marcação, apoio, ataque)
// ------------------------------------------------------------
function iaTime(time, dt) {
  const elenco = times[time];
  const bp = bolaBody.position;
  const atacaX = time === 'azul' ? 30 : -30;
  const linha = elenco.filter(j => !j.ehGK && j !== controlado);

  // quem está mais perto da bola persegue (se o time não é o controlado, ou é coadjuvante)
  let perseguidora = null, melhorD = Infinity;
  for (const j of linha) {
    const d = j.distBola();
    if (d < melhorD) { melhorD = d; perseguidora = j; }
  }

  for (const j of linha) {
    let alvo;
    const sprint = false;

    if (jogo.dono === j) {
      // com a bola: conduz pro gol, decide chutar ou passar
      const distGol = Math.abs(atacaX - j.pos.x);
      const pressao = todos.some(o => o.time !== time && o.distBola() < 2.4);
      if (distGol < 16 && Math.random() < dt * 1.4) { executarChute(j); continue; }
      if (pressao && Math.random() < dt * 2.2) { executarPasse(j); continue; }
      alvo = new THREE.Vector3(atacaX, 0, THREE.MathUtils.clamp(j.pos.z * 0.6, -8, 8));
      const delta = alvo.sub(j.pos.clone());
      delta.x = atacaX - j.pos.x; delta.z = -j.pos.z * 0.15;
      j.mover(new THREE.Vector3(delta.x, 0, delta.z).normalize().multiplyScalar(j.velBase * 0.95), dt);
      conduzir(j, dt);
      continue;
    }

    if (j === perseguidora && (!jogo.dono || jogo.dono.time !== time)) {
      // pressiona a bola
      alvo = new THREE.Vector3(bp.x, 0, bp.z);
    } else {
      // formação elástica: posição base + deslocamento com a bola
      alvo = j.home.clone();
      alvo.x += (bp.x - 0) * 0.28;
      alvo.z += (bp.z - j.home.z) * 0.22;
      alvo.x = THREE.MathUtils.clamp(alvo.x, -28, 28);
    }
    const delta = alvo.sub(j.pos);
    const dist = delta.length();
    if (dist > 0.4) {
      const rapidez = j === perseguidora ? j.velSprint * 0.92 : j.velBase * 0.8;
      j.mover(delta.normalize().multiplyScalar(Math.min(rapidez, dist * 4)), dt);
    } else {
      j.mover(new THREE.Vector3(), dt);
    }
  }
}

function trocarJogadora() {
  if (!TROCA_MANUAL) return;
  if (jogo.trocaCooldown > 0) return;
  const opcoes = times.azul.filter(j => !j.ehGK && j !== controlado);
  opcoes.sort((a, b) => a.distBola() - b.distBola());
  if (opcoes[0]) {
    controlado = opcoes[0];
    jogo.trocaCooldown = 0.4;
  }
}

function trocaAutomatica() {
  if (!TROCA_AUTOMATICA) return;
  // quando defende, passa o controle pra azul mais perto da bola
  if (jogo.dono && jogo.dono.time === 'azul') return;
  if (jogo.trocaCooldown > 0) return;
  const maisPerto = times.azul.filter(j => !j.ehGK)
    .sort((a, b) => a.distBola() - b.distBola())[0];
  if (maisPerto && maisPerto !== controlado && maisPerto.distBola() < controlado.distBola() * 0.65) {
    controlado = maisPerto;
    jogo.trocaCooldown = 1.2;
  }
}

// ------------------------------------------------------------
// HUD
// ------------------------------------------------------------
const elRelogio = document.getElementById('relogio');
const elNome = document.getElementById('jogador-nome');
const elStamina = document.getElementById('stamina-barra');

function atualizarHUD() {
  const t = Math.max(0, Math.ceil(jogo.tempo));
  elRelogio.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  elNome.textContent = controlado.nome.toUpperCase();
  elStamina.style.width = jogo.stamina + '%';
  elStamina.style.background = jogo.stamina > 35 ? 'var(--ok)' : '#e0a13a';
}

// ------------------------------------------------------------
// Minimapa (visão de cima: onde está cada jogadora + a bola)
// ------------------------------------------------------------
const mmCanvas = document.getElementById('mm-canvas');
const mmCtx = mmCanvas.getContext('2d');
const MM = { w: 200, h: 134, pad: 7 };
(function ajustaMinimapa() {
  const dpr = Math.min(devicePixelRatio, 2);
  mmCanvas.width = MM.w * dpr;
  mmCanvas.height = MM.h * dpr;
  mmCanvas.style.width = MM.w + 'px';
  mmCanvas.style.height = MM.h + 'px';
  mmCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
})();

function desenharMinimapa() {
  const g = mmCtx, { w, h, pad } = MM;
  const fx = pad, fy = pad, fw = w - pad * 2, fh = h - pad * 2;
  // eixos: +x → direita (gol azul), +z → baixo (igual à câmera)
  const MX = x => fx + ((THREE.MathUtils.clamp(x, -30, 30) + 30) / 60) * fw;
  const MZ = z => fy + ((THREE.MathUtils.clamp(z, -20, 20) + 20) / 40) * fh;

  g.clearRect(0, 0, w, h);
  // gramado + linhas
  g.fillStyle = '#1b6b36';
  g.fillRect(fx, fy, fw, fh);
  g.strokeStyle = 'rgba(255,255,255,0.5)';
  g.lineWidth = 1;
  g.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);
  g.beginPath(); g.moveTo(fx + fw / 2, fy); g.lineTo(fx + fw / 2, fy + fh); g.stroke();
  g.beginPath(); g.arc(fx + fw / 2, fy + fh / 2, fh * 0.16, 0, Math.PI * 2); g.stroke();
  // áreas
  const areaH = fh * (16 / 40), areaW = fw * (7 / 60);
  g.strokeRect(fx, fy + (fh - areaH) / 2, areaW, areaH);
  g.strokeRect(fx + fw - areaW, fy + (fh - areaH) / 2, areaW, areaH);
  // boca dos gols
  const golH = fh * (GOL.larg / 40);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.fillRect(fx - 2, fy + (fh - golH) / 2, 2, golH);
  g.fillRect(fx + fw, fy + (fh - golH) / 2, 2, golH);

  // jogadoras
  for (const j of todos) {
    const px = MX(j.pos.x), pz = MZ(j.pos.z);
    if (j === controlado) {
      g.beginPath(); g.arc(px, pz, 5.5, 0, Math.PI * 2);
      g.strokeStyle = '#52d273'; g.lineWidth = 2; g.stroke();
    }
    g.beginPath(); g.arc(px, pz, j.ehGK ? 3.4 : 3, 0, Math.PI * 2);
    g.fillStyle = j.ehGK
      ? (j.time === 'azul' ? '#f2c531' : '#8e5bd6')
      : (j.time === 'azul' ? '#2f7de1' : '#d8452e');
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.5; g.stroke();
  }
  // bola
  const bx = MX(bolaBody.position.x), bz = MZ(bolaBody.position.z);
  g.beginPath(); g.arc(bx, bz, 2.4, 0, Math.PI * 2);
  g.fillStyle = '#ffffff'; g.fill();
  g.strokeStyle = '#111'; g.lineWidth = 0.6; g.stroke();
}

// ------------------------------------------------------------
// Início / reinício
// ------------------------------------------------------------
document.getElementById('btn-jogar').addEventListener('click', () => {
  document.getElementById('inicio').classList.add('esconde');
  iniciarAudio();
  reposicionar();
  jogo.rolando = true;
  somApito();
});
document.getElementById('btn-denovo').addEventListener('click', () => location.reload());

// ------------------------------------------------------------
// Loop principal
// ------------------------------------------------------------
const relogio3 = new THREE.Clock();
const camAlvo = new THREE.Vector3();
const camOlhar = new THREE.Vector3();

function passo() {
  requestAnimationFrame(passo);
  const dt = Math.min(relogio3.getDelta(), 0.05);

  if (jogo.rolando) {
    if (jogo.pausaGol > 0) {
      jogo.pausaGol -= dt;
      if (jogo.pausaGol <= 0) { reposicionar(); somApito(); }
    } else {
      jogo.tempo -= dt;
      if (jogo.tempo <= 0) fimDeJogo();

      jogo.trocaCooldown = Math.max(0, jogo.trocaCooldown - dt);
      acharDono();

      // --- jogadora controlada ---
      const entrada = lerEntrada();
      const querSprint = entrada.sprint && jogo.stamina > 4;
      if (querSprint && (entrada.x || entrada.z)) jogo.stamina = Math.max(0, jogo.stamina - dt * 15);
      else jogo.stamina = Math.min(100, jogo.stamina + dt * 9);

      const rapidez = querSprint ? controlado.velSprint : controlado.velBase;
      if (controlado.lunge <= 0) {
        controlado.mover(new THREE.Vector3(entrada.x, 0, entrada.z).multiplyScalar(rapidez), dt);
      } else {
        controlado.mover(controlado.vel.clone(), dt);
      }
      if (jogo.dono === controlado) conduzir(controlado, dt);

      // botões (do teclado e do celular)
      while (filaBotoes.length) {
        const b = filaBotoes.shift();
        if (b === 'passe') executarPasse(controlado);
        else if (b === 'chute') executarChute(controlado);
        else if (b === 'desarme') executarDesarme(controlado);
        else if (b === 'trocar') trocarJogadora();
      }

      // --- IA ---
      iaTime('verm', dt);
      iaTime('azul', dt);
      goleiraIA(times.azul[0], dt);
      goleiraIA(times.verm[0], dt);
      resolverDesarmes(dt);
      trocaAutomatica();

      // --- física ---
      mundo.step(1 / 60, dt, 3);

      // gol?
      const bp = bolaBody.position;
      if (Math.abs(bp.x) > 30.3 && Math.abs(bp.z) < GOL.larg / 2 && bp.y < GOL.alt) {
        if (jogo.pausaGol <= 0) marcarGol(bp.x > 0 ? 'azul' : 'verm');
      }

      // torcida reage: mais barulho quando a bola chega perto da área
      if (torcidaGain) {
        const tensao = Math.max(0, (Math.abs(bp.x) - 14) / 16);
        const alvoG = 0.05 + tensao * 0.06;
        torcidaGain.gain.value += (alvoG - torcidaGain.gain.value) * dt * 2;
      }
    }
  }

  // visual
  bolaMesh.position.copy(bolaBody.position);
  bolaMesh.quaternion.copy(bolaBody.quaternion);
  for (const j of todos) j.atualizarVisual(dt);
  anel.position.x = controlado.pos.x;
  anel.position.z = controlado.pos.z;

  // câmera broadcast
  camAlvo.set(THREE.MathUtils.clamp(bolaBody.position.x * 0.62, -16, 16), 21, 33);
  camera.position.lerp(camAlvo, Math.min(1, dt * 2.2));
  camOlhar.lerp(new THREE.Vector3(bolaBody.position.x * 0.8, 0.5, bolaBody.position.z * 0.4), Math.min(1, dt * 3));
  camera.lookAt(camOlhar);

  atualizarHUD();
  desenharMinimapa();
  renderer.render(cena, camera);
}
passo();
