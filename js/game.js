// ============================================================
// FUGA DO TRIBUNAL — Jessica × Mike, cada um com seu celular
// 6 níveis, 3 vidas por nível; policiais de azul — no Escritório os
// caçadores (Harvey/Donna/Litt/Rachel) e na Selva os bichos.
// ============================================================
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let madeiraTx = null, marmoreTx = null, livrosTxBase = null;   // caches das texturas procedurais

// ------------------------------------------------------------
// Constantes do jogo
// ------------------------------------------------------------
const ARENA = { comp: 150, larg: 40 };         // x: -75..75 | z: -20..20
// 3 sessões (salas) lado a lado; paredes divisórias em x=-25 e x=+25,
// cada uma com DUAS portas: frente (z=+10) e trás (z=-10)
const SALAS = { centros: [-50, 0, 50], paredes: [-25, 25], portasZ: [-10, 10], vaoMeio: 2.5 };
const DURACAO = 600;                           // teto de tempo da partida inteira
const VIDAS_POR_NIVEL = 3;
const CORES = {
  terno: { jessica: 0x24344d, mike: 0x46232e, policia: 0x1b4c8a },
  gravata: { jessica: 0x9cc4ff, mike: 0xe0483a, policia: 0x0d2b50 },
  camisaSocial: 0xf2f0e9,
  accent: { jessica: 0x2f7de1, mike: 0xd8452e },
  pele: [0xf1c7a8, 0xc98d5f, 0x8a5a37, 0x5f3c22],
  madeira: [0x5a3d26, 0x6b4a2e, 0x74522f],
};

// ------------------------------------------------------------
// Os 6 níveis (mobília relativa ao centro de cada sala)
// ------------------------------------------------------------
const MOB_TRIBUNAL = [
  { x: 0, z: 0, hx: 2.4, hz: 1.5, h: 1.35, tipo: 'juiz' },   // tribuna do juiz
  { x: 0, z: -1.62, hx: 2.4, hz: 0.25, h: 2.8, cor: 0x33241a }, // painel alto atrás do juiz
  { x: -9, z: -6.5, hx: 2.4, hz: 0.9, h: 0.85, tipo: 'mesa' },  // mesa da defesa
  { x: -9, z: 6.5, hx: 2.4, hz: 0.9, h: 0.85, tipo: 'mesa' },   // mesa da acusação
  { x: 9, z: -9, hx: 3.2, hz: 0.7, h: 0.8, tipo: 'banco', encosto: true },  // bancos do júri
  { x: 9, z: 9, hx: 3.2, hz: 0.7, h: 0.8, tipo: 'banco', encosto: true },
  { x: -19, z: 0, hx: 0.9, hz: 3.2, h: 0.95, tipo: 'balcao' },  // balcões
  { x: 19, z: 0, hx: 0.9, hz: 3.6, h: 0.95, tipo: 'balcao' },
  { x: -1, z: -13, hx: 2.8, hz: 0.7, h: 0.8, tipo: 'banco', encosto: true },  // bancos da plateia
  { x: -1, z: 13, hx: 2.8, hz: 0.7, h: 0.8, tipo: 'banco', encosto: true },
  { x: 20, z: -14.5, hx: 1.3, hz: 1.3, h: 1.05, tipo: 'arquivo' }, // arquivos
  { x: 20, z: 14.5, hx: 1.3, hz: 1.3, h: 1.05, tipo: 'arquivo' },
  { x: -21, z: -14.5, hx: 1.5, hz: 0.8, h: 0.8, tipo: 'arquivo' },
  { x: -21, z: 14.5, hx: 1.5, hz: 0.8, h: 0.8, tipo: 'arquivo' },
];
const MOB_ARQUIVO = [ // corredores de estantes em zigue-zague
  { x: -15, z: -7, hx: 0.9, hz: 8.5, h: 2.2, tipo: 'estante' },
  { x: -7.5, z: 7, hx: 0.9, hz: 8.5, h: 2.2, tipo: 'estante' },
  { x: 0, z: -7, hx: 0.9, hz: 8.5, h: 2.2, tipo: 'estante' },
  { x: 7.5, z: 7, hx: 0.9, hz: 8.5, h: 2.2, tipo: 'estante' },
  { x: 15, z: -7, hx: 0.9, hz: 8.5, h: 2.2, tipo: 'estante' },
  { x: -21, z: 14, hx: 1.5, hz: 1, h: 1 },        // caixas de processos
  { x: 21, z: -14, hx: 1.5, hz: 1, h: 1 },
];
const MOB_ESCRITORIO = [ // Pearson Specter Litt
  { x: 0, z: 0, hx: 2.6, hz: 1.2, h: 0.8, tipo: 'mesa', cor: 0x23262c }, // a mesa do Harvey
  { x: -12, z: -8, hx: 2, hz: 1, h: 0.8, tipo: 'mesa' },        // estações de trabalho
  { x: -12, z: 8, hx: 2, hz: 1, h: 0.8, tipo: 'mesa' },
  { x: 12, z: -8, hx: 2, hz: 1, h: 0.8, tipo: 'mesa' },
  { x: 12, z: 8, hx: 2, hz: 1, h: 0.8, tipo: 'mesa' },
  { x: 0, z: -12, hx: 3, hz: 0.8, h: 0.55, tipo: 'sofa', cor: 0x4a4d57 },      // sofás
  { x: 0, z: 12, hx: 3, hz: 0.8, h: 0.55, tipo: 'sofa', cor: 0x4a4d57 },
  { x: -20, z: 0, hx: 0.8, hz: 4, h: 1.9, tipo: 'estante' },    // estante de troféus
  { x: 20, z: 0, hx: 0.8, hz: 4, h: 1.9, tipo: 'estante' },
];
const MOB_BIBLIOTECA = [
  { x: 0, z: -6, hx: 7, hz: 1, h: 0.85, tipo: 'mesa' },         // mesas longas
  { x: 0, z: 6, hx: 7, hz: 1, h: 0.85, tipo: 'mesa' },
  { x: -16, z: -13, hx: 0.9, hz: 5, h: 2.4, tipo: 'estante' },  // estantes de códigos
  { x: 16, z: -13, hx: 0.9, hz: 5, h: 2.4, tipo: 'estante' },
  { x: -16, z: 13, hx: 0.9, hz: 5, h: 2.4, tipo: 'estante' },
  { x: 16, z: 13, hx: 0.9, hz: 5, h: 2.4, tipo: 'estante' },
];
const MOB_FINAL = [ // grande salão: pouco esconderijo
  { x: -12, z: -8, hx: 1, hz: 1, h: 4, tipo: 'pilar', cor: 0xcfc9ba },
  { x: -12, z: 8, hx: 1, hz: 1, h: 4, tipo: 'pilar', cor: 0xcfc9ba },
  { x: 12, z: -8, hx: 1, hz: 1, h: 4, tipo: 'pilar', cor: 0xcfc9ba },
  { x: 12, z: 8, hx: 1, hz: 1, h: 4, tipo: 'pilar', cor: 0xcfc9ba },
  { x: 0, z: 0, hx: 2.4, hz: 1.5, h: 1.35, tipo: 'juiz' },
  { x: 0, z: -1.62, hx: 2.4, hz: 0.25, h: 2.8, cor: 0x33241a },
];
const MOB_SELVA = [ // clareiras com árvores, moitas e pedras
  { x: 0, z: 0, hx: 1.2, hz: 1.2, h: 5, cor: 0x5a4328, tipo: 'arvore' },  // árvore grande
  { x: -14, z: -9, hx: 0.9, hz: 0.9, h: 4.5, cor: 0x5a4328, tipo: 'arvore' },
  { x: 13, z: 8, hx: 0.9, hz: 0.9, h: 4.5, cor: 0x5a4328, tipo: 'arvore' },
  { x: -8, z: 10, hx: 2.2, hz: 1.4, h: 1.1, cor: 0x2e6b2f, tipo: 'moita' },   // moitas
  { x: 8, z: -11, hx: 2.2, hz: 1.4, h: 1.1, cor: 0x2e6b2f, tipo: 'moita' },
  { x: -17, z: 3, hx: 1.6, hz: 1.2, h: 1.4, cor: 0x777d80, tipo: 'pedra' },   // pedras
  { x: 18, z: -3, hx: 1.6, hz: 1.2, h: 1.4, cor: 0x777d80, tipo: 'pedra' },
  { x: -5, z: -14, hx: 1.8, hz: 1.1, h: 1.2, cor: 0x2e6b2f, tipo: 'moita' },
  { x: 4, z: 14, hx: 1.8, hz: 1.1, h: 1.2, cor: 0x2e6b2f, tipo: 'moita' },
  { x: 20, z: 13, hx: 1, hz: 1, h: 3.8, cor: 0x5a4328, tipo: 'arvore' },
  { x: -20, z: -13, hx: 1, hz: 1, h: 3.8, cor: 0x5a4328, tipo: 'arvore' },
];
const NIVEIS = [
  { nome: 'O TRIBUNAL', mobilia: MOB_TRIBUNAL, tapete: '#7c1f24', tinta: null, guardas: 4, veloc: 6.4 },
  { nome: 'O ARQUIVO', mobilia: MOB_ARQUIVO, tapete: '#3c4d24', tinta: 'rgba(40,60,30,0.12)', guardas: 6, veloc: 6.7 },
  { nome: 'O ESCRITÓRIO', mobilia: MOB_ESCRITORIO, tapete: '#274b66', tinta: 'rgba(30,60,90,0.12)', cacadores: true },
  { nome: 'A BIBLIOTECA', mobilia: MOB_BIBLIOTECA, tapete: '#5a3b16', tinta: 'rgba(90,60,20,0.12)', guardas: 9, veloc: 7.2 },
  { nome: 'O JULGAMENTO FINAL', mobilia: MOB_FINAL, tapete: '#6b1720', tinta: 'rgba(120,20,30,0.10)', guardas: 13, veloc: 7.6 },
  { nome: 'A SELVA', mobilia: MOB_SELVA, tapete: '#7a5a33', tinta: null, selva: true, animais: true },
];
// caçadores do Escritório: alvo fixo (0 = Jessica, 1 = Mike)
const CACADORES = [
  { nome: 'Harvey', alvo: 1, terno: 0x24344d, gravata: 0x9cc4ff, cabelo: 0x2a1c10, veloc: 7.4, poder: 'harvey', rotulo: '#9cc4ff' },   // investida: fecha o caso
  { nome: 'Donna', alvo: 1, terno: 0x7a2440, gravata: 0xf2d3a0, cabelo: 0xc0532f, veloc: 8.0, poder: 'donna', rotulo: '#ff8c5a' },    // já sabia: teleporte
  { nome: 'Litt', alvo: 0, terno: 0x50555e, gravata: 0x8e5bd6, cabelo: 0x1c1310, veloc: 7.3, poder: 'litt', rotulo: '#b18cff' },      // constrói barricadas
  { nome: 'Rachel', alvo: 0, terno: 0x3f5147, gravata: 0xd8b23a, cabelo: 0x2f1d12, veloc: 7.6, poder: 'rachel', rotulo: '#ffd24a' },  // invisibilidade
];

// ------------------------------------------------------------
// Cena, câmera, renderer
// ------------------------------------------------------------
const cena = new THREE.Scene();
cena.background = new THREE.Color(0x16110b);
cena.fog = new THREE.Fog(0x16110b, 95, 235);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 300);
camera.position.set(0, 22, 34);

// WebGPU (cai sozinho pra WebGL2 se o navegador não suportar)
const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 3));   // resolução nativa (Retina)
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;      // cor cinematográfica
renderer.toneMappingExposure = 1.05;
document.getElementById('cena').appendChild(renderer.domElement);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Iluminação: salão solene, lustres quentes
cena.add(new THREE.HemisphereLight(0xd9e2ff, 0x241c12, 0.4));
const lustre = new THREE.DirectionalLight(0xffe9c4, 2.1);
lustre.position.set(20, 45, 15);
lustre.castShadow = true;
lustre.shadow.mapSize.set(4096, 4096);
lustre.shadow.bias = -0.0004;
lustre.shadow.camera.left = -80; lustre.shadow.camera.right = 80;
lustre.shadow.camera.top = 32; lustre.shadow.camera.bottom = -32;
lustre.shadow.camera.far = 130;
cena.add(lustre);
const contra = new THREE.DirectionalLight(0xb9c8ff, 0.5);
contra.position.set(-30, 30, -25);
cena.add(contra);

// ------------------------------------------------------------
// Texturas procedurais compartilhadas (o color do material tinge o mapa)
// ------------------------------------------------------------
function texturaMadeira() {
  if (madeiraTx) return madeiraTx;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const g = cv.getContext('2d');
  g.fillStyle = '#c9ae8a'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { // veios ondulados
    const x0 = Math.random() * 512;
    g.strokeStyle = `rgba(90,60,30,${(0.06 + Math.random() * 0.13).toFixed(2)})`;
    g.lineWidth = 1 + Math.random() * 2.5;
    g.beginPath();
    g.moveTo(x0, 0);
    for (let y = 0; y <= 512; y += 64) g.lineTo(x0 + Math.sin(y * 0.02 + i) * 7 + (Math.random() - 0.5) * 5, y);
    g.stroke();
  }
  for (let i = 0; i < 7; i++) { // nós da madeira
    const x = Math.random() * 512, y = Math.random() * 512;
    for (let r = 8; r > 1; r -= 2) {
      g.strokeStyle = `rgba(80,52,26,${(0.1 + (8 - r) * 0.03).toFixed(2)})`;
      g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(x, y, r * 2.2, r, 0.4, 0, Math.PI * 2); g.stroke();
    }
  }
  madeiraTx = new THREE.CanvasTexture(cv);
  madeiraTx.colorSpace = THREE.SRGBColorSpace;
  madeiraTx.wrapS = madeiraTx.wrapT = THREE.RepeatWrapping;
  return madeiraTx;
}
function texturaMarmore() {
  if (marmoreTx) return marmoreTx;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const g = cv.getContext('2d');
  g.fillStyle = '#e8e3d6'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) { // veios do mármore
    let x = Math.random() * 512, y = Math.random() * 512;
    g.strokeStyle = `rgba(120,118,110,${(0.1 + Math.random() * 0.2).toFixed(2)})`;
    g.lineWidth = 0.8 + Math.random() * 1.6;
    g.beginPath(); g.moveTo(x, y);
    for (let p = 0; p < 8; p++) {
      x += (Math.random() - 0.5) * 130;
      y += (Math.random() - 0.3) * 90;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  marmoreTx = new THREE.CanvasTexture(cv);
  marmoreTx.colorSpace = THREE.SRGBColorSpace;
  marmoreTx.wrapS = marmoreTx.wrapT = THREE.RepeatWrapping;
  return marmoreTx;
}
// perna/balaústre torneado no torno (LatheGeometry)
function geoTorneada(h, r) {
  const perfil = [[0.55, 0], [0.95, 0.04], [0.5, 0.1], [0.78, 0.3], [0.45, 0.52], [0.7, 0.74], [0.32, 0.86], [0.42, 1]];
  return new THREE.LatheGeometry(perfil.map(([rr, yy]) => new THREE.Vector2(rr * r, yy * h)), 10);
}

// ------------------------------------------------------------
// Piso (tábuas + tapete + emblema por sala) — recriado a cada nível
// ------------------------------------------------------------
function criaTexturaPiso(cfg) {
  const cv = document.createElement('canvas');
  cv.width = 4096; cv.height = 1280;
  const g = cv.getContext('2d');
  const px = cv.width / (ARENA.comp + 8);
  const py = cv.height / (ARENA.larg + 8);
  const X = x => (x + ARENA.comp / 2 + 4) * px;
  const Z = z => (z + ARENA.larg / 2 + 4) * py;

  const tons = cfg.selva
    ? ['#2f6b31', '#2a6029', '#37753a', '#2c6530']      // grama
    : ['#8a6a45', '#83643f', '#907049', '#7d5e3b'];     // tábuas
  for (let i = 0; i < 24; i++) {
    g.fillStyle = tons[i % 4];
    g.fillRect(0, (cv.height / 24) * i, cv.width, cv.height / 24 + 1);
  }
  // veios da madeira / fiapos de grama
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * cv.width, y = Math.random() * cv.height;
    g.strokeStyle = `rgba(${cfg.selva ? '18,42,18' : '58,40,20'},${(0.05 + Math.random() * 0.09).toFixed(2)})`;
    g.lineWidth = 1 + Math.random();
    g.beginPath();
    g.moveTo(x, y);
    if (cfg.selva) g.lineTo(x + (Math.random() - 0.5) * 8, y - (4 + Math.random() * 12));
    else g.lineTo(x + 40 + Math.random() * 150, y + (Math.random() - 0.5) * 3);
    g.stroke();
  }
  // emendas das tábuas
  if (!cfg.selva) {
    g.strokeStyle = 'rgba(40,28,14,0.35)';
    g.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const y = (cv.height / 24) * i;
      for (let x = (i % 2) * 45; x < cv.width; x += 85 + (i % 3) * 30) {
        g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + cv.height / 24); g.stroke();
      }
    }
  }
  if (cfg.tinta) { // tom do nível
    g.fillStyle = cfg.tinta;
    g.fillRect(0, 0, cv.width, cv.height);
  }
  const tinturas = ['rgba(60,40,90,0.08)', 'rgba(0,0,0,0)', 'rgba(120,70,20,0.10)'];
  for (const [i, cx0] of SALAS.centros.entries()) {
    g.fillStyle = tinturas[i];
    g.fillRect(X(cx0 - 25), Z(-20), X(cx0 + 25) - X(cx0 - 25), Z(20) - Z(-20));
  }
  g.fillStyle = cfg.selva ? '#2a3a20' : '#b9b4a8';
  g.fillRect(0, 0, cv.width, Z(-20));
  g.fillRect(0, Z(20), cv.width, cv.height - Z(20));
  g.fillRect(0, 0, X(-75), cv.height);
  g.fillRect(X(75), 0, cv.width - X(75), cv.height);
  g.strokeStyle = 'rgba(40,34,24,0.5)';
  g.lineWidth = 5;
  g.strokeRect(X(-75), Z(-20), X(75) - X(-75), Z(20) - Z(-20));

  // tapete contínuo (cor do nível)
  g.fillStyle = cfg.tapete;
  g.fillRect(X(-75), Z(-2.5), X(75) - X(-75), Z(2.5) - Z(-2.5));
  g.strokeStyle = '#caa64a';
  g.lineWidth = 3;
  g.strokeRect(X(-75) + 6, Z(-2.5) + 5, X(75) - X(-75) - 12, Z(2.5) - Z(-2.5) - 10);

  // emblema no centro de cada sala (na selva não tem)
  for (const cx0 of (cfg.selva ? [] : SALAS.centros)) {
    const cx = X(cx0), cz = Z(0);
    const s = px;
    g.strokeStyle = 'rgba(240,230,200,0.55)';
    g.lineWidth = 4;
    g.beginPath(); g.arc(cx, cz, 6.5 * s, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx, cz - 3.5 * s); g.lineTo(cx, cz + 3 * s);
    g.moveTo(cx - 3 * s, cz - 2.2 * s); g.lineTo(cx + 3 * s, cz - 2.2 * s);
    g.moveTo(cx - 2 * s, cz + 3 * s); g.lineTo(cx + 2 * s, cz + 3 * s);
    g.stroke();
    for (const lado of [-1, 1]) {
      const bx = cx + lado * 3 * s;
      g.beginPath();
      g.moveTo(bx, cz - 2.2 * s); g.lineTo(bx - 1.1 * s, cz - 0.4 * s);
      g.moveTo(bx, cz - 2.2 * s); g.lineTo(bx + 1.1 * s, cz - 0.4 * s);
      g.stroke();
      g.beginPath(); g.arc(bx, cz - 0.4 * s, 1.1 * s, 0, Math.PI); g.stroke();
    }
  }
  // soleiras das portas
  g.fillStyle = '#a9a294';
  for (const wx of SALAS.paredes) {
    for (const pz of SALAS.portasZ) {
      g.fillRect(X(wx - 1.2), Z(pz - SALAS.vaoMeio), X(wx + 1.2) - X(wx - 1.2), Z(pz + SALAS.vaoMeio) - Z(pz - SALAS.vaoMeio));
    }
  }
  const tx = new THREE.CanvasTexture(cv);
  tx.anisotropy = renderer.capabilities?.getMaxAnisotropy?.() ?? 8;
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

const piso = new THREE.Mesh(
  new THREE.PlaneGeometry(ARENA.comp + 8, ARENA.larg + 8),
  new THREE.MeshStandardMaterial({ map: criaTexturaPiso(NIVEIS[0]), roughness: 0.55, metalness: 0.03 })
);
piso.rotation.x = -Math.PI / 2;
piso.receiveShadow = true;
cena.add(piso);

// ------------------------------------------------------------
// Fachada do tribunal (+x), portão de saída (-x), placas das salas
// ------------------------------------------------------------
function letreiro(texto, larg, alt) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 96;
  const g = cv.getContext('2d');
  g.fillStyle = '#2a2620'; g.fillRect(0, 0, 512, 96);
  g.fillStyle = '#e8d9a8';
  g.font = '700 58px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(texto, 256, 52);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 8;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(larg, alt),
    new THREE.MeshBasicMaterial({ map: tx })
  );
}

function criaTribunal() {
  const grupo = new THREE.Group();
  const marmore = new THREE.MeshStandardMaterial({ map: texturaMarmore(), color: 0xcfc9ba, roughness: 0.32, metalness: 0.05 });
  const escuro = new THREE.MeshStandardMaterial({ color: 0x3a3226 });
  for (let i = 0; i < 3; i++) {
    const degrau = new THREE.Mesh(new THREE.BoxGeometry(2.4 - i * 0.7, 0.3, 26), marmore);
    degrau.position.set(76.4 + i * 0.6, 0.15 + i * 0.3, 0);
    grupo.add(degrau);
  }
  for (let z = -10; z <= 10; z += 4) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 7, 14), marmore);
    col.position.set(78, 4.4, z);
    col.castShadow = true;
    grupo.add(col);
  }
  const topo = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 26), marmore);
  topo.position.set(78, 8.6, 0);
  grupo.add(topo);
  const placa = letreiro('T R I B U N A L', 18, 1.1);
  placa.position.set(76.45, 8.6, 0);
  placa.rotation.y = -Math.PI / 2;
  grupo.add(placa);
  const parede = new THREE.Mesh(new THREE.BoxGeometry(1, 9, 26), escuro);
  parede.position.set(79.6, 4.5, 0);
  grupo.add(parede);
  return grupo;
}
cena.add(criaTribunal());

function criaSaida() {
  const grupo = new THREE.Group();
  const pedra = new THREE.MeshStandardMaterial({ color: 0x8f8878 });
  for (const z of [-4, 4]) {
    const pilar = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 1), pedra);
    pilar.position.set(-76.5, 2.5, z);
    pilar.castShadow = true;
    grupo.add(pilar);
  }
  const travessa = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 9.4), pedra);
  travessa.position.set(-76.5, 5.2, 0);
  grupo.add(travessa);
  const placa = letreiro('S A Í D A', 6.5, 0.9);
  placa.position.set(-75.9, 5.2, 0);
  placa.rotation.y = Math.PI / 2;
  grupo.add(placa);
  return grupo;
}
cena.add(criaSaida());

for (const [i, cx0] of SALAS.centros.entries()) {
  const placa = letreiro(`S A L A  ${i + 1}`, 9, 1);
  placa.position.set(cx0, 7.4, -20.6);
  cena.add(placa);
}

// ------------------------------------------------------------
// Interior do tribunal: parede de fundo com janelas altas, retratos,
// lustres pendurados e balaustrada
// ------------------------------------------------------------
function criaRetrato() {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 160;
  const g = cv.getContext('2d');
  g.fillStyle = '#241a10'; g.fillRect(0, 0, 128, 160);
  g.fillStyle = '#171009';
  g.beginPath(); g.ellipse(64, 108, 34, 42, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(64, 58, 22, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#a8863c'; g.lineWidth = 10; g.strokeRect(5, 5, 118, 150);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

function criaInterior() {
  const madeira = new THREE.MeshStandardMaterial({ map: texturaMadeira(), color: 0x3a2a18, roughness: 0.5 });
  const reboco = new THREE.MeshStandardMaterial({ color: 0xcabfa6, roughness: 0.92 });
  const marfim = new THREE.MeshStandardMaterial({ map: texturaMarmore(), color: 0xb8ad94, roughness: 0.55 });

  // parede do fundo (-z): lambril de madeira embaixo, reboco em cima, cornija
  const lambril = new THREE.Mesh(new THREE.BoxGeometry(158, 3.4, 0.8), madeira);
  lambril.position.set(0, 1.7, -21.3);
  lambril.receiveShadow = true;
  cena.add(lambril);
  const alto = new THREE.Mesh(new THREE.BoxGeometry(158, 10.6, 0.8), reboco);
  alto.position.set(0, 8.7, -21.3);
  alto.receiveShadow = true;
  cena.add(alto);
  const cornija = new THREE.Mesh(new THREE.BoxGeometry(158, 0.6, 1.1), madeira);
  cornija.position.set(0, 14.2, -21.25);
  cena.add(cornija);

  // janelas altas com luz quente entrando
  for (let x = -66; x <= 66; x += 12) {
    const moldura = new THREE.Mesh(new THREE.BoxGeometry(3.4, 8, 0.35), madeira);
    moldura.position.set(x, 8.2, -21.0);
    cena.add(moldura);
    const vidro = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 7.3),
      new THREE.MeshBasicMaterial({ color: 0xf3dca6 })
    );
    vidro.position.set(x, 8.2, -20.8);
    cena.add(vidro);
    for (const dy of [-1.8, 0, 1.8]) {
      const trav = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 0.1), madeira);
      trav.position.set(x, 8.2 + dy, -20.74);
      cena.add(trav);
    }
    const vert = new THREE.Mesh(new THREE.BoxGeometry(0.12, 7.3, 0.1), madeira);
    vert.position.set(x, 8.2, -20.74);
    cena.add(vert);
  }
  // pilastras entre as janelas
  for (let x = -72; x <= 72; x += 12) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.9, 12.8, 0.5), marfim);
    pil.position.set(x, 7.3, -21.0);
    pil.receiveShadow = true;
    cena.add(pil);
  }
  // retratos solenes pendurados
  const txRetrato = criaRetrato();
  for (const x of [-48, -24, 0, 24, 48]) {
    const quadro = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 2.1),
      new THREE.MeshStandardMaterial({ map: txRetrato, roughness: 0.85 })
    );
    quadro.position.set(x, 5.4, -20.72);
    cena.add(quadro);
  }

  // balaustrada baixa no lado da câmera (+z)
  const corrimao = new THREE.Mesh(new THREE.BoxGeometry(158, 0.16, 0.3), madeira);
  corrimao.position.set(0, 1.06, 20.9);
  cena.add(corrimao);
  const baseBal = new THREE.Mesh(new THREE.BoxGeometry(158, 0.12, 0.3), madeira);
  baseBal.position.set(0, 0.1, 20.9);
  cena.add(baseBal);
  const instBal = new THREE.InstancedMesh(geoTorneada(0.9, 0.075), madeira, 132);
  const mB = new THREE.Matrix4();
  let iB = 0;
  for (let x = -74; x <= 74 && iB < 132; x += 1.15) { mB.setPosition(x, 0.6, 20.9); instBal.setMatrixAt(iB++, mB); }
  instBal.count = iB;
  cena.add(instBal);
}
criaInterior();

function criaLustres() {
  const metal = new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.45, metalness: 0.7 });
  for (const x of [-60, -30, 0, 30, 60]) {
    const grupo = new THREE.Group();
    const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 8), metal);
    haste.position.y = 12.3;
    grupo.add(haste);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.09, 10, 24), metal);
    aro.rotation.x = Math.PI / 2;
    aro.position.y = 10.5;
    grupo.add(aro);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const globo = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xffe6b8, emissive: 0xffc46a, emissiveIntensity: 2.2 })
      );
      globo.position.set(Math.cos(a) * 1.1, 10.62, Math.sin(a) * 1.1);
      grupo.add(globo);
    }
    const luz = new THREE.PointLight(0xffd9a3, 90, 42, 1.8);
    luz.position.y = 10.2;
    grupo.add(luz);
    grupo.position.x = x;
    cena.add(grupo);
  }
}
criaLustres();

// ------------------------------------------------------------
// Paredes divisórias (fixas em todos os níveis) + mobília do nível
// ------------------------------------------------------------
const PAREDES = [];
for (const wx of SALAS.paredes) {
  for (const [a, b] of [[-20, -12.5], [-7.5, 7.5], [12.5, 20]]) {
    PAREDES.push({ x: wx, z: (a + b) / 2, hx: 0.6, hz: (b - a) / 2, h: 4.6 });
  }
}
const matParede = new THREE.MeshStandardMaterial({ color: 0x40301e, roughness: 0.8 });
for (const p of PAREDES) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.hx * 2, p.h, p.hz * 2), matParede);
  mesh.position.set(p.x, p.h / 2, p.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  cena.add(mesh);
}
for (const wx of SALAS.paredes) for (const pz of SALAS.portasZ) {
  const verga = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, SALAS.vaoMeio * 2), matParede);
  verga.position.set(wx, 4, pz);
  cena.add(verga);
}

let MOVEIS = [];
let COLISORES = [...PAREDES];
let moveisMeshes = [];

function texturaLivros() {
  if (livrosTxBase) return livrosTxBase;
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = '#241a10'; g.fillRect(0, 0, 512, 64);
  const paleta = ['#7a2e2b', '#2e4a6b', '#6b5a2e', '#3d5a3a', '#5a3a5e', '#8a6a3a', '#42342a'];
  let x = 0;
  while (x < 512) {
    const w = 8 + Math.random() * 14;
    g.fillStyle = paleta[Math.floor(Math.random() * paleta.length)];
    g.fillRect(x, 4 + Math.random() * 7, w - 2, 60);
    x += w;
  }
  livrosTxBase = new THREE.CanvasTexture(cv);
  livrosTxBase.colorSpace = THREE.SRGBColorSpace;
  livrosTxBase.wrapS = THREE.RepeatWrapping;
  return livrosTxBase;
}

// constrói o móvel com forma de verdade (a colisão continua sendo a caixa hx×hz)
function criaMovel(mv, i) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: texturaMadeira(), color: mv.cor ?? CORES.madeira[i % 3], roughness: 0.65 });
  const escuro = new THREE.MeshStandardMaterial({ map: texturaMadeira(), color: 0x2a1d12, roughness: 0.55 });
  const s = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const box = (sx, sy, sz, x, y, z, mm = mat) => {
    const b = s(new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mm));
    b.position.set(x, y, z);
    return b;
  };
  const { hx, hz, h } = mv;
  switch (mv.tipo) {
    case 'mesa': {
      const tampo = s(new THREE.Mesh(new RoundedBoxGeometry(hx * 2, 0.12, hz * 2, 2, 0.04), mat));
      tampo.position.set(0, h - 0.06, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const perna = s(new THREE.Mesh(geoTorneada(h - 0.12, 0.09), mat));
        perna.position.set(sx * (hx - 0.22), 0, sz * (hz - 0.22));
      }
      break;
    }
    case 'banco': {
      const assento = s(new THREE.Mesh(new RoundedBoxGeometry(hx * 2, 0.12, hz * 2, 2, 0.045), mat));
      assento.position.set(0, h - 0.06, 0);
      for (const sx of [-1, 1]) box(0.1, h - 0.12, hz * 2 - 0.2, sx * (hx - 0.15), (h - 0.12) / 2, 0);
      if (mv.encosto) {
        const esp = s(new THREE.Mesh(new RoundedBoxGeometry(hx * 2, 0.9, 0.11, 2, 0.04), mat));
        esp.position.set(0, h + 0.42, Math.sign(mv.z || 1) * (hz - 0.05));
      }
      break;
    }
    case 'estante': {
      for (const sz of [-1, 1]) box(hx * 2, h, 0.12, 0, h / 2, sz * (hz - 0.06));
      box(0.12, h, hz * 2, 0, h / 2, 0);                          // espinha central
      box(hx * 2, 0.08, hz * 2, 0, h - 0.04, 0);                  // tampo
      for (const fy of [0.34, 0.66]) box(hx * 2, 0.07, hz * 2, 0, h * fy, 0);
      const tx = texturaLivros().clone();
      tx.needsUpdate = true;
      tx.repeat.set(Math.max(1, Math.round(hz)), 1);
      const matLivros = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.85 });
      for (const fy of [0.13, 0.46, 0.78]) {
        box(hx * 2 - 0.3, Math.min(0.52, h * 0.26), hz * 2 - 0.35, 0, h * fy + 0.16, 0, matLivros);
      }
      break;
    }
    case 'balcao': {
      box(hx * 2, h * 0.9, hz * 2, 0, h * 0.45, 0);
      box(hx * 2 + 0.24, 0.09, hz * 2 + 0.24, 0, h - 0.045, 0, escuro);
      break;
    }
    case 'arquivo': {
      box(hx * 2, h, hz * 2, 0, h / 2, 0);
      for (const sx of [-1, 1]) for (const fy of [0.28, 0.55, 0.82]) {
        box(0.04, 0.09, hz * 2 - 0.25, sx * (hx + 0.005), h * fy, 0, escuro);
      }
      break;
    }
    case 'sofa': {
      box(hx * 2, 0.3, hz * 2, 0, 0.15, 0);
      const nAl = Math.max(2, Math.round(hx));
      for (let k = 0; k < nAl; k++) { // almofadas do assento
        const w = (hx * 2 - 0.3) / nAl;
        const alm = s(new THREE.Mesh(new RoundedBoxGeometry(w - 0.06, 0.22, hz * 2 - 0.25, 2, 0.07), mat));
        alm.position.set(-hx + 0.15 + w * (k + 0.5), 0.4, 0);
      }
      const costas = s(new THREE.Mesh(new RoundedBoxGeometry(hx * 2, 0.62, 0.2, 2, 0.07), mat));
      costas.position.set(0, 0.62, Math.sign(mv.z || 1) * (hz - 0.1));
      for (const sx of [-1, 1]) {
        const braco = s(new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.55, hz * 2, 2, 0.07), mat));
        braco.position.set(sx * (hx - 0.1), 0.5, 0);
      }
      break;
    }
    case 'pilar': {
      const r = Math.min(hx, hz);
      const matPilar = new THREE.MeshStandardMaterial({ map: texturaMarmore(), color: mv.cor ?? 0xcfc9ba, roughness: 0.35 });
      const corpo = s(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.92, h - 0.5, 20), matPilar));
      corpo.position.y = h / 2;
      for (const [yy, esc] of [[0.125, 1], [h - 0.125, 0.95]]) {
        const mold = s(new THREE.Mesh(new RoundedBoxGeometry(hx * 2 * esc, 0.25, hz * 2 * esc, 2, 0.05), matPilar));
        mold.position.y = yy;
      }
      break;
    }
    case 'juiz': {
      box(hx * 2, h * 0.93, hz * 2 - 0.3, 0, h * 0.465, 0);
      const tampo = s(new THREE.Mesh(new RoundedBoxGeometry(hx * 2 + 0.4, 0.12, hz * 2 + 0.2, 2, 0.05), escuro));
      tampo.position.set(0, h - 0.06, 0);
      box(0.42, 0.06, 0.42, hx - 0.6, h + 0.03, 0, escuro);      // base do martelo
      const cabo = s(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.4, 8), mat));
      cabo.position.set(hx - 0.6, h + 0.14, 0.05);
      cabo.rotation.z = 1.1;
      const cabeca = s(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.22, 10), mat));
      cabeca.position.set(hx - 0.75, h + 0.22, 0.05);
      cabeca.rotation.x = Math.PI / 2;
      break;
    }
    case 'arvore': {
      const tronco = s(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, h * 0.62, 10), mat));
      tronco.position.y = h * 0.31;
      const folha = new THREE.MeshStandardMaterial({ color: 0x2f6b2f, roughness: 0.9, flatShading: true });
      const copa1 = s(new THREE.Mesh(new THREE.IcosahedronGeometry(hx * 1.8, 1), folha));
      copa1.position.y = h * 0.78;
      const copa2 = s(new THREE.Mesh(new THREE.IcosahedronGeometry(hx * 1.25, 1), folha));
      copa2.position.set(hx * 0.5, h * 1.02, hz * 0.4);
      copa2.rotation.y = 0.7;
      break;
    }
    case 'moita': {
      const folha = new THREE.MeshStandardMaterial({ color: mv.cor ?? 0x2e6b2f, roughness: 0.95, flatShading: true });
      for (const [ox, oz, r] of [[0, 0, hx * 0.85], [-hx * 0.55, hz * 0.4, hx * 0.6], [hx * 0.55, -hz * 0.35, hx * 0.65]]) {
        const bola = s(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), folha));
        bola.position.set(ox, r * 0.85, oz);
      }
      break;
    }
    case 'pedra': {
      const rocha = s(new THREE.Mesh(new THREE.IcosahedronGeometry(Math.min(hx, hz) * 1.15, 0), mat));
      rocha.scale.y = 0.68;
      rocha.position.y = Math.min(hx, hz) * 0.62;
      rocha.rotation.y = i * 1.7;
      break;
    }
    default:
      box(hx * 2, h, hz * 2, 0, h / 2, 0);
  }
  return g;
}

function montarMobilia(cfg) {
  for (const m of moveisMeshes) cena.remove(m);
  moveisMeshes = [];
  MOVEIS = [];
  for (const [i, cx0] of SALAS.centros.entries()) {
    const esp = i === 1 ? 1 : -1;                // salas laterais espelhadas
    for (const m of cfg.mobilia) MOVEIS.push({ ...m, x: cx0 + m.x * esp, z: m.z });
  }
  COLISORES = [...MOVEIS, ...PAREDES];
  for (const [i, mv] of MOVEIS.entries()) {
    const g = criaMovel(mv, i);
    g.position.set(mv.x, 0, mv.z);
    cena.add(g);
    moveisMeshes.push(g);
  }
}

// círculo colide com móveis, paredes e barricadas: empurra pelo eixo de menor invasão
function colideLista(lista, pos, raio) {
  for (const m of lista) {
    const dx = pos.x - m.x, dz = pos.z - m.z;
    const px = m.hx + raio - Math.abs(dx);
    if (px <= 0) continue;
    const pz = m.hz + raio - Math.abs(dz);
    if (pz <= 0) continue;
    if (px < pz) pos.x += (dx >= 0 ? px : -px);
    else pos.z += (dz >= 0 ? pz : -pz);
  }
}
function colideMoveis(pos, raio = 0.45) {
  colideLista(COLISORES, pos, raio);
  if (barricadas.length) colideLista(barricadas, pos, raio);
}

// ------------------------------------------------------------
// Personagens
// ------------------------------------------------------------
function criaModeloPersonagem(corTerno, corGravata, opts = {}) {
  const g = new THREE.Group();
  const pele = CORES.pele[Math.floor(Math.random() * CORES.pele.length)];
  const matTerno = new THREE.MeshStandardMaterial({ color: corTerno });
  const matPele = new THREE.MeshStandardMaterial({ color: pele });

  const tronco = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 4, 10), matTerno);
  tronco.position.y = 1.05; tronco.castShadow = true;
  g.add(tronco);

  const camisa = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.3, 0.05),
    new THREE.MeshStandardMaterial({ color: CORES.camisaSocial })
  );
  camisa.position.set(0, 1.22, 0.2);
  g.add(camisa);
  const gravata = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.3, 0.03),
    new THREE.MeshStandardMaterial({ color: corGravata })
  );
  gravata.position.set(0, 1.16, 0.23);
  g.add(gravata);

  const calca = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.24, 10), matTerno);
  calca.position.y = 0.72;
  g.add(calca);

  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), matPele);
  cabeca.position.y = 1.52; cabeca.castShadow = true;
  g.add(cabeca);
  const cabelo = new THREE.Mesh(
    new THREE.SphereGeometry(0.155, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: opts.cabelo ?? 0x2a1c10 })
  );
  cabelo.position.y = 1.545;
  g.add(cabelo);
  if (opts.oculos) {
    const oc = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x0a0a0a }));
    oc.position.set(0, 1.54, 0.12);
    g.add(oc);
  }
  if (opts.quepe) { // quepe de policial
    const matQuepe = new THREE.MeshStandardMaterial({ color: 0x122c4e });
    const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.165, 0.1, 12), matQuepe);
    copa.position.y = 1.66;
    g.add(copa);
    const aba = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 0.14), matQuepe);
    aba.position.set(0, 1.62, 0.2);
    g.add(aba);
  }

  const membro = (mat, comp, raio) => {
    const pivo = new THREE.Group();
    const geo = new THREE.CylinderGeometry(raio, raio * 0.85, comp, 8);
    geo.translate(0, -comp / 2, 0);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    pivo.add(m);
    return pivo;
  };
  const matSapato = new THREE.MeshStandardMaterial({ color: 0x18120c, roughness: 0.4 });
  const pernaE = membro(matTerno, 0.58, 0.085); pernaE.position.set(0, 0.62, -0.11);
  const pernaD = membro(matTerno, 0.58, 0.085); pernaD.position.set(0, 0.62, 0.11);
  const bracoE = membro(matTerno, 0.5, 0.07); bracoE.position.set(0, 1.32, -0.3);
  const bracoD = membro(matTerno, 0.5, 0.07); bracoD.position.set(0, 1.32, 0.3);
  for (const perna of [pernaE, pernaD]) { // sapatos
    const sapato = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.09, 0.24, 2, 0.03), matSapato);
    sapato.position.set(0, -0.56, 0.06);
    sapato.castShadow = true;
    perna.add(sapato);
  }
  for (const braco of [bracoE, bracoD]) { // mãos
    const mao = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), matPele);
    mao.position.set(0, -0.52, 0);
    braco.add(mao);
  }
  const pescoco = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), matPele);
  pescoco.position.y = 1.4;
  g.add(pescoco);
  g.add(pernaE, pernaD, bracoE, bracoD);
  g.userData.membros = { pernaE, pernaD, bracoE, bracoD };
  return g;
}

function criaModeloAnimal(cor, escala = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: cor });
  const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.75, 4, 10), mat);
  corpo.geometry.rotateX(Math.PI / 2);
  corpo.position.y = 0.62; corpo.castShadow = true;
  g.add(corpo);
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat);
  cabeca.position.set(0, 0.82, 0.62); cabeca.castShadow = true;
  g.add(cabeca);
  const focinho = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.18), mat);
  focinho.position.set(0, 0.76, 0.82);
  g.add(focinho);
  for (const lado of [-1, 1]) {
    const orelha = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 6), mat);
    orelha.position.set(lado * 0.11, 1.0, 0.58);
    g.add(orelha);
  }
  const rabo = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.5, 6), mat);
  rabo.position.set(0, 0.78, -0.62);
  rabo.rotation.x = -0.7;
  g.add(rabo);
  const pata = (px, pz) => {
    const pivo = new THREE.Group();
    const geo = new THREE.CylinderGeometry(0.07, 0.055, 0.55, 8);
    geo.translate(0, -0.275, 0);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    pivo.add(m);
    pivo.position.set(px, 0.55, pz);
    g.add(pivo);
    return pivo;
  };
  g.userData.membros = {
    bracoE: pata(-0.18, 0.32), bracoD: pata(0.18, 0.32),
    pernaE: pata(-0.18, -0.32), pernaD: pata(0.18, -0.32),
  };
  g.scale.setScalar(escala);
  return g;
}

class Personagem {
  constructor(nome, corTerno, corGravata, opts = {}) {
    this.nome = nome;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.dir = new THREE.Vector3(1, 0, 0);
    this.fase = Math.random() * 10;
    this.esquivaT = 0;
    this.esquivaCd = 0;
    this.stamina = 100;
    this.veloc = 6.5;
    this.desvioT = 0;                  // (guardas) contornando um obstáculo
    this.desvio = null;
    this.progT = 0;
    this.progPos = null;
    this.poderAtivoT = 0;              // (fugitivos) superpoder ativo
    this.poderCdT = 0;
    this.invisivelT = 0;
    this.voando = false;
    this.alturaVoo = 0;
    this.fade = 1;
    this.mesh = opts.animal
      ? criaModeloAnimal(opts.animal.cor, opts.animal.escala)
      : criaModeloPersonagem(corTerno, corGravata, opts);
    cena.add(this.mesh);
  }

  mover(alvoVel, dt) {
    this.vel.lerp(alvoVel, Math.min(1, dt * 8));
    this.pos.addScaledVector(this.vel, dt);
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -74.4, 74.4);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, -19.4, 19.4);
    if (this.alturaVoo <= 1) colideMoveis(this.pos);   // voando passa por cima de tudo
    if (this.vel.lengthSq() > 0.3) {
      this.dir.copy(this.vel).normalize();
    }
  }

  atualizarVisual(dt) {
    this.mesh.position.copy(this.pos);
    this.mesh.position.y = this.alturaVoo;
    const anguloAlvo = Math.atan2(this.dir.x, this.dir.z);
    let d = anguloAlvo - this.mesh.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.mesh.rotation.y += d * Math.min(1, dt * 10);
    const veloc = this.vel.length();
    this.fase += veloc * dt * 2.4;
    const amp = Math.min(veloc / 9, 1) * 0.75;
    const { pernaE, pernaD, bracoE, bracoD } = this.mesh.userData.membros;
    pernaE.rotation.x = Math.sin(this.fase) * amp;
    pernaD.rotation.x = -Math.sin(this.fase) * amp;
    bracoE.rotation.x = -Math.sin(this.fase) * amp * 0.8;
    bracoD.rotation.x = Math.sin(this.fase) * amp * 0.8;
    this.mesh.rotation.x = this.esquivaT > 0 ? -0.55 : 0;
  }
}

// os dois fugitivos
const jogadores = [
  new Personagem('Jessica', CORES.terno.jessica, CORES.gravata.jessica),
  new Personagem('Mike', CORES.terno.mike, CORES.gravata.mike),
];
const SPAWNS = [new THREE.Vector3(-4, 0, -3.8), new THREE.Vector3(-4, 0, 3.8)]; // sala do meio
for (const j of jogadores) {
  j.materiais = [];
  j.mesh.traverse(n => { if (n.material) { n.material.transparent = true; j.materiais.push(n.material); } });
}

const aneis = jogadores.map((j, i) => {
  const anel = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.72, 28),
    new THREE.MeshBasicMaterial({ color: CORES.accent[i === 0 ? 'jessica' : 'mike'], transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  anel.rotation.x = -Math.PI / 2;
  anel.position.y = 0.03;
  cena.add(anel);
  return anel;
});

// barricadas do Litt: pilhas de processos que somem sozinhas
let barricadas = [];
function criaBarricada(x, z, hx, hz) {
  x = THREE.MathUtils.clamp(x, -73, 73);
  z = THREE.MathUtils.clamp(z, -18.5, 18.5);
  for (const j of jogadores) { // nunca nasce em cima de alguém
    if (Math.abs(j.pos.x - x) < hx + 0.9 && Math.abs(j.pos.z - z) < hz + 0.9) return false;
  }
  const b = { x, z, hx, hz, h: 1.6, vida: 6 };
  b.mesh = new THREE.Mesh(
    new THREE.BoxGeometry(hx * 2, 1.6, hz * 2),
    new THREE.MeshStandardMaterial({ color: 0xb59a63, transparent: true, opacity: 0.95 })
  );
  b.mesh.position.set(x, 0.8, z);
  b.mesh.castShadow = true;
  cena.add(b.mesh);
  barricadas.push(b);
  return true;
}
function limpaBarricadas() {
  for (const b of barricadas) cena.remove(b.mesh);
  barricadas = [];
}

// plaquinha com o nome flutuando sobre o personagem
function criaEtiqueta(nome, cor) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 64;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(10,10,16,0.75)';
  g.beginPath(); g.roundRect(28, 8, 200, 48, 24); g.fill();
  g.fillStyle = cor;
  g.font = '700 30px Archivo, system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(nome.toUpperCase(), 128, 33);
  const txEt = new THREE.CanvasTexture(cv);
  txEt.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: txEt, transparent: true }));
  sp.scale.set(2.4, 0.6, 1);
  sp.position.y = 2.25;
  return sp;
}

// guardas do nível atual (policiais ou caçadores do Escritório)
let oficiais = [];
function criarOficiais() {
  const cfg = NIVEIS[jogo.nivel - 1];
  for (const o of oficiais) cena.remove(o.mesh);
  oficiais = [];
  if (cfg.cacadores) {
    for (const [i, c] of CACADORES.entries()) {
      const o = new Personagem(c.nome, c.terno, c.gravata, { cabelo: c.cabelo });
      const frente = i % 2 === 0;
      o.pos.set((frente ? 1 : -1) * (68 + Math.random() * 4), 0, -12 + Math.random() * 24);
      colideMoveis(o.pos);
      o.veloc = c.veloc;
      o.alvoFixo = c.alvo;
      o.poder = c.poder;
      o.poderT = 4 + i;
      o.seed = Math.random() * 10;
      o.mesh.add(criaEtiqueta(c.nome, c.rotulo));
      o.invisivel = false;
      o.fade = 1;
      o.materiais = [];
      o.mesh.traverse(n => { if (n.material) { n.material.transparent = true; o.materiais.push(n.material); } });
      oficiais.push(o);
    }
    return;
  }
  if (cfg.animais) {
    const bichos = [
      { cor: 0xd98e2b, escala: 1.15, veloc: 8.2, n: 3 },                              // onças
      { cor: 0x7a5230, escala: 0.7, veloc: 7.0, n: 4 + Math.min(jogo.mortesNivel, 4) }, // macacos
      { cor: 0x4f3d2b, escala: 1.0, veloc: 7.5, n: 3 },                               // javalis
    ];
    let i = 0;
    for (const b of bichos) for (let k = 0; k < b.n; k++, i++) {
      const o = new Personagem('Bicho', 0, 0, { animal: b });
      const frente = i % 2 === 0;
      o.pos.set((frente ? 1 : -1) * (70 + Math.random() * 3), 0, -14 + Math.random() * 28);
      colideMoveis(o.pos);
      o.veloc = b.veloc + Math.random() * 0.3;
      o.seed = Math.random() * 10;
      o.animal = true;
      oficiais.push(o);
    }
    return;
  }
  const qtd = Math.min(cfg.guardas + jogo.mortesNivel, 16);
  for (let i = 0; i < qtd; i++) {
    const o = new Personagem('Policial', CORES.terno.policia, CORES.gravata.policia, { oculos: true, quepe: true });
    // invadem pelos DOIS lados: entrada do tribunal (+x) e portão de saída (-x)
    const frente = i % 2 === 0;
    o.pos.set((frente ? 1 : -1) * (70 + Math.random() * 3), 0, -14 + Math.random() * 28);
    colideMoveis(o.pos);
    o.veloc = Math.min(9.2, cfg.veloc + Math.random() * 0.5 + jogo.mortesNivel * 0.1);
    o.seed = Math.random() * 10;
    oficiais.push(o);
  }
}

// ------------------------------------------------------------
// Entrada: 2 celulares (PeerJS) + teclado como reserva
// ------------------------------------------------------------
const teclas = {};
const filaBotoes = [];   // { slot, b }
addEventListener('keydown', e => {
  teclas[e.code] = true;
  if (e.code === 'KeyE') filaBotoes.push({ slot: 0, b: 'esquiva' });
  if (e.code === 'Enter') filaBotoes.push({ slot: 1, b: 'esquiva' });
  if (e.code === 'KeyQ') filaBotoes.push({ slot: 0, b: 'poder' });
  if (e.code === 'KeyP') filaBotoes.push({ slot: 1, b: 'poder' });
});
addEventListener('keyup', e => { teclas[e.code] = false; });

const celulares = [
  { conn: null, on: false, x: 0, y: 0, sp: false },
  { conn: null, on: false, x: 0, y: 0, sp: false },
];

const peer = new Peer();
peer.on('open', id => {
  const base = location.href.replace(/[^/]*(\?.*)?$/, '');
  const url = base + 'controle.html?peer=' + id;
  new QRCode(document.getElementById('qr-alvo'), { text: url, width: 196, height: 196, correctLevel: QRCode.CorrectLevel.M });
  document.getElementById('qr-status').textContent = 'Os dois celulares escaneiam este código';
});
peer.on('connection', conn => {
  const slot = !celulares[0].conn ? 0 : !celulares[1].conn ? 1 : -1;
  if (slot < 0) {
    conn.on('open', () => { conn.send({ t: 'cheio' }); setTimeout(() => conn.close(), 400); });
    return;
  }
  const cel = celulares[slot];
  cel.conn = conn;
  conn.on('data', d => {
    if (d.t === 'st') { cel.x = d.x; cel.y = d.y; cel.sp = d.sp; cel.on = true; }
    else if (d.t === 'b') filaBotoes.push({ slot, b: d.b });
  });
  conn.on('open', () => {
    cel.on = true;
    conn.send({ t: 'quem', nome: jogadores[slot].nome, slot, poder: slot === 0 ? 'Voar' : 'Sumir', cor: '#' + CORES.accent[slot === 0 ? 'jessica' : 'mike'].toString(16).padStart(6, '0') });
    enviaMapa(conn);
    atualizaConexaoHud();
  });
  const solta = () => {
    cel.conn = null; cel.on = false; cel.x = 0; cel.y = 0; cel.sp = false;
    atualizaConexaoHud();
  };
  conn.on('close', solta);
  conn.on('error', solta);
});

function atualizaConexaoHud() {
  for (const [i, nome] of [[0, 'jessica'], [1, 'mike']]) {
    const el = document.getElementById('con-' + nome);
    el.classList.toggle('on', celulares[i].on);
    el.querySelector('span:last-child').textContent =
      jogadores[i].nome + ': ' + (celulares[i].on ? 'celular ✓' : 'teclado');
  }
  const status = document.getElementById('qr-status');
  const n = celulares.filter(c => c.on).length;
  status.textContent = n === 2 ? 'Os dois conectados ✓' : n === 1 ? '1 de 2 conectados — falta um celular' : 'Os dois celulares escaneiam este código';
  status.classList.toggle('on', n === 2);
}

function enviaMapa(conn) {
  if (!conn?.open) return;
  conn.send({ t: 'mapa', m: [...MOVEIS, ...PAREDES].map(m => [m.x, m.z, m.hx, m.hz]) });
}

function vibraCelular(slot, padrao) {
  const c = celulares[slot];
  if (c.conn?.open) c.conn.send({ t: 'v', p: padrao });
}

function lerEntrada(slot) {
  let x = 0, z = 0, sprint = false;
  if (slot === 0) {
    if (teclas.KeyW) z -= 1;
    if (teclas.KeyS) z += 1;
    if (teclas.KeyA) x -= 1;
    if (teclas.KeyD) x += 1;
    sprint = !!teclas.Space;
  } else {
    if (teclas.ArrowUp) z -= 1;
    if (teclas.ArrowDown) z += 1;
    if (teclas.ArrowLeft) x -= 1;
    if (teclas.ArrowRight) x += 1;
    sprint = !!(teclas.ShiftRight || teclas.ShiftLeft);
  }
  const cel = celulares[slot];
  if (Math.hypot(cel.x, cel.y) > 0.12) { x = cel.x; z = cel.y; }
  if (cel.sp) sprint = true;
  const mag = Math.hypot(x, z);
  if (mag > 1) { x /= mag; z /= mag; }
  return { x, z, sprint };
}

// ------------------------------------------------------------
// Áudio sintetizado
// ------------------------------------------------------------
let actx = null, plateiaGain = null;
function iniciarAudio() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
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
  plateiaGain = actx.createGain();
  plateiaGain.gain.value = 0.05;
  fonte.connect(filtro).connect(plateiaGain).connect(actx.destination);
  fonte.start();
}
function somMartelo() {
  if (!actx) return;
  for (const t of [0, 0.18]) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, actx.currentTime + t);
    o.frequency.exponentialRampToValueAtTime(60, actx.currentTime + t + 0.1);
    g.gain.setValueAtTime(0.5, actx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + t + 0.14);
    o.connect(g).connect(actx.destination);
    o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.15);
  }
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
function somEsquiva() {
  if (!actx) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(300, actx.currentTime);
  o.frequency.exponentialRampToValueAtTime(900, actx.currentTime + 0.12);
  g.gain.setValueAtTime(0.12, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.15);
  o.connect(g).connect(actx.destination);
  o.start(); o.stop(actx.currentTime + 0.16);
}
function somPlateiaExplode() {
  if (!actx) return;
  plateiaGain.gain.cancelScheduledValues(actx.currentTime);
  plateiaGain.gain.setValueAtTime(0.35, actx.currentTime);
  plateiaGain.gain.exponentialRampToValueAtTime(0.05, actx.currentTime + 3.5);
}

// ------------------------------------------------------------
// Estado da partida
// ------------------------------------------------------------
const jogo = {
  rolando: false,
  tempo: DURACAO,
  pontos: [0, 0],
  nivel: 1,
  vidas: [VIDAS_POR_NIVEL, VIDAS_POR_NIVEL],
  mortesNivel: 0,
  trocaNivel: false,
  pausa: 0,
  graceT: 0,
};

function aviso(txt, ms = 1600) {
  const el = document.getElementById('aviso');
  el.textContent = txt;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

function atualizarVidasHud() {
  document.getElementById('vidas-jessica').textContent = '● '.repeat(jogo.vidas[0]).trim() || '—';
  document.getElementById('vidas-mike').textContent = '● '.repeat(jogo.vidas[1]).trim() || '—';
}

function montarNivel() {
  const cfg = NIVEIS[jogo.nivel - 1];
  montarMobilia(cfg);
  piso.material.map?.dispose();
  piso.material.map = criaTexturaPiso(cfg);
  piso.material.needsUpdate = true;
  jogo.vidas = [VIDAS_POR_NIVEL, VIDAS_POR_NIVEL];
  jogo.mortesNivel = 0;
  atualizarVidasHud();
  document.getElementById('nivel-txt').textContent = `NÍVEL ${jogo.nivel} · ${cfg.nome}`;
  for (const c of celulares) enviaMapa(c.conn);
}

function novaRodada() {
  const cfg = NIVEIS[jogo.nivel - 1];
  for (const [i, j] of jogadores.entries()) {
    j.pos.copy(SPAWNS[i]);
    colideMoveis(j.pos);
    j.vel.set(0, 0, 0);
    j.dir.set(1, 0, 0);
    j.stamina = 100;
    j.esquivaT = 0; j.esquivaCd = 0;
    j.poderAtivoT = 0; j.poderCdT = 0;
    j.invisivelT = 0; j.voando = false; j.alturaVoo = 0;
  }
  limpaBarricadas();
  criarOficiais();
  jogo.graceT = 1.2;
  somMartelo();
  aviso(jogo.mortesNivel === 0 ? `NÍVEL ${jogo.nivel}: ${cfg.nome}` : 'FUJAM!', 1600);
}

function prender(idx) {
  const rival = 1 - idx;
  jogo.pontos[rival]++;
  jogo.vidas[idx]--;
  jogo.mortesNivel++;
  document.getElementById('pts-jessica').textContent = jogo.pontos[0];
  document.getElementById('pts-mike').textContent = jogo.pontos[1];
  atualizarVidasHud();
  somApito(); somPlateiaExplode();
  vibraCelular(idx, [80, 60, 80, 60, 220]);
  vibraCelular(rival, [40]);
  if (jogo.vidas[idx] <= 0) {
    if (jogo.nivel >= NIVEIS.length) { fimDeJogo(); return; }
    jogo.nivel++;
    jogo.trocaNivel = true;
    jogo.pausa = 2.6;
    aviso(`${jogadores[idx].nome.toUpperCase()} SEM VIDAS — NÍVEL ${jogo.nivel}!`, 2400);
  } else {
    jogo.pausa = 2.4;
    aviso(`${jogadores[idx].nome.toUpperCase()} FOI PRESO!`, 2200);
  }
}

function fimDeJogo() {
  jogo.rolando = false;
  somApito(true);
  const [h, l] = jogo.pontos;
  const titulo = h > l ? 'Jessica escapou!' : l > h ? 'Mike escapou!' : 'Empate no júri';
  document.getElementById('fim-titulo').textContent = titulo;
  document.getElementById('fim-resultado').textContent = `JESSICA ${h} – ${l} MIKE · nível ${jogo.nivel} de ${NIVEIS.length}`;
  document.getElementById('fim').classList.add('show');
}

// ------------------------------------------------------------
// Mecânicas: esquiva, poderes e perseguição
// ------------------------------------------------------------
function executarEsquiva(slot) {
  const j = jogadores[slot];
  if (j.esquivaCd > 0 || j.stamina < 20) return;
  j.esquivaT = 0.22;
  j.esquivaCd = 2.2;
  j.stamina -= 20;
  j.vel.copy(j.dir).multiplyScalar(19);
  somEsquiva();
  vibraCelular(slot, [30]);
}

// superpoderes dos fugitivos: Jessica VOA, Mike SOME — 10s, recarga 25s
function executarPoder(slot) {
  const j = jogadores[slot];
  if (j.poderCdT > 0 || j.poderAtivoT > 0) return;
  j.poderAtivoT = 10;
  j.poderCdT = 35;   // 10s ativos + 25s de recarga
  aviso(slot === 0 ? 'JESSICA VOOU!' : 'MIKE SUMIU!', 1200);
  somEsquiva();
  vibraCelular(slot, [40, 30, 40]);
}

const salaDe = p => p.x < SALAS.paredes[0] ? 0 : p.x < SALAS.paredes[1] ? 1 : 2;
// se o alvo está em outra sessão, mira primeiro na porta certa da parede certa
function pontoRota(o, alvoPos) {
  const sO = salaDe(o.pos), sA = salaDe(alvoPos);
  if (sO === sA) return alvoPos;
  const indo = sA > sO;
  const wallX = indo ? SALAS.paredes[sO] : SALAS.paredes[sO - 1];
  const pz = SALAS.portasZ.reduce((a, b) => Math.abs(o.pos.z - a) < Math.abs(o.pos.z - b) ? a : b);
  return new THREE.Vector3(wallX + (indo ? 2 : -2), 0, pz);
}

// qual colisor está logo à frente do guarda?
function colisorBloqueando(o) {
  const px = o.pos.x + o.dir.x * 0.9, pz = o.pos.z + o.dir.z * 0.9;
  let melhor = null, melhorPen = Infinity;
  for (const m of [...COLISORES, ...barricadas]) {
    const pen = Math.max(Math.abs(px - m.x) - m.hx, Math.abs(pz - m.z) - m.hz);
    if (pen < 0.5 && pen < melhorPen) { melhor = m; melhorPen = pen; }
  }
  return melhor;
}
// ponto pra contornar o obstáculo: a ponta que soma o menor caminho até o alvo
function pontoDesvio(o, m, alvoPos) {
  if (m.hz >= m.hx) {
    const pontas = [m.z - m.hz - 1.3, m.z + m.hz + 1.3];
    const z = pontas.reduce((a, b) =>
      (Math.abs(o.pos.z - a) + Math.abs(alvoPos.z - a)) < (Math.abs(o.pos.z - b) + Math.abs(alvoPos.z - b)) ? a : b);
    const x = m.x + Math.sign(o.pos.x - m.x || 1) * (m.hx + 1.1);
    return new THREE.Vector3(THREE.MathUtils.clamp(x, -74, 74), 0, THREE.MathUtils.clamp(z, -19, 19));
  }
  const pontas = [m.x - m.hx - 1.3, m.x + m.hx + 1.3];
  const x = pontas.reduce((a, b) =>
    (Math.abs(o.pos.x - a) + Math.abs(alvoPos.x - a)) < (Math.abs(o.pos.x - b) + Math.abs(alvoPos.x - b)) ? a : b);
  const z = m.z + Math.sign(o.pos.z - m.z || 1) * (m.hz + 1.1);
  return new THREE.Vector3(THREE.MathUtils.clamp(x, -74, 74), 0, THREE.MathUtils.clamp(z, -19, 19));
}

function iaOficial(o, dt, t) {
  // alvo: fixo (caçadores) ou o fugitivo mais próximo — invisível não é visto
  // (exceto pela Donna, que obviamente sabe)
  const veAlvo = j => j.invisivelT <= 0 || o.poder === 'donna';
  let alvo = null, melhorD = Infinity;
  if (o.alvoFixo !== undefined) {
    const fixo = jogadores[o.alvoFixo];
    if (veAlvo(fixo)) { alvo = fixo; melhorD = o.pos.distanceTo(fixo.pos); }
  } else {
    for (const j of jogadores) {
      if (!veAlvo(j)) continue;
      const d = o.pos.distanceTo(j.pos);
      if (d < melhorD) { melhorD = d; alvo = j; }
    }
  }
  if (!alvo) { // perdeu todo mundo de vista: patrulha a própria sala
    const cx0 = SALAS.centros[salaDe(o.pos)];
    const wx = cx0 + Math.sin(t * 0.5 + o.seed) * 10;
    const wz = Math.cos(t * 0.4 + o.seed * 2) * 12;
    const dl = Math.hypot(wx - o.pos.x, wz - o.pos.z) || 1;
    o.mover(new THREE.Vector3((wx - o.pos.x) / dl * o.veloc * 0.55, 0, (wz - o.pos.z) / dl * o.veloc * 0.55), dt);
    return;
  }

  // superpoderes dos caçadores
  let alvoPos = alvo.pos;
  let fator = 1;
  if (o.poder === 'donna') {
    // Donna: antecipa o movimento e, de tempos em tempos, JÁ ESTÁ lá
    o.poderT -= dt;
    alvoPos = alvo.pos.clone().addScaledVector(alvo.vel, 0.55);
    if (o.poderT <= 0 && melhorD > 11) {
      const fuga = alvo.vel.lengthSq() > 1
        ? alvo.vel.clone().normalize()
        : new THREE.Vector3(Math.cos(o.seed * 7), 0, Math.sin(o.seed * 7));
      o.pos.copy(alvo.pos).addScaledVector(fuga, 7);
      o.pos.x = THREE.MathUtils.clamp(o.pos.x, -74.4, 74.4);
      o.pos.z = THREE.MathUtils.clamp(o.pos.z, -19.4, 19.4);
      colideMoveis(o.pos);
      o.vel.set(0, 0, 0);
      o.poderT = 6.5;
      somEsquiva();
      aviso('DONNA JÁ SABIA…', 1000);
    }
  } else if (o.poder === 'harvey') {
    // Harvey: investida — quando te vê perto, fecha o caso em disparada
    o.poderT -= dt;
    if (o.poderT <= 0 && melhorD > 3 && melhorD < 11) {
      o.investidaT = 0.55;
      o.poderT = 5;
      somEsquiva();
      aviso('HARVEY FECHANDO O CASO', 900);
    }
    if (o.investidaT > 0) { o.investidaT -= dt; fator = 2.1; }
  } else if (o.poder === 'litt') {
    // Litt: constrói uma pilha de processos no seu caminho de fuga
    o.poderT -= dt;
    const v = alvo.vel;
    if (o.poderT <= 0 && melhorD < 22 && Math.hypot(v.x, v.z) > 2.5) {
      const n = Math.hypot(v.x, v.z);
      const px = alvo.pos.x + (v.x / n) * 4.2;
      const pz = alvo.pos.z + (v.z / n) * 4.2;
      const ok = Math.abs(v.x) >= Math.abs(v.z)
        ? criaBarricada(px, pz, 0.7, 2.4)
        : criaBarricada(px, pz, 2.4, 0.7);
      if (ok) {
        o.poderT = 7.5;
        somMartelo();
        aviso('VOCÊ FOI LITT UP!', 1100);
      }
    }
  } else if (o.poder === 'rachel') {
    // Rachel: some da vista (e do minimapa) em ciclos
    o.poderT -= dt;
    if (o.poderT <= 0) {
      o.invisivel = !o.invisivel;
      o.poderT = o.invisivel ? 3 : 4.2;
      if (o.invisivel && melhorD < 18) aviso('RACHEL SUMIU…', 800);
    }
  }

  const rota = pontoRota(o, alvoPos);
  const emRota = rota !== alvoPos;

  // anti-travamento: se não saiu do lugar, contorna o obstáculo pela ponta
  o.progT += dt;
  if (o.progT > 0.6) {
    if (o.progPos && o.pos.distanceTo(o.progPos) < 0.4 && melhorD > 2 && o.desvioT <= 0) {
      const m = colisorBloqueando(o);
      if (m) { o.desvio = pontoDesvio(o, m, alvoPos); o.desvioT = 1.6; }
    }
    o.progPos = (o.progPos ?? new THREE.Vector3()).copy(o.pos);
    o.progT = 0;
  }
  let destino = rota;
  if (o.desvioT > 0) {
    o.desvioT -= dt;
    destino = o.desvio;
    if (o.pos.distanceTo(o.desvio) < 1.1) o.desvioT = 0;
  }

  const delta = destino.clone().sub(o.pos);
  delta.y = 0;
  const ang = Math.atan2(delta.z, delta.x) + Math.sin(t * 1.7 + o.seed) * (emRota || o.desvioT > 0 ? 0.08 : 0.22);
  let rapidez = o.veloc * fator;
  if (melhorD > 16) rapidez *= 1.25;
  o.mover(new THREE.Vector3(Math.cos(ang) * rapidez, 0, Math.sin(ang) * rapidez), dt);
  if (melhorD < 0.8 && alvo.alturaVoo < 0.6 && (alvo.invisivelT <= 0 || o.poder === 'donna')) {
    prender(jogadores.indexOf(alvo));
  }
}

// ------------------------------------------------------------
// HUD
// ------------------------------------------------------------
const elRelogio = document.getElementById('relogio');
const elStamina = [document.getElementById('stamina-jessica'), document.getElementById('stamina-mike')];

function atualizarHUD() {
  const t = Math.max(0, Math.ceil(jogo.tempo));
  elRelogio.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  for (const [i, el] of elStamina.entries()) {
    el.style.width = jogadores[i].stamina + '%';
    el.style.background = jogadores[i].stamina > 35 ? 'var(--ok)' : '#e0a13a';
  }
}

// ------------------------------------------------------------
// Minimapa
// ------------------------------------------------------------
const mmCanvas = document.getElementById('mm-canvas');
const mmCtx = mmCanvas.getContext('2d');
const MM = { w: 330, h: 100, pad: 6 };
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
  const MX = x => fx + ((THREE.MathUtils.clamp(x, -75, 75) + 75) / 150) * fw;
  const MZ = z => fy + ((THREE.MathUtils.clamp(z, -20, 20) + 20) / 40) * fh;

  g.clearRect(0, 0, w, h);
  g.fillStyle = '#6b5232';
  g.fillRect(fx, fy, fw, fh);
  g.fillStyle = NIVEIS[jogo.nivel - 1].tapete;
  g.fillRect(fx, MZ(-2.5), fw, MZ(2.5) - MZ(-2.5));
  g.strokeStyle = 'rgba(255,255,255,0.5)';
  g.lineWidth = 1;
  g.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);
  g.fillStyle = 'rgba(30,20,10,0.65)';
  for (const m of MOVEIS) {
    g.fillRect(MX(m.x - m.hx), MZ(m.z - m.hz), MX(m.x + m.hx) - MX(m.x - m.hx), MZ(m.z + m.hz) - MZ(m.z - m.hz));
  }
  g.fillStyle = 'rgba(15,9,4,0.95)';
  for (const p of PAREDES) {
    g.fillRect(MX(p.x) - 1.2, MZ(p.z - p.hz), 2.4, MZ(p.z + p.hz) - MZ(p.z - p.hz));
  }
  g.fillStyle = 'rgba(201,174,107,0.9)';
  for (const b of barricadas) {
    g.fillRect(MX(b.x - b.hx), MZ(b.z - b.hz), MX(b.x + b.hx) - MX(b.x - b.hx), MZ(b.z + b.hz) - MZ(b.z - b.hz));
  }
  g.fillStyle = 'rgba(220,214,196,0.8)';
  g.fillRect(fx + fw - 3, fy, 3, fh);
  g.fillRect(fx, fy, 3, fh);

  for (const o of oficiais) {
    if (o.invisivel) continue;
    g.beginPath(); g.arc(MX(o.pos.x), MZ(o.pos.z), 2.6, 0, Math.PI * 2);
    g.fillStyle = o.alvoFixo !== undefined ? '#5a3f8f' : o.animal ? '#3f8f3f' : '#1b4c8a';
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 0.8; g.stroke();
  }
  for (const [i, j] of jogadores.entries()) {
    g.beginPath(); g.arc(MX(j.pos.x), MZ(j.pos.z), 3.4, 0, Math.PI * 2);
    g.fillStyle = i === 0 ? '#2f7de1' : '#d8452e';
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.6; g.stroke();
  }
}

// ------------------------------------------------------------
// Início / reinício
// ------------------------------------------------------------
document.getElementById('btn-jogar').addEventListener('click', () => {
  document.getElementById('inicio').classList.add('esconde');
  iniciarAudio();
  jogo.tempo = DURACAO;
  jogo.pontos = [0, 0];
  jogo.nivel = 1;
  montarNivel();
  novaRodada();
  jogo.rolando = true;
});
document.getElementById('btn-denovo').addEventListener('click', () => location.reload());

// ------------------------------------------------------------
// Loop principal
// ------------------------------------------------------------
const relogio3 = new THREE.Clock();
const camAlvo = new THREE.Vector3();
const camOlhar = new THREE.Vector3();
let tempoTotal = 0;
let mmEnvioT = 0;

function passo() {
  const dt = Math.min(relogio3.getDelta(), 0.05);
  tempoTotal += dt;

  if (jogo.rolando) {
    if (jogo.pausa > 0) {
      jogo.pausa -= dt;
      if (jogo.pausa <= 0) {
        if (jogo.trocaNivel) { montarNivel(); jogo.trocaNivel = false; }
        novaRodada();
      }
    } else {
      jogo.tempo -= dt;
      if (jogo.tempo <= 0) fimDeJogo();
      jogo.graceT = Math.max(0, jogo.graceT - dt);

      // --- fugitivos ---
      for (const [i, j] of jogadores.entries()) {
        const entrada = lerEntrada(i);
        j.esquivaCd = Math.max(0, j.esquivaCd - dt);
        j.poderCdT = Math.max(0, j.poderCdT - dt);
        j.poderAtivoT = Math.max(0, j.poderAtivoT - dt);
        if (i === 0) j.voando = j.poderAtivoT > 0;      // Jessica voa
        else j.invisivelT = j.poderAtivoT;              // Mike some
        const querSprint = entrada.sprint && j.stamina > 4;
        if (querSprint && (entrada.x || entrada.z)) j.stamina = Math.max(0, j.stamina - dt * 16);
        else j.stamina = Math.min(100, j.stamina + dt * 10);
        const rapidez = querSprint ? 9.5 : 6.5;
        if (j.esquivaT > 0) {
          j.esquivaT -= dt;
          j.mover(j.vel.clone(), dt);
        } else {
          j.mover(new THREE.Vector3(entrada.x, 0, entrada.z).multiplyScalar(rapidez), dt);
        }
      }

      // botões (teclado e celulares)
      while (filaBotoes.length) {
        const { slot, b } = filaBotoes.shift();
        if (b === 'esquiva') executarEsquiva(slot);
        else if (b === 'poder') executarPoder(slot);
      }

      // --- guardas ---
      if (jogo.graceT <= 0) {
        for (const o of oficiais) {
          iaOficial(o, dt, tempoTotal);
          if (jogo.pausa > 0 || !jogo.rolando) break;
        }
      }

      // barricadas do Litt derretem sozinhas
      for (let i = barricadas.length - 1; i >= 0; i--) {
        const b = barricadas[i];
        b.vida -= dt;
        if (b.vida <= 0) { cena.remove(b.mesh); barricadas.splice(i, 1); }
        else if (b.vida < 1) b.mesh.material.opacity = b.vida * 0.95;
      }

      // plateia reage quando um guarda está colado
      if (plateiaGain) {
        let perto = 99;
        for (const o of oficiais) for (const j of jogadores) perto = Math.min(perto, o.pos.distanceTo(j.pos));
        const tensao = THREE.MathUtils.clamp(1 - perto / 8, 0, 1);
        const alvoG = 0.05 + tensao * 0.07;
        plateiaGain.gain.value += (alvoG - plateiaGain.gain.value) * dt * 2;
      }
    }
  }

  // visual
  for (const j of jogadores) {
    j.alturaVoo += ((j.voando ? 5.6 : 0) - j.alturaVoo) * Math.min(1, dt * 3);
    const alvoFade = j.invisivelT > 0 ? 0.15 : 1;
    j.fade += (alvoFade - j.fade) * Math.min(1, dt * 5);
    if (j.materiais && j.fade < 0.999) for (const m of j.materiais) m.opacity = j.fade;
    else if (j.materiais && j.fade >= 0.999) for (const m of j.materiais) m.opacity = 1;
    j.atualizarVisual(dt);
  }
  for (const o of oficiais) {
    o.atualizarVisual(dt);
    if (o.poder === 'rachel' && o.materiais) { // fade da invisibilidade
      const alvoFade = o.invisivel ? 0.1 : 1;
      o.fade += (alvoFade - o.fade) * Math.min(1, dt * 5);
      for (const m of o.materiais) m.opacity = o.fade;
    }
  }
  for (const [i, anel] of aneis.entries()) {
    anel.position.x = jogadores[i].pos.x;
    anel.position.z = jogadores[i].pos.z;
  }

  // minimapa dos celulares (~8Hz)
  mmEnvioT -= dt;
  if (mmEnvioT <= 0) {
    mmEnvioT = 0.12;
    const oArr = oficiais.filter(o => !o.invisivel)
      .map(o => [Math.round(o.pos.x), Math.round(o.pos.z), o.alvoFixo !== undefined ? 1 : o.animal ? 2 : 0]);
    const bArr = barricadas.map(b => [b.x, b.z, b.hx, b.hz]);
    for (const [si, c] of celulares.entries()) {
      if (!c.conn?.open) continue;
      c.conn.send({
        t: 'mm',
        // o rival invisível some do SEU mapa; você sempre se vê
        j: jogadores.map((j, ji) => (ji === si || j.invisivelT <= 0)
          ? [Math.round(j.pos.x * 10) / 10, Math.round(j.pos.z * 10) / 10] : null),
        o: oArr,
        b: bArr,
      });
    }
  }

  // câmera: enquadra os dois fugitivos
  const cx = (jogadores[0].pos.x + jogadores[1].pos.x) / 2;
  const cz = (jogadores[0].pos.z + jogadores[1].pos.z) / 2;
  const sep = jogadores[0].pos.distanceTo(jogadores[1].pos);
  camAlvo.set(
    THREE.MathUtils.clamp(cx * 0.8, -58, 58),
    20 + THREE.MathUtils.clamp(sep * 0.3, 0, 16),
    31 + THREE.MathUtils.clamp(sep * 0.18, 0, 9)
  );
  camera.position.lerp(camAlvo, Math.min(1, dt * 2.2));
  camOlhar.lerp(new THREE.Vector3(cx * 0.9, 0.5, cz * 0.45), Math.min(1, dt * 3));
  camera.lookAt(camOlhar);

  atualizarHUD();
  desenharMinimapa();
  renderer.render(cena, camera);
}
montarMobilia(NIVEIS[0]);
// inicializa a GPU sem travar o resto (QR/celulares funcionam mesmo se o 3D falhar)
renderer.init().then(() => {
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  } catch (e) {
    console.warn('ambiente PBR indisponível:', e);
  }
  renderer.setAnimationLoop(passo);
}).catch(err => {
  console.error('Falha ao iniciar o renderizador:', err);
  const el = document.getElementById('qr-status');
  if (el) el.textContent = '⚠ renderizador: ' + (err?.message || err);
});
