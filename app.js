import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs, runTransaction, serverTimestamp, Timestamp, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';


/* ============ basis ============ */
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const nl = (n, d = 1) => n.toFixed(d).replace('.', ',');
const pad2 = n => String(n).padStart(2, '0');
const rand = (a, b) => a + Math.random() * (b - a);
const ri = n => Math.floor(Math.random() * n);

/* ============ data ============ */
const SKIN = ['#ffe0c2', '#f7cfa4', '#e6b183', '#cf9560', '#a96d3f', '#7a4a28', '#5a3319', '#3b2012'];
const HAIRCOL = ['#1d130c', '#4a2e1b', '#8a5a2b', '#c9822b', '#e8c76a', '#b5302a', '#7a3fb8', '#2f7bd6', '#e9e9ee', '#ff5fa2'];
const NAMES = {
  hair: ['Kort', 'Lang', 'Knot', 'Krullen', 'Kaal', 'Stekels', 'Afro', 'Staartjes', 'Bob', 'Paardenstaart', 'Kuif', 'Vlechten', 'Lang golvend', 'Kort met pony', 'Lang met pony', 'Halflang', 'Hoge staart', 'Zijscheiding', 'Kort met knotje', 'Warrig', 'Borstelkop', 'Hoogtop', 'Mohawk', 'Achterover', 'Korte krullen'],
  outfit: ['Polo', 'Hoodie', 'Colbert', 'Sportshirt', 'Jurk', 'Tuinbroek', 'Hawaïshirt', 'Regenjas', 'Safarivest', 'Tanktop', 'Gestreept', 'Poncho', 'Col trui', 'Schooluniform'],
  accessory: ['Geen', 'Bril', 'Zonnebril', 'Pet', 'Kroon', 'Strikje', 'Hoge hoed', 'Koptelefoon', 'Bandana', 'Rugzak', 'Sjaal', 'Cape', 'Bloemenketting', 'Strohoed']
};
const COUNTS = { skin: 8, face: 3, hair: 25, hairColor: 10, brows: 4, eyes: 5, nose: 3, mouth: 5, accessory: 14, outfit: 14, build: 3 };
const TABS = [['skin', 'Huid'], ['face', 'Gezicht'], ['hair', 'Haar'], ['hairColor', 'Haarkleur'], ['brows', 'Wenkbrauwen'], ['eyes', 'Ogen'], ['nose', 'Neus'], ['mouth', 'Mond'], ['outfit', 'Kleding'], ['accessory', 'Accessoire'], ['build', 'Postuur']];
const defaultLook = () => ({ skin: 1, face: 0, hair: 0, hairColor: 0, brows: 1, eyes: 0, nose: 0, mouth: 0, accessory: 0, outfit: 0, build: 1 });
const randomLook = () => { const l = {}; for (const k in COUNTS) l[k] = ri(COUNTS[k]); if (l.accessory > 2 && Math.random() < .5) l.accessory = 0; return l; };

const ALL = ['vine', 'fruit', 'barrel', 'tilt', 'react', 'stack', 'dart', 'surf', 'baboon', 'kick'];
const GAMES = {
  vine: { title: 'Liaan zwaaien', icon: '🌴', better: 'high', how: 'Tik om los te laten terwijl je omhoog en vooruit zwaait. Drie sprongen, de afstanden tellen op.', fmt: n => nl(n) + ' m' },
  fruit: { title: 'Fruit hakken', icon: '🍉', better: 'high', how: 'Tik zo snel je kunt. Je hebt 10 seconden. Elke tik is een snee.', fmt: n => n + ' stukken' },
  barrel: { title: 'Ton stoppen', icon: '🛢️', better: 'low', how: 'De ton valt en wordt sneller. Tik op het juiste moment, zodat de ton precies boven je hoofd blijft hangen.', fmt: n => Math.round(n) + ' px ernaast' },
  tilt: { title: 'Kantelrace', icon: '🎱', better: 'low', how: 'Kantel je telefoon en rol de bal naar de vlag. Een gat kost 2 seconden. In deze demo stuur je met de ronde knop of de pijltjestoetsen.', fmt: n => nl(n) + ' s' },
  react: { title: 'Vuurvliegje vangen', icon: '✨', better: 'low', how: 'Wacht tot de cirkel groen wordt en tik dan zo snel je kunt. Te vroeg tikken kost 500 milliseconden. Drie pogingen, het gemiddelde telt.', fmt: n => Math.round(n) + ' ms' },
  stack: { title: 'Stenen stapelen', icon: '🧱', better: 'high', how: 'Tik om het blok te laten vallen. Wat over de rand uitsteekt, valt eraf. Stapel zo hoog mogelijk.', fmt: n => n + ' blokken' },
  dart: { title: 'Mikken op de gong', icon: '🎯', better: 'high', how: 'Tik als het vizier op het midden staat. Drie worpen, elke worp levert tot 100 punten op.', fmt: n => n + ' punten' },
  surf: { title: 'Surfen', icon: '🏄', better: 'high', how: 'x', fmt: n => nl(n) + ' punten' },
  baboon: { title: 'Baviaantjes vangen', icon: '🐒', better: 'high', how: 'x', fmt: n => n + ' gevangen' },
  kick: { title: 'Penalty trappen', icon: '🏉', better: 'high', how: 'x', fmt: n => n + ' punten' },
  memory: { title: 'Dierengeheugen', icon: '🐸', better: 'high', how: 'Onthoud de volgorde van de dieren en herhaal die. Eén fout is het einde.', fmt: n => n + ' rondes' },
};

Object.assign(GAMES.vine, { title: 'Liaan zwaaien', how: 'Zwaai vanaf Leeuwenkop en tik om los te laten. Hoog en naar voren vliegt het verst. Haal je de gouden zone, dan land je als een held. Anders val je en zie je sterretjes.' });
Object.assign(GAMES.fruit, { title: 'Fruit hakken', icon: '🍍', how: 'Op de markt in Bo-Kaap hak je fruit. Tik afwisselend links en rechts, 10 seconden lang. Tik je twee keer dezelfde kant, dan mis je.' });
Object.assign(GAMES.barrel, { title: 'Gondel stoppen', icon: '🚡', how: 'De kabelbaan gondel van de Tafelberg valt naar beneden en soms hangt hij even stil. Tik zodat hij precies boven je hoofd stopt.' });
Object.assign(GAMES.tilt, { title: 'Strandrace', icon: '🏖️', how: 'Rol de strandbal naar de vlag. Vermijd de getijdenpoelen en de krabben. Een fout kost 2 seconden. In deze demo stuur je met de ronde knop of de pijltjestoetsen.' });
Object.assign(GAMES.memory, { title: 'Dierengeheugen', icon: '🐧', how: 'Pinguïn, baviaan, flamingo en zeehond lichten op in een steeds snellere volgorde. Herhaal die. Eén fout is het einde.' });
Object.assign(GAMES.react, { title: 'Noenschot', icon: '💥', how: 'Wacht tot het kanon op Signal Hill afgaat en tik dan zo snel je kunt. Te vroeg tikken kost 500 milliseconden. Drie pogingen.' });
Object.assign(GAMES.stack, { title: 'Bo-Kaap toren', icon: '🏘️', how: 'Stapel de kleurige huisjes. Tik om het huisje te laten vallen. Wat over de rand steekt, valt eraf. Hoe hoger, hoe beter.', fmt: n => n + ' huisjes' });
Object.assign(GAMES.dart, { title: 'Mikken op de gong', icon: '🎯', how: 'Gooi kokosnoten op de gong. Tik als het vizier in het midden is en let op de wind. Drie worpen.' });

Object.assign(GAMES.surf, { how: 'Surf bij Muizenberg. Tik links of rechts om van baan te wisselen. Ontwijk haaien, rotsen en boeien en pak de sterren voor extra punten.' });
Object.assign(GAMES.baboon, { how: 'Baviaantjes stelen uit de ramen van Bo-Kaap. Tik ze snel weg. Tik je op de oma, dan gaan er 3 punten af. 15 seconden.' });
Object.assign(GAMES.kick, { how: 'Trap een penalty bij het stadion. Tik eerst als de richting goed is, daarna in het groene stuk voor de juiste kracht. Drie trappen.' });

/* ============ tijd en dagkeuze (port van time.ts en daily.ts) ============ */
function tzParts(date, tz) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const p = {}; f.formatToParts(date).forEach(x => p[x.type] = x.value);
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}
function offsetMs(utcMs, tz) { const p = tzParts(new Date(utcMs), tz); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(utcMs / 1000) * 1000; }
function zonedToUtc(y, m, d, h, tz) { const g0 = Date.UTC(y, m - 1, d, h, 0, 0); const g1 = g0 - offsetMs(g0, tz); return g0 - offsetMs(g1, tz); }
function roundInfo(nowMs, tz, hour) {
  const p = tzParts(new Date(nowMs), tz); let base = Date.UTC(p.y, p.m - 1, p.d); if (p.h >= hour) base += 86400000;
  const b = new Date(base), y = b.getUTCFullYear(), m = b.getUTCMonth() + 1, d = b.getUTCDate();
  return { roundId: `${y}-${pad2(m)}-${pad2(d)}`, revealAtMs: zonedToUtc(y, m, d, hour, tz) };
}
const fmtCd = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s % 3600 / 60))}:${pad2(s % 60)}`; };
function xmur3(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return h >>> 0; }; }
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function pickGames(seed) { const r = mulberry32(xmur3(seed)()); const a = [...ALL]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, 4); }

/* ============ bord en spelregels (port van tiles.ts en engine.ts) ============ */
const COLS = 5, ROW_H = 78;
const boardHeight = size => Math.ceil(size / COLS) * ROW_H + 200;
function tileKind(i, size) {
  if (i >= size) return 'finish'; if (i <= 0) return 'normal';
  if (i % 10 === 7) return 'bonus'; if (i > 10 && i % 10 === 4) return 'trap'; if (i === 15 || i === 33) return 'shortcut';
  return 'normal';
}
function applyTile(pos, size) {
  const tile = tileKind(pos, size);
  if (tile === 'bonus') return { pos: Math.min(pos + 2, size), tile };
  if (tile === 'trap') return { pos: Math.max(pos - 2, 0), tile };
  if (tile === 'shortcut') return { pos: Math.min(pos + 4, size), tile };
  return { pos, tile };
}
function tilePoint(i, size, W) {
  const H = boardHeight(size); if (i <= 0) return { x: W * 0.14, y: H - 44 };
  const idx = i - 1, r = Math.floor(idx / COLS); let c = idx % COLS; if (r % 2 === 1) c = COLS - 1 - c;
  return { x: W * 0.14 + W * 0.72 * (c / (COLS - 1)), y: H - 120 - r * ROW_H };
}
function computeRound(room, games, scoresBy, rng = Math.random) {
  const P = room.players, n = P.length, size = room.size;
  const fin = P.filter(p => games.every(g => typeof (scoresBy[p.id] || {})[g] === 'number')).map(p => p.id);
  const perGame = {}, total = {}; fin.forEach(u => { perGame[u] = {}; total[u] = 0; });
  for (const g of games) {
    const hi = GAMES[g].better === 'high';
    const sorted = [...fin].sort((a, b) => hi ? scoresBy[b][g] - scoresBy[a][g] : scoresBy[a][g] - scoresBy[b][g]);
    sorted.forEach((u, i) => {
      const prev = sorted[i - 1], tie = i > 0 && scoresBy[prev][g] === scoresBy[u][g];
      const rank = tie ? perGame[prev][g].rank : i + 1, points = Math.max(1, n - (rank - 1));
      perGame[u][g] = { score: scoresBy[u][g], rank, points }; total[u] += points;
    });
  }
  const order = [...fin].sort((a, b) => total[b] - total[a]); const dayRank = {};
  order.forEach((u, i) => { dayRank[u] = i > 0 && total[u] === total[order[i - 1]] ? dayRank[order[i - 1]] : i + 1; });
  const results = {}, reached = [];
  for (const p of P) {
    if (!fin.includes(p.id)) { results[p.id] = { id: p.id, played: false, rank: null, points: 0, perGame: {}, rolls: [], from: p.pos, landed: p.pos, to: p.pos, tile: 'normal' }; continue; }
    const dice = Math.max(1, n - (dayRank[p.id] - 1));
    const rolls = Array.from({ length: dice }, () => 1 + Math.floor(rng() * 6));
    const raw = p.pos + rolls.reduce((a, b) => a + b, 0), landed = Math.min(raw, size), { pos, tile } = applyTile(landed, size);
    if (pos >= size) reached.push({ id: p.id, raw });
    results[p.id] = { id: p.id, played: true, rank: dayRank[p.id], points: total[p.id], perGame: perGame[p.id], rolls, from: p.pos, landed, to: pos, tile };
  }
  let winners = null;
  if (reached.length) { const best = Math.max(...reached.map(r => r.raw)); winners = reached.filter(r => r.raw === best).map(r => r.id); }
  return { results, winners };
}

/* ============ Firebase: inloggen, kamers, scores en uitslag ============ */
const TZ = 'Europe/Amsterdam';
const QS = new URLSearchParams(location.search), DEBUG_MIN = Number(QS.get('debug')) || 0, DEBUG_TAG = QS.get('round') || 't1';
const fbApp = initializeApp(firebaseConfig), auth = getAuth(fbApp), db = getFirestore(fbApp);
if (QS.get('emulator') === '1' && location.hostname === 'localhost') { connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true }); connectFirestoreEmulator(db, 'localhost', 8080); }
const S = { profile: null, room: null, uid: null };
function save() {}
function makeCode() { const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; return Array.from({ length: 6 }, () => A[ri(A.length)]).join(''); }
const toast = msg => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; app.appendChild(t); setTimeout(() => t.remove(), 3500); };

/* ---- account en poppetje ---- */
async function bootAuth() {
  const user = await new Promise(res => { const un = onAuthStateChanged(auth, u => { un(); res(u); }); });
  if (!user) return false; S.uid = user.uid;
  const s = await getDoc(doc(db, 'users', user.uid)); if (!s.exists()) return false;
  const d = s.data(); S.profile = { name: d.name, look: d.avatar, roomIds: d.roomIds || [] }; return true;
}
async function createProfile(name, look) {
  const u = auth.currentUser || (await signInAnonymously(auth)).user; S.uid = u.uid;
  await setDoc(doc(db, 'users', u.uid), { name, avatar: look, roomIds: [], createdAt: serverTimestamp() });
  S.profile = { name, look: { ...look }, roomIds: [] };
}
async function updateLook(look) {
  await updateDoc(doc(db, 'users', S.uid), { avatar: look }); S.profile.look = look;
  await Promise.all(S.profile.roomIds.map(c => updateDoc(doc(db, 'rooms', c, 'players', S.uid), { avatar: look }).catch(() => {})));
}

/* ---- kamers ---- */
async function createRoom(size) {
  for (let i = 0; i < 6; i++) {
    const code = makeCode(), ref = doc(db, 'rooms', code); if ((await getDoc(ref)).exists()) continue;
    await setDoc(ref, { code, ownerId: S.uid, playerIds: [S.uid], boardSize: size, timezone: TZ, resultHour: 20, status: 'playing', createdAt: serverTimestamp() });
    await setDoc(doc(ref, 'players', S.uid), { uid: S.uid, name: S.profile.name, avatar: S.profile.look, color: PCOL[0].c, position: 0, totalPoints: 0, dayWins: 0 });
    await updateDoc(doc(db, 'users', S.uid), { roomIds: arrayUnion(code) }); S.profile.roomIds = [...S.profile.roomIds, code]; return code;
  }
  throw new Error('Kon geen kamer maken, probeer het nog eens.');
}
async function joinRoom(raw) {
  const code = raw.trim().toUpperCase(), ref = doc(db, 'rooms', code), snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Deze code bestaat niet.');
  let room = snap.data();
  if (!room.playerIds.includes(S.uid)) {
    if (room.playerIds.length >= 4) throw new Error('Deze kamer is vol.');
    await updateDoc(ref, { playerIds: arrayUnion(S.uid) }); room = (await getDoc(ref)).data();
    const idx = Math.max(0, room.playerIds.indexOf(S.uid));
    await setDoc(doc(ref, 'players', S.uid), { uid: S.uid, name: S.profile.name, avatar: S.profile.look, color: PCOL[idx % 4].c, position: 0, totalPoints: 0, dayWins: 0 });
  }
  if (!S.profile.roomIds.includes(code)) { await updateDoc(doc(db, 'users', S.uid), { roomIds: arrayUnion(code) }); S.profile.roomIds = [...S.profile.roomIds, code]; }
  return code;
}

/* ---- ronde en uitslag ---- */
async function getOrCreateRound(code, room) {
  const { roundId, revealAtMs } = roundInfo(Date.now(), room.timezone, room.resultHour), id = DEBUG_MIN ? roundId + DEBUG_TAG : roundId, ref = doc(db, 'rooms', code, 'days', id);
  if ((await getDoc(ref)).exists()) return id;
  const reveal = DEBUG_MIN ? Date.now() + DEBUG_MIN * 60000 : revealAtMs;
  try { await setDoc(ref, { status: 'open', games: pickGames(code + ':' + id), revealAt: Timestamp.fromMillis(reveal), createdAt: serverTimestamp() }); } catch (e) { /* iemand anders was ons voor */ }
  return id;
}
async function resolveDue(code) {
  const snap = await getDocs(query(collection(db, 'rooms', code, 'days'), where('status', '==', 'open')));
  const due = snap.docs.filter(d => d.data().revealAt.toMillis() <= Date.now()).map(d => d.id).sort();
  for (const id of due) { try { await resolveRound(code, id); } catch (e) { console.warn('resolveRound', e && e.code, e && e.message); break; } }
}
async function resolveRound(code, dayId) {
  const roomRef = doc(db, 'rooms', code), dayRef = doc(roomRef, 'days', dayId);
  await runTransaction(db, async tx => {
    const roomSnap = await tx.get(roomRef), daySnap = await tx.get(dayRef); if (!roomSnap.exists() || !daySnap.exists()) return;
    const room = roomSnap.data(), day = daySnap.data(); if (day.status !== 'open') return;
    const pRefs = room.playerIds.map(u => doc(roomRef, 'players', u)), pSnaps = await Promise.all(pRefs.map(r => tx.get(r))), raw = pSnaps.filter(s => s.exists()).map(s => s.data());
    // Scores worden hier per document in de transactie gelezen. Een lijst over een open verbinding krijgt van de server soms de tijd van het begin van die verbinding, waardoor "na het eindtijdstip" dan niet klopt.
    const sRefs = []; room.playerIds.forEach(u => day.games.forEach(g => sRefs.push(doc(dayRef, 'scores', u + '_' + g))));
    const sSnaps = await Promise.all(sRefs.map(r => tx.get(r)));
    const scoresBy = {}; sSnaps.filter(x => x.exists()).forEach(x => { const d = x.data(); (scoresBy[d.uid] = scoresBy[d.uid] || {})[d.gameId] = d.score; });
    const { results, winners } = computeRound({ players: raw.map(p => ({ id: p.uid, pos: p.position })), size: room.boardSize }, day.games, scoresBy);
    raw.forEach((p, i) => { const x = results[p.uid]; if (!x) return;
      tx.set(doc(dayRef, 'results', p.uid), { ...x, uid: p.uid, thrown: false });
      tx.update(pRefs[room.playerIds.indexOf(p.uid)], { position: x.to, totalPoints: (p.totalPoints || 0) + x.points, dayWins: (p.dayWins || 0) + (x.rank === 1 ? 1 : 0) }); });
    tx.update(dayRef, { status: 'resolved', resolvedAt: serverTimestamp() });
    tx.update(roomRef, { lastResolvedDay: dayId, ...(winners ? { status: 'finished', winnerIds: winners } : {}) });
  });
}

/* ---- live luisteren naar een kamer ---- */
let SUB = null;
function closeRoom() { if (!SUB) return; SUB.stop = true; SUB.un.forEach(f => { try { f(); } catch (e) {} }); clearInterval(SUB.iv); SUB = null; S.room = null; }
const seenKey = code => 'sd_seen_' + code;
const alias = uid => uid === S.uid ? 'me' : uid;
function dayLabel(id) { const d = new Date(id.slice(0, 10) + 'T12:00:00'); return isNaN(d) ? id : d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }); }

function openRoom(code) {
  closeRoom();
  return new Promise((resolve, reject) => {
    const rr = doc(db, 'rooms', code), sub = SUB = { stop: false, un: [], iv: 0, dayUn: [], resUn: null, resDay: null }, R = S.room = { code, size: 50, status: 'playing', winners: null, players: [], day: null, myScores: {}, lastResult: null, anim: null, pendingThrow: false, lastResolvedDay: null };
    let rawRoom = null, rawPlayers = null, gotDay = false, gotScores = false, done = false, sig = '', lastDay = null;
    const ready = () => { if (!done && rawRoom && rawPlayers && gotDay && gotScores) { done = true; resolve(R); } };
    const refresh = () => { if (done && view === 'room') go('room'); else if (done && view === 'day') go('day'); };
    const rebuild = () => {
      if (!rawRoom || !rawPlayers) return;
      const order = rawRoom.playerIds, list = rawPlayers.slice().sort((a, b) => order.indexOf(a.uid) - order.indexOf(b.uid)).map(p => ({ id: alias(p.uid), uid: p.uid, name: p.name, look: p.avatar, color: p.color, pos: p.position, pts: p.totalPoints, wins: p.dayWins }));
      list.sort((a, b) => (a.id === 'me' ? -1 : 0) - (b.id === 'me' ? -1 : 0)); R.players = list;
      const s2 = list.map(p => p.uid).join(',') + '|' + rawRoom.status + '|' + (rawRoom.lastResolvedDay || ''); const changed = s2 !== sig; sig = s2; if (changed) refresh();
    };
    sub.un.push(onSnapshot(rr, s => { if (!s.exists()) { reject(new Error('Deze kamer bestaat niet meer.')); return; } rawRoom = s.data(); R.size = rawRoom.boardSize; R.status = rawRoom.status; R.winners = rawRoom.winnerIds ? rawRoom.winnerIds.map(alias) : null; R.lastResolvedDay = rawRoom.lastResolvedDay || null; R.timezone = rawRoom.timezone;
      if (R.lastResolvedDay && sub.resDay !== R.lastResolvedDay) watchResults(R.lastResolvedDay); rebuild(); ready(); }, e => { console.warn(e); reject(e); }));
    sub.un.push(onSnapshot(collection(rr, 'players'), s => { rawPlayers = s.docs.map(d => d.data()); rebuild(); ready(); }, e => console.warn(e)));
    function watchResults(dayId) {
      if (sub.resUn) sub.resUn(); sub.resDay = dayId;
      sub.resUn = onSnapshot(collection(rr, 'days', dayId, 'results'), s => {
        const res = {}; s.docs.forEach(d => { const x = d.data(); res[alias(x.uid)] = { ...x, id: alias(x.uid) }; });
        R.lastResult = { dayId, label: dayLabel(dayId), results: res };
        const seen = (() => { try { return localStorage.getItem(seenKey(code)); } catch (e) { return null; } })(), mine = res.me;
        if (seen !== dayId && mine) { R.anim = res; R.pendingThrow = !!(mine.played && mine.rolls && mine.rolls.length && !mine.thrown); } else { R.anim = null; R.pendingThrow = false; if (!mine && seen !== dayId) markSeen(); }
        refresh();
      }, e => console.warn(e));
    }
    function watchDay(id) {
      sub.dayUn.forEach(f => f()); sub.dayUn = []; gotDay = gotScores = false; R.myScores = {};
      sub.dayUn.push(onSnapshot(doc(rr, 'days', id), s => { if (!s.exists()) return; const d = s.data(); R.day = { id, games: d.games, revealAt: d.revealAt.toMillis(), status: d.status }; gotDay = true; ready(); }));
      sub.dayUn.push(onSnapshot(query(collection(rr, 'days', id, 'scores'), where('uid', '==', S.uid)), s => { const m = {}; s.docs.forEach(d => { const x = d.data(); m[x.gameId] = x.score; }); R.myScores = { ...m, ...R.myScores }; gotScores = true; ready(); }));
    }
    const tick = async () => {
      if (sub.stop || !rawRoom || rawRoom.status !== 'playing') return;
      try { await resolveDue(code); const id = await getOrCreateRound(code, rawRoom); if (!sub.stop && id !== lastDay) { lastDay = id; watchDay(id); refresh(); } } catch (e) { console.warn(e); }
    };
    sub.tick = tick; const wait = setInterval(() => { if (rawRoom) { clearInterval(wait); tick(); sub.iv = setInterval(tick, 20000); } }, 100); sub.un.push(() => clearInterval(wait));
  });
}
function recordScore(g, score) {
  const r = S.room; if (!r || !r.day) return; r.myScores[g] = score;
  setDoc(doc(db, 'rooms', r.code, 'days', r.day.id, 'scores', S.uid + '_' + g), { uid: S.uid, gameId: g, score, submittedAt: serverTimestamp() }).catch(e => { console.warn(e); toast('Je score kon niet worden opgeslagen. Misschien was de ronde net afgelopen.'); });
}
function markSeen() { const r = S.room; if (!r || !r.lastResolvedDay) return; try { localStorage.setItem(seenKey(r.code), r.lastResolvedDay); } catch (e) {} r.anim = null; r.pendingThrow = false; }
function markThrown() { const r = S.room; if (!r || !r.lastResult) return; updateDoc(doc(db, 'rooms', r.code, 'days', r.lastResult.dayId, 'results', S.uid), { thrown: true }).catch(e => console.warn(e)); r.pendingThrow = false; if (r.lastResult.results.me) r.lastResult.results.me.thrown = true; }
async function enterRoom(code) {
  app.innerHTML = `<div class="screen" style="background:linear-gradient(#3fa6ea,#cfeaf6)"><div class="load">Kamer laden</div></div>`;
  try { await openRoom(code); go('room'); } catch (e) { console.warn(e); closeRoom(); go('home'); toast(e.message || 'Kamer openen mislukt.'); }
}
async function shareCode() {
  const r = S.room, text = `Doe mee met Summit Days! Code: ${r.code}`, url = location.href.split('?')[0];
  try { if (navigator.share) { await navigator.share({ text, url }); return; } } catch (e) { return; }
  try { await navigator.clipboard.writeText(text + ' ' + url); toast('Code gekopieerd'); } catch (e) { toast(text); }
}

/* ============ router ============ */
let cleanups = [], view = 'boot', viewArg = null;
function go(v, arg) { cleanups.forEach(f => { try { f(); } catch (e) {} }); cleanups = []; if (v === 'home') closeRoom(); view = v; viewArg = arg || null; VIEWS[v](); }
app.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (t && ACT[t.dataset.act]) ACT[t.dataset.act](t); });

/* ============ 3D poppetje (three.js) ============ */
const PCOL = [{ n: 'Blauw', c: '#2f7bff' }, { n: 'Rood', c: '#ff4a3d' }, { n: 'Groen', c: '#2fbf5a' }, { n: 'Geel', c: '#ffc21a' }];
const BLUE = PCOL[0].c;
const shade = (hex, f) => { const c = new THREE.Color(hex); c.multiplyScalar(f); c.r = Math.min(1, c.r); c.g = Math.min(1, c.g); c.b = Math.min(1, c.b); return '#' + c.getHexString(); };
const curColor = () => (S.room && S.room.players[0].color) || BLUE;

function faceTexture(look, expr) {
  const W = 1024, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const skin = SKIN[look.skin], hair = HAIRCOL[look.hairColor], dk = shade(skin, .74), ink = '#2a1d1a';
  const g0 = c.createRadialGradient(W * .25, H * .42, 10, W * .25, H * .5, 260); g0.addColorStop(0, shade(skin, 1.06)); g0.addColorStop(1, skin); c.fillStyle = skin; c.fillRect(0, 0, W, H); c.fillStyle = g0; c.fillRect(0, 0, W, H);
  const k = H / Math.PI, ox = W * .25, oy = H * .5, X = a => ox + a * k, Y = a => oy + a * k;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const ell = (x, y, rx, ry, f, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, 7); c.fillStyle = f; c.fill(); };
  let eyes = look.eyes, mouth = look.mouth, brows = look.brows;
  if (expr === 'happy') { eyes = 1; mouth = 2; brows = look.brows ? 1 : 0; }
  if (expr === 'meh') { eyes = 5; mouth = 3; brows = 1; }
  if (expr === 'sad') { eyes = 6; mouth = 5; brows = 4; }
  ell(X(-.6), Y(.2), .13 * k, .085 * k, 'rgba(255,100,125,.32)'); ell(X(.6), Y(.2), .13 * k, .085 * k, 'rgba(255,100,125,.32)');
  // neus
  if (look.nose === 0) ell(X(0), Y(.14), .045 * k, .04 * k, dk);
  if (look.nose === 1) { ell(X(0), Y(.15), .075 * k, .09 * k, dk); ell(X(-.02), Y(.11), .025 * k, .025 * k, 'rgba(255,255,255,.4)'); }
  if (look.nose === 2) { ell(X(-.03), Y(.16), .018 * k, .015 * k, dk); ell(X(.03), Y(.16), .018 * k, .015 * k, dk); }
  const IR = ['#3a2a1d', '#2f6bb0', '#3f8a4a', '#7a4a28', '#6a3fa0'][(look.hairColor + look.skin) % 5];
  for (const s of [-1, 1]) {
    const ex = X(.4 * s), ey = Y(-.04);
    if (eyes === 0) { ell(ex, ey, .11 * k, .15 * k, ink); ell(ex - .035 * k, ey - .05 * k, .04 * k, .045 * k, '#fff'); ell(ex + .035 * k, ey + .05 * k, .018 * k, .02 * k, '#fff'); }
    if (eyes === 1) { c.strokeStyle = ink; c.lineWidth = .06 * k; c.beginPath(); c.arc(ex, ey + .07 * k, .13 * k, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    if (eyes === 2) { ell(ex, ey, .15 * k, .18 * k, '#fff'); c.strokeStyle = 'rgba(40,30,20,.6)'; c.lineWidth = .014 * k; c.stroke(); ell(ex, ey + .01 * k, .1 * k, .13 * k, IR); ell(ex, ey + .01 * k, .055 * k, .075 * k, '#14100e'); ell(ex - .04 * k, ey - .05 * k, .035 * k, .04 * k, '#fff'); ell(ex + .03 * k, ey + .06 * k, .015 * k, .015 * k, '#fff'); }
    if (eyes === 3) { c.strokeStyle = ink; c.lineWidth = .055 * k; c.beginPath(); c.arc(ex, ey - .05 * k, .13 * k, Math.PI * .1, Math.PI * .9); c.stroke(); for (let i = 0; i < 3; i++) { const a = Math.PI * (.2 + i * .3); c.lineWidth = .02 * k; c.beginPath(); c.moveTo(ex + Math.cos(a) * .13 * k, ey - .05 * k + Math.sin(a) * .13 * k); c.lineTo(ex + Math.cos(a) * .2 * k, ey - .05 * k + Math.sin(a) * .2 * k); c.stroke(); } }
    if (eyes === 4) { ell(ex, ey, .14 * k, .17 * k, '#fff'); ell(ex, ey + .01 * k, .1 * k, .13 * k, IR); ell(ex, ey + .01 * k, .05 * k, .07 * k, '#14100e'); ell(ex - .04 * k, ey - .05 * k, .035 * k, .04 * k, '#fff'); c.strokeStyle = ink; c.lineWidth = .028 * k; for (let i = 0; i < 3; i++) { const a = -2.0 + i * .5; c.beginPath(); c.moveTo(ex + s * .12 * k * Math.cos(a + 2), ey - .12 * k); c.lineTo(ex + s * (.12 + .1) * k * Math.cos(a + 2) + s * .02 * k, ey - .2 * k + i * .02 * k); c.stroke(); } }
    if (eyes === 5) { ell(ex, ey, .12 * k, .1 * k, '#fff'); c.strokeStyle = ink; c.lineWidth = .014 * k; c.stroke(); ell(ex + .04 * k, ey, .06 * k, .07 * k, ink); c.fillStyle = skin; c.fillRect(ex - .15 * k, ey - .12 * k, .3 * k, .09 * k); c.strokeStyle = ink; c.lineWidth = .03 * k; c.beginPath(); c.moveTo(ex - .13 * k, ey - .03 * k); c.lineTo(ex + .13 * k, ey - .03 * k); c.stroke(); }
    if (eyes === 6) { ell(ex, ey, .13 * k, .16 * k, ink); ell(ex - .035 * k, ey - .05 * k, .05 * k, .055 * k, '#fff'); ell(ex + .03 * k, ey + .05 * k, .025 * k, .03 * k, '#fff'); ell(ex + s * .09 * k, ey + .2 * k, .03 * k, .05 * k, 'rgba(120,200,255,.9)'); }
    if (brows) { c.strokeStyle = hair; c.lineWidth = (brows === 3 ? .075 : .04) * k; const by = Y(-.36), bx = X(.4 * s); let inn = brows === 2 ? .07 : brows === 4 ? -.09 : 0; c.beginPath(); c.moveTo(bx - s * .14 * k, by + inn * k); c.lineTo(bx + s * .14 * k, by - inn * k); c.stroke(); }
  }
  const my = Y(.4); c.strokeStyle = ink; c.lineWidth = .045 * k;
  if (mouth === 0) { c.beginPath(); c.arc(X(0), my - .14 * k, .2 * k, Math.PI * .18, Math.PI * .82); c.stroke(); }
  if (mouth === 1) { ell(X(0), my, .15 * k, .12 * k, '#7a2e2e'); ell(X(0), my + .06 * k, .09 * k, .05 * k, '#ff8fa3'); }
  if (mouth === 2) { c.beginPath(); c.ellipse(X(0), my - .05 * k, .24 * k, .17 * k, 0, 0, Math.PI); c.closePath(); c.fillStyle = '#7a2e2e'; c.fill(); c.save(); c.clip(); ell(X(0), my + .1 * k, .13 * k, .07 * k, '#ff8fa3'); c.fillStyle = '#fff'; c.fillRect(X(-.24), my - .06 * k, .48 * k, .05 * k); c.restore(); c.lineWidth = .025 * k; c.beginPath(); c.ellipse(X(0), my - .05 * k, .24 * k, .17 * k, 0, 0, Math.PI); c.closePath(); c.stroke(); }
  if (mouth === 3) { c.beginPath(); c.moveTo(X(-.14), my); c.quadraticCurveTo(X(-.05), my - .03 * k, X(0), my); c.quadraticCurveTo(X(.05), my + .03 * k, X(.14), my); c.stroke(); }
  if (mouth === 4) { c.beginPath(); c.arc(X(0), my - .14 * k, .2 * k, Math.PI * .18, Math.PI * .82); c.stroke(); ell(X(.03), my + .1 * k, .075 * k, .1 * k, '#ff7d97'); }
  if (mouth === 5) { c.beginPath(); c.arc(X(0), my + .16 * k, .17 * k, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  if (look.accessory === 1) { c.strokeStyle = '#2a2f45'; c.lineWidth = .035 * k; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(X(.4 * s), Y(-.04), .21 * k, .19 * k, 0, 0, 7); c.fillStyle = 'rgba(200,235,255,.22)'; c.fill(); c.stroke(); } c.beginPath(); c.moveTo(X(-.19), Y(-.05)); c.lineTo(X(.19), Y(-.05)); c.stroke(); }
  if (look.accessory === 2) { for (const s of [-1, 1]) { c.beginPath(); c.ellipse(X(.4 * s), Y(-.02), .23 * k, .17 * k, 0, 0, 7); c.fillStyle = '#16192a'; c.fill(); ell(X(.4 * s - .06), Y(-.08), .07 * k, .03 * k, 'rgba(255,255,255,.35)'); } c.strokeStyle = '#16192a'; c.lineWidth = .04 * k; c.beginPath(); c.moveTo(X(-.17), Y(-.05)); c.lineTo(X(.17), Y(-.05)); c.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
}

function buildAvatar(look, colorHex, expr) {
  const T = THREE, g = new T.Group(), U = {};
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .5, metalness: 0 }, o || {}));
  const sk = M(SKIN[look.skin], { roughness: .6 }), col = M(colorHex, { roughness: .45 }), colD = M(shade(colorHex, .72), { roughness: .5 }), dk = M('#242a3a'), hairM = M(HAIRCOL[look.hairColor], { roughness: .8 }),
    gold = M('#ffcf3a', { roughness: .25, metalness: .6 }), white = M('#ffffff'), tan = M('#e8c985', { roughness: .9 }), red = M('#e8403a');
  const W = [.62, .76, .94][look.build];
  const add = (geo, mat, x, y, z, parent) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); (parent || g).add(m); m.castShadow = true; return m; };
  const S = (r, sx, sy, sz) => { const geo = new T.SphereGeometry(r, 24, 16); geo.scale(sx, sy, sz); return geo; };
  const O = look.outfit;
  // O: 0 polo, 1 hoodie, 2 colbert, 3 sportshirt, 4 jurk, 5 tuinbroek, 6 hawaii, 7 regenjas, 8 safarivest, 9 tanktop, 10 gestreept, 11 poncho, 12 trui met col, 13 schooluniform
  const shorts = [3, 9, 6].includes(O), skirt = O === 4, panCol = O === 5, wearDk = !shorts && !skirt && !panCol;
  for (const s of [-1, 1]) {
    const lx = s * (.2 + W * .22);
    if (skirt) add(new T.CylinderGeometry(.17, .17, .9, 14), sk, lx, .6, 0); else if (shorts) { add(new T.CylinderGeometry(.17, .17, .7, 14), sk, lx, .47, 0); add(new T.CylinderGeometry(.23, .23, .5, 14), O === 6 ? M('#2f7bd6') : col, lx, .98, 0); }
    else add(new T.CylinderGeometry(.17, .17, 1, 14), panCol ? colD : dk, lx, .6, 0);
    add(S(.34, 1, .55, 1.5), M(O === 3 || O === 13 ? '#f4f4f4' : '#2b2b2b'), lx, .17, .12);
  }
  add(S(1, W, .9, .62), O === 5 ? white : O === 10 ? white : col, 0, 1.9, 0);
  const front = (w, h, d, mat, x, y, z) => add(new T.BoxGeometry(w, h, d), mat, x, y, z);
  if (O === 0) { front(W * .9, .1, .1, dk, 0, 1.25, .37); front(.14, .12, .06, gold, 0, 1.25, .43); add(new T.ConeGeometry(.2, .3, 3), white, -.17, 2.68, .42).rotation.z = .5; add(new T.ConeGeometry(.2, .3, 3), white, .17, 2.68, .42).rotation.z = -.5; }
  if (O === 1) { const hd = add(new T.TorusGeometry(.4, .15, 10, 20), colD, 0, 2.7, -.08); hd.rotation.x = Math.PI / 2.4; front(W * .9, .36, .08, colD, 0, 1.65, .56); for (const s of [-1, 1]) add(new T.CylinderGeometry(.025, .025, .45, 6), white, s * .13, 2.45, .5); }
  if (O === 2) { for (const s of [-1, 1]) front(.06, 1.3, .05, white, s * .24, 2.0, .6); front(.5, .5, .04, white, 0, 2.5, .55); front(.1, .9, .05, red, 0, 2.0, .62); }
  if (O === 3) { front(W * 1.2, .2, .05, white, 0, 2.15, .6); front(.3, .3, .05, white, 0, 1.75, .6); }
  if (O === 4) { const sk2 = add(new T.ConeGeometry(.95 + W * .3, 1.3, 20, 1, true), col, 0, 1.0, 0); sk2.material = col.clone(); sk2.material.side = T.DoubleSide; front(W * 1.0, .1, .1, white, 0, 1.55, .38); }
  if (O === 5) { for (const s of [-1, 1]) front(.1, 1.0, .06, col, s * .35 * W / .76, 2.25, .58); front(W * 1.0, .75, .08, col, 0, 1.7, .56); front(.1, .1, .09, gold, -.3, 2.0, .6); front(.1, .1, .09, gold, .3, 2.0, .6); }
  if (O === 6) { for (let i = 0; i < 10; i++) { const a = -1 + i * .22; add(S(.12, 1, 1, .4), i % 2 ? white : gold, Math.sin(a) * W * .8, 1.6 + (i % 3) * .35, .55); } }
  if (O === 7) { const hd = add(new T.TorusGeometry(.45, .17, 10, 20), col, 0, 2.7, -.1); hd.rotation.x = Math.PI / 2.4; front(.04, 1.5, .08, dk, 0, 1.9, .62); for (let i = 0; i < 4; i++) add(new T.SphereGeometry(.06, 8, 6), gold, .1, 2.45 - i * .35, .63); }
  if (O === 8) { front(W * .5, .35, .08, tan, -W * .45, 2.1, .56); front(W * .5, .35, .08, tan, W * .45, 2.1, .56); front(W * .5, .35, .08, tan, -W * .45, 1.6, .58); front(W * .5, .35, .08, tan, W * .45, 1.6, .58); front(W * 1.4, .12, .1, M('#7b4f2d'), 0, 1.3, .38); }
  if (O === 10) for (let i = 0; i < 5; i++) front(W * 1.5 * (1 - Math.abs(i - 2) * .08), .12, .06, col, 0, 1.2 + i * .34, .6);
  if (O === 11) { const pc = add(new T.ConeGeometry(1.35 + W * .3, 1.6, 4, 1, true), col, 0, 2.0, 0); pc.rotation.y = Math.PI / 4; pc.material = col.clone(); pc.material.side = T.DoubleSide; add(new T.TorusGeometry(.38, .09, 8, 16), white, 0, 2.78, 0).rotation.x = Math.PI / 2; }
  if (O === 12) { add(new T.CylinderGeometry(.32, .38, .45, 16), col, 0, 2.75, 0); for (let i = -2; i <= 2; i++) front(.05, 1.3, .04, white, i * .16, 1.9, .6); }
  if (O === 13) { front(W * 1.2, .1, .08, red, 0, 2.55, .52); front(.1, .7, .06, red, 0, 2.2, .62); front(W * 1.3, .5, .05, M('#2f3a55'), 0, 1.45, .55); add(S(.14, 1, 1, .5), white, -.22, 2.68, .45); add(S(.14, 1, 1, .5), white, .22, 2.68, .45); }
  const sleeveS = O === 9 ? 0 : O === 6 || O === 3 || O === 0 || O === 10 || O === 13 ? .42 : .6;
  for (const s of [-1, 1]) {
    const pv = new T.Group(); pv.position.set(s * W * .98, 2.5, 0); g.add(pv);
    if (sleeveS) add(new T.CylinderGeometry(.17, .19, sleeveS, 14), O === 5 ? white : O === 10 ? white : col, 0, -sleeveS / 2, 0, pv);
    add(new T.CylinderGeometry(.12, .12, 1.0 - sleeveS, 12), sk, 0, -(sleeveS + 1.0) / 2, 0, pv);
    add(S(.2, 1, 1, 1), sk, 0, -1.08, 0, pv); pv.rotation.z = s * .18; U[s > 0 ? 'armR' : 'armL'] = pv;
  }
  const fs = [[1, 1.05, 1], [.92, 1.22, .95], [1.1, .98, 1.04]][look.face].map(v => v * 1.14);
  const headG = new T.Group(); headG.position.set(0, 3.7, 0); headG.scale.set(fs[0], fs[1], fs[2]); g.add(headG);
  const head = new T.Mesh(new T.SphereGeometry(.9, 48, 32), new T.MeshStandardMaterial({ map: faceTexture(look, expr), roughness: .6 })); head.castShadow = true; headG.add(head);
  for (const s of [-1, 1]) add(S(.17, .6, 1, .8), sk, s * .88, 0, 0, headG);
  const capGeo = (r, len) => new T.SphereGeometry(r, 36, 20, 0, Math.PI * 2, 0, Math.PI * len);
  const hs = look.hair, capHair = [0, 1, 2, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].includes(hs);
  if (capHair) { const cap = new T.Mesh(capGeo(hs === 20 ? .925 : .94, hs === 13 || hs === 20 ? .46 : .5), hairM); cap.rotation.x = -.5; cap.castShadow = true; headG.add(cap); }
  const H2 = (geo, x, y, z) => add(geo, hairM, x, y, z, headG);
  if (hs === 1) H2(S(1, .95, 1.15, .5), 0, -.35, -.5);
  if (hs === 2) H2(S(.34, 1, 1, 1), 0, .98, -.2);
  if (hs === 3) for (let i = 0; i < 22; i++) { const t = i / 21, p = t * 1.9, a = i * 2.4, d = new T.Vector3(Math.sin(p) * Math.cos(a), Math.cos(p), Math.sin(p) * Math.sin(a)); if (d.z > .5 && d.y < .75) continue; H2(S(.3, 1, 1, 1), d.x * .86, d.y * .86, d.z * .86); }
  if (hs === 5 || hs === 19) for (let i = 0; i < (hs === 5 ? 9 : 12); i++) { const p = .25 + (i % 3) * .4, a = 2.2 + i * (hs === 5 ? .75 : 1.3), d = new T.Vector3(Math.sin(p) * Math.cos(a), Math.cos(p), Math.sin(p) * Math.sin(a)); if (d.z > .45) continue; const m = H2(new T.ConeGeometry(hs === 5 ? .2 : .14, hs === 5 ? .6 : .45, 8), d.x * .95, d.y * .95, d.z * .95); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d); }
  if (hs === 6) H2(S(1.1, 1.05, 1, 1), 0, .3, -.4);
  if (hs === 7) for (const s of [-1, 1]) { H2(S(.3, 1, 1, 1), s * .98, .15, -.15); H2(new T.CylinderGeometry(.14, .08, .7, 10), s * 1.0, -.35, -.15); }
  if (hs === 8) { H2(S(1, .72, .6, .55), 0, -.1, -.45); for (const sd of [-1, 1]) H2(S(.26, .8, .65, .7), sd * .92, -.1, -.1); }
  if (hs === 9) { H2(S(.3, 1, 1, 1), 0, .25, -.95); H2(new T.CylinderGeometry(.16, .06, 1.1, 10), 0, -.35, -1.0); }
  if (hs === 10) { const q = H2(S(.5, 1, .62, 1.25), 0, .86, .42); q.rotation.x = .55; H2(S(.3, 1, .6, 1), 0, .78, .78); }
  if (hs === 11) for (const s of [-1, 1]) for (let i = 0; i < 4; i++) H2(S(.2 - i * .02, 1, 1, 1), s * .85, -.15 - i * .38, .2 - i * .03);
  if (hs === 12) { H2(S(1.05, .95, 1.6, .55), 0, -.9, -.5); for (const s of [-1, 1]) H2(S(.3, 1, 3.2, .8), s * .92, -.5, -.1); }
  if (hs === 13) H2(S(.62, 1, .3, .4), 0, .55, .72);
  if (hs === 14) { H2(S(1, .95, 1.4, .5), 0, -.55, -.5); H2(S(.72, .2, .34, 1), 0, .5, .72); for (const sd of [-1, 1]) H2(S(.3, 1, 2.2, .8), sd * .93, -.3, -.1); }
  if (hs === 15) { H2(S(1, .95, 1, .5), 0, -.45, -.5); for (const sd of [-1, 1]) { const fl = H2(S(.28, 1.4, .7, .7), sd * .95, -.5, -.1); fl.rotation.z = sd * .25; } }
  if (hs === 16) { H2(S(.26, 1, 1, 1), 0, .95, -.3); const t = H2(new T.ConeGeometry(.26, 1.1, 10), 0, 1.0, -.7); t.rotation.x = -2.2; }
  if (hs === 17) { const t = H2(S(.85, 1, .42, .9), -.25, .72, .4); t.rotation.z = .55; t.rotation.x = .3; }
  if (hs === 18) { H2(S(.3, 1, 1, 1), 0, .82, -.55); H2(S(.55, 1, .3, .5), 0, .5, .7); }
  if (hs === 21) H2(new T.CylinderGeometry(.62, .7, .45, 20), 0, .85, .05);
  if (hs === 22) for (let i = 0; i < 7; i++) { const a = -.9 + i * .3, d = new T.Vector3(0, Math.cos(a), Math.sin(a)).normalize(), m = H2(new T.ConeGeometry(.2, .5, 8), 0, d.y * .95, d.z * .95); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d); }
  if (hs === 23) { H2(S(.95, .6, 1, .9), 0, .35, -.3); }
  if (hs === 24) for (let i = 0; i < 16; i++) { const p = .2 + (i % 4) * .33, a = i * 2.4, d = new T.Vector3(Math.sin(p) * Math.cos(a), Math.cos(p), Math.sin(p) * Math.sin(a)); if (d.z > .55 && d.y < .8) continue; H2(S(.2, 1, 1, 1), d.x * .9, d.y * .9, d.z * .9); }
  const A = look.accessory;
  if (A === 3) { const cp = new T.Mesh(capGeo(.99, .5), col); cp.rotation.x = -.45; cp.castShadow = true; headG.add(cp); const br = add(new T.BoxGeometry(1.15, .07, .7), col, 0, .46, .98, headG); br.rotation.x = .12; }
  if (A === 4) { add(new T.CylinderGeometry(.55, .55, .28, 5), gold, 0, .98, 0, headG); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; add(new T.ConeGeometry(.14, .38, 6), gold, Math.cos(a) * .5, 1.27, Math.sin(a) * .5, headG); } }
  if (A === 5) { add(new T.ConeGeometry(.26, .55, 10), gold, -.3, 2.62, .5).rotation.z = -Math.PI / 2; add(new T.ConeGeometry(.26, .55, 10), gold, .3, 2.62, .5).rotation.z = Math.PI / 2; add(S(.12, 1, 1, 1), gold, 0, 2.62, .52); }
  if (A === 6) { add(new T.CylinderGeometry(.55, .58, .95, 24), col, 0, 1.4, 0, headG); add(new T.CylinderGeometry(.95, .95, .08, 28), col, 0, .96, 0, headG); add(new T.CylinderGeometry(.585, .585, .14, 24), dk, 0, 1.05, 0, headG); }
  if (A === 7) { const hb = add(new T.TorusGeometry(.95, .07, 8, 28, Math.PI), M('#2b2f3a'), 0, 0, 0, headG); hb.rotation.z = 0; hb.rotation.x = 0; hb.position.y = .05; hb.rotation.set(0, 0, 0); for (const s of [-1, 1]) add(S(.3, .5, 1, 1), col, s * .98, 0, 0, headG); }
  if (A === 8) { const bd = add(new T.TorusGeometry(.8, .1, 8, 28), col, 0, .5, 0, headG); bd.rotation.x = Math.PI / 2; bd.scale.set(1, 1, 1); for (const s of [-1, 1]) add(new T.ConeGeometry(.14, .4, 6), col, s * .15, .5, -.88, headG).rotation.x = -Math.PI / 2; }
  if (A === 9) { front(1.0, 1.2, .5, col, 0, 1.9, -.7); for (const s of [-1, 1]) front(.12, 1.1, .1, dk, s * .38, 2.0, .35); }
  if (A === 10) { const sc2 = add(new T.TorusGeometry(.5, .14, 8, 20), col, 0, 2.62, 0); sc2.rotation.x = Math.PI / 2; front(.2, .7, .1, col, .3, 2.2, .58); }
  if (A === 11) { const cp = add(new T.ConeGeometry(1.2, 2.2, 4, 1, true), red, 0, 1.8, -.58); cp.rotation.set(-.15, Math.PI / 4, 0); cp.scale.z = .35; cp.material = red.clone(); cp.material.side = T.DoubleSide; }
  if (A === 12) for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; add(S(.13, 1, 1, 1), M(HCOL[i % 8]), Math.cos(a) * .55, 2.55 + Math.sin(a) * .04, Math.sin(a) * .42); }
  if (A === 13) { add(new T.CylinderGeometry(1.5, 1.5, .08, 28), tan, 0, .78, 0, headG); add(new T.CylinderGeometry(.62, .66, .48, 20), tan, 0, 1.02, 0, headG); add(new T.CylinderGeometry(.665, .665, .1, 20), col, 0, .88, 0, headG); }
  g.userData = U; return g;
}
function disposeObj(o) { o.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) { [].concat(n.material).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } }); }

let SNAP = null;
function snapEnv() {
  if (SNAP) return SNAP;
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setClearColor(0x000000, 0);
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x9aa8b8, .95)); const d = new THREE.DirectionalLight(0xffffff, .85); d.position.set(3, 6, 8); sc.add(d);
  return SNAP = { r, sc, cam: new THREE.PerspectiveCamera(30, 1, .1, 100) };
}
const snapCache = {};
function snap(look, color, o = {}) {
  const mode = o.mode || 'bust', size = o.size || 128, yaw = o.yaw || 0, key = JSON.stringify([look, color, mode, size, yaw, o.expr || '']);
  if (!o.nocache && snapCache[key]) return snapCache[key];
  try {
    const { r, sc, cam } = snapEnv(), av = buildAvatar(look, color, o.expr); av.rotation.y = yaw; sc.add(av);
    const P = { full: [2.2, 10.5], bust: [3.3, 7.6], head: [3.8, 5.3] }[mode]; cam.position.set(0, P[0], P[1]); cam.lookAt(0, P[0], 0);
    r.setSize(size, size, false); r.render(sc, cam); const url = r.domElement.toDataURL('image/png'); sc.remove(av); disposeObj(av);
    if (!o.nocache) { if (Object.keys(snapCache).length > 500) delete snapCache[Object.keys(snapCache)[0]]; snapCache[key] = url; }
    return url;
  } catch (e) { console.warn(e); return ''; }
}
function avatarSVG(a, size = 64, color) { return `<img class="av" alt="" width="${size}" height="${size}" src="${snap(a, color || BLUE, { mode: 'bust', size: Math.min(256, Math.max(96, size * 2)), yaw: .2 })}">`; }
const imgCache = {};
function avImg(look) { const c = curColor(), k = JSON.stringify([look, c]); if (!imgCache[k]) { const i = new Image(); i.src = snap(look, c, { mode: 'bust', size: 256 }); imgCache[k] = i; } return imgCache[k]; }

const THUMB = { skin: null, hairColor: null, face: 'head', hair: 'head', brows: 'head', eyes: 'head', nose: 'head', mouth: 'head', accessory: 'bust', outfit: 'bust', build: 'full' };
function mountEditor(host, look, onChange, color) {
  let tab = 'skin', yaw = .45;
  const draw = () => {
    const oldTabs = host.querySelector('.tabs'), keepX = oldTabs ? oldTabs.scrollLeft : 0;
    const n = COUNTS[tab], sw = { skin: SKIN, hairColor: HAIRCOL }[tab];
    const opts = Array.from({ length: n }, (_, i) => {
      const inner = sw ? `<span class="dot" style="background:${sw[i]}"></span>` : `<img class="av" alt="" width="54" height="54" src="${snap({ ...look, [tab]: i }, color, { mode: THUMB[tab], size: 128 })}">${NAMES[tab] ? `<span class="cap">${NAMES[tab][i]}</span>` : ''}`;
      return `<button class="opt ${look[tab] === i ? 'on' : ''}" data-i="${i}" aria-label="${TABS.find(t => t[0] === tab)[1]} ${i + 1}">${inner}</button>`;
    }).join('');
    host.innerHTML = `<div class="prev" id="pv"><img id="pimg" alt="Jouw poppetje" draggable="false"></div><div class="muted" style="text-align:center;font-size:12px;margin-bottom:2px">Sleep over het poppetje om te draaien</div>
      <button class="dobbel" data-r>Dobbel een poppetje</button><div class="tabs">${TABS.map(t => `<button class="tab ${t[0] === tab ? 'on' : ''}" data-t="${t[0]}">${t[1]}</button>`).join('')}</div><div class="opts">${opts}</div>`;
    const newTabs = host.querySelector('.tabs'); newTabs.scrollLeft = keepX;
    const img = $('#pimg', host), render = () => img.src = snap(look, color, { mode: 'full', size: 440, yaw, nocache: true });
    render(); let drag = null; const pv = $('#pv', host);
    pv.onpointerdown = e => { drag = e.clientX; pv.setPointerCapture(e.pointerId); };
    pv.onpointermove = e => { if (drag === null) return; yaw += (e.clientX - drag) * .02; drag = e.clientX; render(); };
    pv.onpointerup = pv.onpointercancel = () => drag = null;
    host.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    host.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { look[tab] = +b.dataset.i; onChange && onChange(look); draw(); });
    host.querySelector('[data-r]').onclick = () => { Object.assign(look, randomLook()); onChange && onChange(look); draw(); };
  };
  draw();
}

/* ============ schermen ============ */
const ACT = {};
const VIEWS = {};

VIEWS.onboarding = () => {
  const look = defaultLook();
  app.innerHTML = `<div class="screen cape" style="background:linear-gradient(180deg,#46aeee,#e6f7ff)"><div class="center" style="position:relative;z-index:1;gap:14px">
    <h1 style="font-size:40px">Hoe heet je?</h1><input class="txt" id="nm" maxlength="14" placeholder="Je naam" autocomplete="off" style="text-align:center;max-width:320px">
    <button class="btn" id="nx" style="max-width:320px" disabled>Verder</button></div></div>`;
  const nm = $('#nm'), nx = $('#nx'); nm.oninput = () => nx.disabled = nm.value.trim().length < 1;
  const step2 = name => {
    app.innerHTML = `<div class="screen cape" style="background:linear-gradient(180deg,#8fd4f7,#e6f7ff)"><div class="pad-body"><h1>Maak je poppetje, ${esc(name)}</h1><div id="ed"></div>
      <button class="btn" id="ok" style="margin-top:16px">Dit ben ik</button></div></div>`;
    mountEditor($('#ed'), look, null, BLUE);
    $('#ok').onclick = async () => { const b = $('#ok'); b.disabled = true; try { await createProfile(name, { ...look }); go('home'); } catch (e) { console.warn(e); b.disabled = false; toast('Opslaan mislukt. Controleer je verbinding en probeer het nog eens.'); } };
  };
  nx.onclick = () => { const name = nm.value.trim(); if (name && name.length <= 14) step2(name); };
  nm.onkeydown = e => { if (e.key === 'Enter' && !nx.disabled) nx.click(); };
};

VIEWS.home = () => {
  app.innerHTML = `<div class="screen cape" style="background:linear-gradient(180deg,#8fd4f7,#e6f7ff)"><div class="pad-body">
    <button class="hi" data-act="editlook"><span>${avatarSVG(S.profile.look, 72, BLUE)}</span><span><h1>Hoi ${esc(S.profile.name)}</h1><span class="muted" style="font-size:13px">Tik om je uiterlijk aan te passen</span></span></button>
    <h2>Jouw kamers</h2><div id="rooms" class="muted">Kamers laden</div>
    <h2>Nieuwe kamer</h2>
    <div class="muted" style="font-size:13px;margin-bottom:6px">Aantal vakjes</div>
    <div class="row" id="sz">${[30, 50, 100].map(n => `<button class="chip ${n === 50 ? 'on' : ''}" data-v="${n}">${n}</button>`).join('')}</div>
    <p class="muted" style="font-size:13px;margin:12px 0 0">Je begint alleen. Vrienden komen in je speelveld zodra ze met jouw code meedoen.</p>
    <div id="e1" class="muted" style="color:var(--bad);font-size:13px"></div>
    <button class="btn" style="margin-top:14px" id="mk">Kamer maken</button>
    <h2>Meedoen met een code</h2>
    <input class="txt code" id="cd" maxlength="6" placeholder="CODE" autocomplete="off">
    <div id="e2" class="muted" style="color:var(--bad);font-size:13px"></div>
    <button class="btn blue" id="join" style="margin-top:10px" disabled>Meedoen</button>
  </div></div>`;
  let size = 50, alive = true; cleanups.push(() => alive = false);
  $('#sz').querySelectorAll('.chip').forEach(b => b.onclick = () => { size = +b.dataset.v; $('#sz').querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); });
  Promise.all(S.profile.roomIds.map(c => getDoc(doc(db, 'rooms', c)).catch(() => null))).then(snaps => {
    if (!alive) return; const rooms = snaps.filter(s => s && s.exists()).map(s => s.data());
    $('#rooms').innerHTML = rooms.length ? rooms.map(r => `<button class="card roomcard" data-act="openroom" data-code="${r.code}"><span><span class="c">${r.code}</span><br><span class="muted" style="font-size:13px">${r.boardSize} vakjes, ${r.playerIds.length} ${r.playerIds.length === 1 ? 'speler' : 'spelers'}${r.status === 'finished' ? ', afgelopen' : ''}</span></span><span style="font-size:26px">›</span></button>`).join('') : 'Je zit nog in geen kamer.';
  });
  $('#mk').onclick = async () => { const b = $('#mk'); b.disabled = true; $('#e1').textContent = ''; try { enterRoom(await createRoom(size)); } catch (e) { console.warn(e); b.disabled = false; $('#e1').textContent = e.message || 'Mislukt, probeer het nog eens.'; } };
  const cd = $('#cd'); cd.oninput = () => { cd.value = cd.value.toUpperCase(); $('#join').disabled = cd.value.length < 6; };
  $('#join').onclick = async () => { const b = $('#join'); b.disabled = true; $('#e2').textContent = ''; try { enterRoom(await joinRoom(cd.value)); } catch (e) { console.warn(e); b.disabled = false; $('#e2').textContent = e.message || 'Meedoen mislukt.'; } };
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
ACT.editlook = () => go('look');
ACT.openroom = t => enterRoom(t.dataset.code);
ACT.share = () => shareCode();
ACT.home = () => go('home');
VIEWS.look = () => {
  const look = { ...S.profile.look };
  app.innerHTML = `<div class="screen cape" style="background:linear-gradient(180deg,#8fd4f7,#e6f7ff)"><div class="pad-body">
    <h1>${esc(S.profile.name)}</h1><div id="ed"></div>
    <button class="btn" id="sv" style="margin-top:16px">Opslaan</button></div></div>`;
  mountEditor($('#ed'), look, null, BLUE);
  $('#sv').onclick = async () => { const b = $('#sv'); b.disabled = true; try { await updateLook(look); go('home'); } catch (e) { console.warn(e); b.disabled = false; toast('Opslaan mislukt, probeer het nog eens.'); } };
};

/* ---- 3D wereld: Kaapstad met de Tafelberg ---- */
const TH0 = Math.PI / 2, AX = 1.5, AZ = .8;
const clamp01 = x => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const gauss = (x, z, cx, cz, h, s) => h * Math.exp(-(((x - cx) ** 2 + (z - cz) ** 2) / (s * s)));
function pathPoints(size) {
  const P = []; let th = TH0;
  for (let i = 0; i <= size; i++) {
    const s = i / size, r = 62 - 40 * s, x = AX * r * Math.cos(th), z = AZ * r * Math.sin(th); P.push({ i, r, th, x, z, y: .5 + 26.3 * Math.min(1, s / .9) });
    const r2 = 62 - 40 * (i + 1) / size; let t2 = th; for (let k = 0; k < 600; k++) { t2 += .004; if (Math.hypot(AX * r2 * Math.cos(t2) - x, AZ * r2 * Math.sin(t2) - z) >= 4.1) break; } th = t2;
  }
  P.forEach((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(size, i + 1)], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1; p.tx = dx / L; p.tz = dz / L; });
  return P;
}

function baseH(x, z) {
  const r0 = Math.hypot(x / AX, z / AZ), rc = Math.hypot(x, z), ang = Math.atan2(z, x);
  const cliff = smooth(.35, .7, clamp01((62 - r0) / 36));
  const r = r0 + cliff * (Math.sin(ang * 41) * 1.2 + Math.sin(ang * 23 + 1.3) * 1.6 + Math.sin(ang * 9) * 1.5);
  const ts = clamp01((62 - r) / 36);
  let h = ts < .5 ? .34 * (ts / .5) : .34 + .66 * smooth(0, 1, (ts - .5) / .5);
  h *= 26.8;
  h += cliff * .55 * Math.sin(h * 1.9);                 // lagen zandsteen
  if (r0 >= 62) h = .3 + .35 * Math.sin(x * .09) * Math.sin(z * .08);
  if (rc > 100) h = Math.min(h, .3 - (rc - 100) * .22);
  h = Math.max(h, -5);
  const peaks = Math.max(gauss(x, z, -128, 14, 24, 15), gauss(x, z, 126, 8, 20, 16), gauss(x, z, -96, -14, 11, 16), gauss(x, z, 98, -10, 9, 14), gauss(x, z, 0, -110, 10, 30));
  return Math.max(h, peaks - 1);
}

function tileTex(kind, i, size) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  const bg = { normal: ['#efe3c0', '#d6c691'], bonus: ['#ffe08a', '#f2b632'], trap: ['#ff9a86', '#e8503a'], shortcut: ['#9af0c6', '#2fbf8a'], finish: ['#ffe08a', '#f2b632'] }[kind];
  const gr = c.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]);
  c.fillStyle = gr; c.fillRect(0, 0, 128, 128); c.strokeStyle = 'rgba(80,60,30,.35)'; c.lineWidth = 6; c.strokeRect(5, 5, 118, 118);
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.strokeRect(12, 12, 104, 104);
  c.fillStyle = '#22304a'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const sym = { bonus: '★', trap: '✖', shortcut: '▲', finish: '⚑' }[kind];
  c.font = '800 ' + (sym ? 66 : 54) + 'px Nunito,Arial,sans-serif'; c.fillText(sym || String(i), 64, sym ? 62 : 66);
  if (sym) { c.font = '800 20px Nunito,Arial,sans-serif'; c.fillText(i, 64, 108); }
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
}

function buildWorld(size) {
  const T = THREE, scene = new T.Scene(); scene.fog = new T.Fog(0xcfeaf6, 170, 560);
  scene.add(new T.HemisphereLight(0xe3f4ff, 0x8a9a62, .6));
  const sun = new T.DirectionalLight(0xfff1d2, .8); sun.position.set(90, 130, 70); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -135, right: 135, top: 135, bottom: -135, near: 10, far: 420 }); sun.shadow.bias = -.0006; scene.add(sun);
  const P = pathPoints(size);
  const rnd = mulberry32(777), R = (a, b) => a + rnd() * (b - a);

  // ----- terrein
  const upd = [];
  const S = 300, N = 220, cell = S / N, geo = new T.PlaneGeometry(S, S, N, N); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cnt = pos.count, best = new Float32Array(cnt).fill(99), yp = new Float32Array(cnt);
  for (let j = 0; j < P.length - 1; j++) for (let s = 0; s < 8; s++) {
    const u = s / 8, th = P[j].th + (P[j + 1].th - P[j].th) * u, r = P[j].r + (P[j + 1].r - P[j].r) * u, y = P[j].y + (P[j + 1].y - P[j].y) * u, x = r * Math.cos(th), z = r * Math.sin(th);
    const ix = Math.round((x + S / 2) / cell), iz = Math.round((z + S / 2) / cell);
    for (let a = iz - 5; a <= iz + 5; a++) for (let b = ix - 5; b <= ix + 5; b++) { if (a < 0 || b < 0 || a > N || b > N) continue; const v = a * (N + 1) + b, d = Math.hypot(pos.getX(v) - x, pos.getZ(v) - z); if (d < best[v]) { best[v] = d; yp[v] = y; } }
  }
  const Hh = new Float32Array(cnt);
  for (let v = 0; v < cnt; v++) { let h = baseH(pos.getX(v), pos.getZ(v)); const w = 1 - smooth(3.0, 6.2, best[v]); h = h * (1 - w) + yp[v] * w; Hh[v] = h; pos.setY(v, h); }
  geo.computeVertexNormals();
  const nor = geo.attributes.normal, colA = new Float32Array(cnt * 3), C = new T.Color();
  const pal = { sand: new T.Color('#f2e4b8'), sand2: new T.Color('#e6cf96'), g1: new T.Color('#86cf62'), g2: new T.Color('#5eaa48'), g3: new T.Color('#a6c86a'), r1: new T.Color('#c58e5f'), r2: new T.Color('#9d7a62'), r3: new T.Color('#d8b184'), path: new T.Color('#d3b87f'), deep: new T.Color('#2a93aa'), shal: new T.Color('#9fe0d6'), plat: new T.Color('#86a04c') };
  for (let v = 0; v < cnt; v++) {
    const x = pos.getX(v), z = pos.getZ(v), y = Hh[v], slope = 1 - nor.getY(v), n = .5 + .5 * Math.sin(x * .37) * Math.sin(z * .31), ang = Math.atan2(z, x), w = 1 - smooth(3.0, 6.2, best[v]), r = Math.hypot(x / AX, z / AZ), rc = Math.hypot(x, z);
    if (y < -.75) C.copy(pal.shal).lerp(pal.deep, clamp01((-.75 - y) / 4));
    else if (y < .55 && rc > 97) C.copy(pal.sand).lerp(pal.sand2, n);
    else if (slope > .38 && y > 1.5) { C.copy(pal.r1).lerp(pal.r2, .5 + .5 * Math.sin(ang * 37 + y * .35)).lerp(pal.r3, .5 + .5 * Math.sin(y * 1.9 + ang * 5) * .6); }
    else if (y > 26 && r < 30) C.copy(pal.plat).lerp(pal.g3, n);
    else C.copy(pal.g1).lerp(pal.g2, n * .8 + clamp01(y / 30) * .0).lerp(pal.g3, clamp01((y - 8) / 18) * .6);
    if (w > .85) C.lerp(pal.path, (w - .85) / .15 * .7);
    colA[v * 3] = C.r; colA[v * 3 + 1] = C.g; colA[v * 3 + 2] = C.b;
  }
  geo.setAttribute('color', new T.BufferAttribute(colA, 3));
  const terrain = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); terrain.receiveShadow = true; scene.add(terrain);
  const terrainH = (x, z) => { const fx = (x + S / 2) / cell, fz = (z + S / 2) / cell, ix = Math.floor(fx), iz = Math.floor(fz); if (ix < 0 || iz < 0 || ix >= N || iz >= N) return -3; const tx = fx - ix, tz = fz - iz, g = (a, b) => Hh[(iz + b) * (N + 1) + ix + a]; return (g(0, 0) * (1 - tx) + g(1, 0) * tx) * (1 - tz) + (g(0, 1) * (1 - tx) + g(1, 1) * tx) * tz; };
  const shelfD = (x, z) => { const ix = Math.round((x + S / 2) / cell), iz = Math.round((z + S / 2) / cell); return (ix < 0 || iz < 0 || ix > N || iz > N) ? 99 : best[iz * (N + 1) + ix]; };

  // ----- zee
  const sea = new T.Mesh(new T.PlaneGeometry(1400, 1400), new T.MeshPhongMaterial({ color: 0x19b4d6, transparent: true, opacity: .8, shininess: 100, specular: 0xbfefff })); sea.rotation.x = -Math.PI / 2; sea.position.y = -.9; scene.add(sea);
  const deep = new T.Mesh(new T.PlaneGeometry(1400, 1400), new T.MeshBasicMaterial({ color: 0x1479a8 })); deep.rotation.x = -Math.PI / 2; deep.position.y = -6; scene.add(deep);

  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o || {}));
  const put = (m, x, z, dy = 0) => { m.position.set(x, terrainH(x, z) + dy, z); m.castShadow = true; scene.add(m); return m; };
  const box = (w, h, d, mat) => new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  
  // ----- tegels
  const tileMats = {};
  for (let i = 1; i <= size; i++) {
    const k = tileKind(i, size), p = P[i];
    if (!tileMats[k]) tileMats[k] = M({ normal: '#cdb98a', bonus: '#b9861a', trap: '#a93624', shortcut: '#35a070', finish: '#b9861a' }[k]);
    const top = new T.MeshStandardMaterial({ map: tileTex(k, i, size), roughness: .6 }), side = tileMats[k];
    const m = new T.Mesh(new T.BoxGeometry(3.8, 1, 3.8), [side, side, top, side, side, side]); m.position.set(p.x, p.y + .15, p.z); m.rotation.y = Math.atan2(-p.tz, p.tx); m.castShadow = m.receiveShadow = true; scene.add(m);
  }
  { const p = P[0], st = new T.Mesh(new T.CylinderGeometry(3.4, 3.8, .7, 24), M('#e8cf93')); st.position.set(p.x, p.y + .05, p.z); st.receiveShadow = st.castShadow = true; scene.add(st);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.font = '800 44px Nunito,Arial'; c.textAlign = 'center'; c.fillText('START', 128, 48);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), transparent: true })); sp.scale.set(5, 1.25, 1); sp.position.set(p.x, p.y + 2.2, p.z); scene.add(sp); }

  // ----- top: hut, vlag en de tafelkleed wolk
  const sum = new T.Group(); sum.position.set(0, 26.8, 0); scene.add(sum);
  const sadd = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; sum.add(m); return m; };
  sadd(new T.CylinderGeometry(4, 4.4, 3, 24), M('#f4ead2'), 0, 1.5, 0); sadd(new T.ConeGeometry(5.2, 3.2, 24), M('#ffcf3a', { roughness: .25, metalness: .7, emissive: 0x6b4300, emissiveIntensity: .4 }), 0, 4.6, 0); sadd(new T.BoxGeometry(1.3, 2, .3), M('#7b4f2d'), 0, 1, 4.1);
  sadd(new T.CylinderGeometry(.12, .12, 9, 8), M('#7b4f2d'), 7, 4.5, 0); const flag = sadd(new T.BoxGeometry(3.4, 1.8, .1), M('#ff6f59'), 8.8, 8, 0);
  const goldM = M('#ffcf3a', { roughness: .2, metalness: .8, emissive: 0x8a5a00, emissiveIntensity: .5 });
  const trophy = new T.Group(); trophy.position.set(0, 6.4, 0); sum.add(trophy);
  const tcup = new T.Mesh(new T.CylinderGeometry(1.5, .7, 2, 20), goldM); tcup.position.y = 1.9; trophy.add(tcup); const tst = new T.Mesh(new T.CylinderGeometry(.25, .25, 1, 10), goldM); tst.position.y = .5; trophy.add(tst); const tbs = new T.Mesh(new T.CylinderGeometry(1, 1.2, .5, 16), goldM); tbs.position.y = 0; trophy.add(tbs);
  for (const sd of [-1, 1]) { const hd = new T.Mesh(new T.TorusGeometry(.7, .14, 8, 16), goldM); hd.position.set(sd * 1.55, 2.1, 0); trophy.add(hd); }
  const halo = new T.Mesh(new T.TorusGeometry(3.2, .18, 8, 40), goldM); halo.rotation.x = Math.PI / 2; halo.position.y = 5.2; sum.add(halo);
  const gl = new T.PointLight(0xffd24a, .45, 40); gl.position.set(0, 10, 0); sum.add(gl);
  const sparks = []; for (let i = 0; i < 16; i++) { const sp = new T.Mesh(new T.OctahedronGeometry(.28), goldM); sp.userData.a = i / 16 * 6.28; sp.userData.h = 3 + (i % 4) * 2.2; sum.add(sp); sparks.push(sp); }
  upd.push(t => { trophy.rotation.y = t * .8; halo.rotation.z = t * .5; halo.position.y = 5.2 + Math.sin(t * 1.5) * .3; sparks.forEach((sp, i) => { const a = sp.userData.a + t * .7; sp.position.set(Math.cos(a) * 6.5, sp.userData.h + 3 + Math.sin(t * 2 + i) * .6, Math.sin(a) * 6.5); sp.rotation.y = t * 2; }); });
  const cloth = new T.Group(); scene.add(cloth); const cm = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .93 });
  const aEnd = P[size].th, angDiff = a => Math.abs(((a - aEnd) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
  for (let i = 0; i < 44; i++) {   // de wolk hangt over de rand, maar nooit boven de laatste vakjes en de top
    const a = i / 44 * Math.PI * 2 + R(-.04, .04); if (angDiff(a) < 1.25) continue;
    const rr = 25 + R(0, 6), m = new T.Mesh(new T.SphereGeometry(R(3.2, 5.8), 16, 12), cm); m.scale.set(1.3, .5, 1.3); m.position.set(AX * rr * Math.cos(a), 31 + R(-1, 1.5), AZ * rr * Math.sin(a)); m.userData.y0 = m.position.y; cloth.add(m);
  }

  // ----- kabelbaan
  const phi = 2.9, Bp = new T.Vector3(AX * 66 * Math.cos(phi), 9, AZ * 66 * Math.sin(phi)), Tp = new T.Vector3(AX * 24 * Math.cos(phi), 33.5, AZ * 24 * Math.sin(phi));
  const cable = (a, b, r, mat) => { const d = b.clone().sub(a), m = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 6), mat); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); scene.add(m); return m; };
  const side = new T.Vector3(-Math.sin(phi), 0, Math.cos(phi)).multiplyScalar(.9), steel = M('#3b4252', { roughness: .4, metalness: .5 });
  cable(Bp.clone().add(side), Tp.clone().add(side), .09, steel); cable(Bp.clone().sub(side), Tp.clone().sub(side), .09, steel);
  const st1 = new T.Group(), st2 = new T.Group();
  [[st1, Bp, 8], [st2, Tp, 3.5]].forEach(([g, p, h]) => { g.position.set(p.x, terrainH(p.x, p.z), p.z); g.rotation.y = -phi; scene.add(g);
    const b = new T.Mesh(new T.BoxGeometry(6, h, 4), M('#f4f4f6')); b.position.y = h / 2; b.castShadow = true; g.add(b); const rf = new T.Mesh(new T.BoxGeometry(6.6, .5, 4.6), M('#e8503a')); rf.position.y = h + .25; g.add(rf); });
  const tw = new T.Mesh(new T.CylinderGeometry(.4, .6, Bp.y - terrainH(Bp.x, Bp.z) + 1, 8), steel); tw.position.set(Bp.x, (Bp.y + terrainH(Bp.x, Bp.z)) / 2, Bp.z); scene.add(tw);
  const cabin = new T.Group(); { const body = new T.Mesh(new T.BoxGeometry(2.6, 1.7, 1.9), M('#f4f4f6')); body.castShadow = true; cabin.add(body);
    const win = new T.Mesh(new T.BoxGeometry(2.7, .8, 1.95), M('#4a90c8', { roughness: .1, metalness: .3 })); win.position.y = .1; cabin.add(win);
    const rf = new T.Mesh(new T.BoxGeometry(2.8, .25, 2.1), M('#e8503a')); rf.position.y = .95; cabin.add(rf); const ar = new T.Mesh(new T.CylinderGeometry(.08, .08, 1.4, 6), steel); ar.position.y = 1.7; cabin.add(ar); }
  scene.add(cabin); const cabin2 = cabin.clone(); scene.add(cabin2);
  upd.push((t) => { const u = .5 + .5 * Math.sin(t * .13); cabin.position.lerpVectors(Bp, Tp, u).add(new T.Vector3(0, -2.5, 0)); cabin.position.add(side); cabin2.position.lerpVectors(Bp, Tp, 1 - u).add(new T.Vector3(0, -2.5, 0)).sub(side); });

  // ----- Bo-Kaap: kleurige huisjes aan de rechterkant van de start
  const hc = ['#ff4f8b', '#ffc21a', '#35c4d9', '#7bdc5a', '#ff8a3d', '#9b6bff', '#ff6f59', '#4fa3ff'];
  for (let a = 0; a < 7; a++) for (let b = 0; b < 4; b++) {
    const x = 16 + a * 8.5 + R(-1, 1), z = 60 + b * 8 + R(-1, 1); if (Math.hypot(x / AX, z / AZ) < 66 || Math.hypot(x, z) > 98 || shelfD(x, z) < 8) continue;
    const h = R(3, 5.2), g = new T.Group(), body = box(5, h, 5, M(hc[ri2(8)])); body.position.y = h / 2; body.castShadow = true; g.add(body);
    const roof = box(5.5, .5, 5.5, M('#f4f4f4')); roof.position.y = h + .25; g.add(roof);
    for (const s of [-1, 1]) { const w = box(.9, 1.2, .1, M('#ffffff')); w.position.set(s * 1.3, h * .6, 2.53); g.add(w); }
    const dr = box(1, 1.6, .1, M('#7b4f2d')); dr.position.set(0, .8, 2.53); g.add(dr);
    g.position.set(x, terrainH(x, z), z); g.rotation.y = R(-.1, .1); scene.add(g);
  }
  // ----- Cape Wheel
  { const wg = new T.Group(), wx = -2 + 62 * 0, x = 52, z = 70; wg.position.set(x, terrainH(x, z) + 7.5, z); scene.add(wg);
    const ring = new T.Mesh(new T.TorusGeometry(6, .22, 8, 40), M('#ffffff')); wg.add(ring); const ring2 = ring.clone(); ring2.scale.set(.6, .6, 1); wg.add(ring2);
    const hub = new T.Group(); wg.add(hub);
    for (let i = 0; i < 8; i++) { const sp = new T.Mesh(new T.CylinderGeometry(.07, .07, 12, 5), M('#e8ecf2')); sp.rotation.z = i * Math.PI / 8; hub.add(sp); }
    const gondolas = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, gd = new T.Group(); gd.position.set(Math.cos(a) * 6, Math.sin(a) * 6, 0); const bx = box(1.1, .9, 1.1, M(hc[i % 8])); bx.position.y = -.6; bx.castShadow = true; gd.add(bx); wg.add(gd); gondolas.push(gd); }
    for (const s of [-1, 1]) { const leg = box(.5, 9, .5, M('#cfd6e0')); leg.position.set(s * 2.4, -3.3, 0); leg.rotation.z = s * -.28; wg.add(leg); }
    upd.push(t => { const rot = t * .1; ring.rotation.z = rot; ring2.rotation.z = rot; hub.rotation.z = rot; gondolas.forEach((gd, i) => { const a = i / 12 * Math.PI * 2 + rot; gd.position.set(Math.cos(a) * 6, Math.sin(a) * 6, 0); }); }); }
  // ----- vuurtoren
  { const g = new T.Group(); for (let i = 0; i < 6; i++) { const c = new T.Mesh(new T.CylinderGeometry(1.9 - i * .12, 2.1 - i * .12, 1.6, 16), M(i % 2 ? '#e8503a' : '#ffffff')); c.position.y = .8 + i * 1.6; c.castShadow = true; g.add(c); }
    const l = new T.Mesh(new T.SphereGeometry(1.3, 14, 10), M('#ffe27a', { emissive: 0xffc21a, emissiveIntensity: .5 })); l.position.y = 10.6; g.add(l); const cp = new T.Mesh(new T.ConeGeometry(1.7, 1.4, 14), M('#e8503a')); cp.position.y = 12; g.add(cp);
    g.position.set(-36, terrainH(-36, 84), 84); scene.add(g); }
  // ----- pinguins op het strand
  const pen = [];
  for (let i = 0; i < 6; i++) { const x = -6 + i * 4 + R(-1, 1), z = 101 + R(-1, 1), g = new T.Group(); const bd = new T.Mesh(new T.SphereGeometry(.7, 14, 12), M('#20242c')); bd.scale.set(.9, 1.3, .8); bd.position.y = 1; bd.castShadow = true; g.add(bd);
    const bl = new T.Mesh(new T.SphereGeometry(.55, 12, 10), M('#ffffff')); bl.scale.set(.9, 1.2, .6); bl.position.set(0, .95, .38); g.add(bl); const bk = new T.Mesh(new T.ConeGeometry(.12, .35, 6), M('#ffa21a')); bk.rotation.x = Math.PI / 2; bk.position.set(0, 1.5, .62); g.add(bk);
    for (const s of [-1, 1]) { const f = box(.4, .1, .6, M('#ffa21a')); f.position.set(s * .3, .05, .2); g.add(f); }
    g.position.set(x, terrainH(x, z), z); g.rotation.y = R(-.6, .6); scene.add(g); pen.push(g); }
  upd.push(t => pen.forEach((g, i) => { g.rotation.z = Math.sin(t * 2 + i) * .08; }));
  // ----- pijnbomen, palmen en protea
  for (let i = 0; i < 70; i++) {
    const a = R(0, Math.PI * 2), r = R(64, 90), x = AX * r * Math.cos(a), z = AZ * r * Math.sin(a); if (Math.hypot(x, z) > 97) continue; if (shelfD(x, z) < 8 || (x > 10 && z > 55) || (z > 70 && Math.abs(x) < 14) || Math.hypot(x - P[0].x, z - P[0].z) < 48 || terrainH(x, z) < .1) continue;
    const g = new T.Group(), tr = new T.Mesh(new T.CylinderGeometry(.25, .35, 3.4, 7), M('#7b4f2d')); tr.position.y = 1.7; tr.castShadow = true; g.add(tr);
    const cr = new T.Mesh(new T.SphereGeometry(2.6, 14, 10), M(i % 3 ? '#3f8a45' : '#4f9b4d')); cr.scale.set(1.3, .5, 1.3); cr.position.y = 3.9; cr.castShadow = true; g.add(cr); g.position.set(x, terrainH(x, z), z); scene.add(g);
  }
  for (let i = 0; i < 60; i++) {
    const a = R(0, Math.PI * 2), r = R(34, 92), x = AX * r * Math.cos(a), z = AZ * r * Math.sin(a), y = terrainH(x, z); if (shelfD(x, z) < 7 || y < .1 || (x > 10 && z > 55)) continue; if (r < 62 && (1 - 0) && Math.abs(y - (26.8 * (62 - r) / 36)) > 20) continue;
    const g = new T.Group(), st = new T.Mesh(new T.CylinderGeometry(.06, .08, 1.4, 5), M('#4f8a3a')); st.position.y = .7; g.add(st);
    const fl = new T.Mesh(new T.ConeGeometry(.55, .6, 10), M(i % 2 ? '#ff5fa2' : '#ff8fc0')); fl.position.y = 1.5; fl.rotation.x = Math.PI; g.add(fl); const tp = new T.Mesh(new T.SphereGeometry(.3, 8, 6), M('#fff3dc')); tp.position.y = 1.7; g.add(tp);
    const bush = new T.Mesh(new T.SphereGeometry(1, 10, 8), M('#4e9a48')); bush.scale.set(1.4, .6, 1.4); bush.position.y = .3; g.add(bush); g.position.set(x, y, z); scene.add(g);
  }
  // ----- Muizenberg strandhuisjes
  for (let i = 0; i < 10; i++) { const x = -27 + i * 6, z = 99 + R(-.6, .6), g = new T.Group(), b = box(3.4, 3.4, 3.4, M(hc[i % 8])); b.position.y = 1.7; b.castShadow = true; g.add(b);
    const rf = new T.Mesh(new T.ConeGeometry(2.8, 1.6, 4), M('#ffffff')); rf.position.y = 4.2; rf.rotation.y = Math.PI / 4; g.add(rf); const dr = box(1, 2, .1, M('#ffffff')); dr.position.set(0, 1, 1.75); g.add(dr); g.position.set(x, Math.max(-.2, terrainH(x, z)), z); scene.add(g); }
  // ----- Cape Town Stadium
  { const g = new T.Group(), wm = M('#f4f4f6'); const bowl = new T.Mesh(new T.CylinderGeometry(10.5, 8.4, 4, 36, 1, true), wm); bowl.material.side = T.DoubleSide; bowl.position.y = 2; bowl.castShadow = true; g.add(bowl);
    const pitch = new T.Mesh(new T.CylinderGeometry(8, 8, .3, 32), M('#5fae4b')); pitch.position.y = .3; g.add(pitch); const roof = new T.Mesh(new T.TorusGeometry(9.6, .7, 8, 36), wm); roof.rotation.x = Math.PI / 2; roof.position.y = 4.1; g.add(roof);
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28, pl = box(.3, 4.2, .3, M('#cfd6e0')); pl.position.set(Math.cos(a) * 10.2, 2.1, Math.sin(a) * 10.2); g.add(pl); }
    g.position.set(-82, Math.max(.1, terrainH(-82, 40)), 40); scene.add(g); }
  // ----- Castle of Good Hope
  { const g = new T.Group(), tn = M('#d9c08a'); const wall = new T.Mesh(new T.CylinderGeometry(7, 7.4, 3, 5), tn); wall.position.y = 1.5; wall.castShadow = true; g.add(wall); const yard = new T.Mesh(new T.CylinderGeometry(5.4, 5.4, .2, 5), M('#e8d9ae')); yard.position.y = 3.05; g.add(yard);
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + Math.PI / 2 * 0, tw = new T.Mesh(new T.CylinderGeometry(1.5, 1.7, 5.2, 12), tn); tw.position.set(Math.cos(a) * 7.2, 2.6, Math.sin(a) * 7.2); tw.castShadow = true; g.add(tw); const cp = new T.Mesh(new T.ConeGeometry(1.8, 1.4, 12), M('#e8503a')); cp.position.set(Math.cos(a) * 7.2, 5.9, Math.sin(a) * 7.2); g.add(cp); }
    g.position.set(-52, Math.max(.1, terrainH(-52, 70)), 70); scene.add(g); }
  // ----- V&A kranen
  for (const [x, z] of [[40, 84], [47, 87]]) { const g = new T.Group(); const mast = box(1, 13, 1, M('#e8503a')); mast.position.y = 6.5; mast.castShadow = true; g.add(mast); const arm = box(12, .7, .7, M('#ffc21a')); arm.position.set(3, 12.8, 0); g.add(arm); g.position.set(x, Math.max(.1, terrainH(x, z)), z); g.rotation.y = R(0, 6); scene.add(g); }
  // ----- Robben Island
  { const isl = new T.Mesh(new T.SphereGeometry(16, 20, 12), M('#c9d48a')); isl.scale.set(1.3, .12, 1); isl.position.set(-135, -.4, 148); scene.add(isl); const lh = new T.Mesh(new T.CylinderGeometry(.8, 1.1, 6, 10), M('#ffffff')); lh.position.set(-135, 2.4, 148); scene.add(lh); }
  // ----- kitesurfers
  const kites = [[85, 130], [105, 150], [60, 160], [-20, 170]].map(([x, z], i) => { const g = new T.Group(), k = new T.Mesh(new T.PlaneGeometry(5, 3), new T.MeshStandardMaterial({ color: HCOL[(i * 2) % 8], side: T.DoubleSide })); k.position.y = 16; k.rotation.x = .5; g.add(k); const ln = box(.05, 16, .05, M('#333333')); ln.position.y = 8; g.add(ln); const bd = box(.7, .1, 2, M('#ffffff')); bd.position.y = -.7; g.add(bd); g.position.set(x, 0, z); scene.add(g); return g; });
  upd.push(t => kites.forEach((g, i) => { g.rotation.z = Math.sin(t * .8 + i) * .25; g.position.x += Math.sin(t * .5 + i) * .02; }));
  // ----- rode toeristenbus
  const bus = new T.Group(); { const bb = box(5.5, 2, 2.2, M('#e8403a')); bb.position.y = 1.6; bb.castShadow = true; bus.add(bb); const up = box(5.2, 1.4, 2.1, M('#ffffff')); up.position.y = 3.4; bus.add(up); const wn = box(5.3, .6, 2.25, M('#4a90c8')); wn.position.y = 1.9; bus.add(wn); for (const sx of [-1.8, 1.8]) for (const sz of [-1.1, 1.1]) { const w = new T.Mesh(new T.CylinderGeometry(.5, .5, .3, 12), M('#222222')); w.rotation.x = Math.PI / 2; w.position.set(sx, .5, sz); bus.add(w); } scene.add(bus); }
  upd.push(t => { const a = t * .06 + 2.2, x = AX * 71 * Math.cos(a), z = AZ * 71 * Math.sin(a); bus.position.set(x, terrainH(x, z), z); bus.rotation.y = Math.atan2(-AZ * Math.cos(a), -AX * Math.sin(a)); });
  // ----- boten en wolken
  const boats = [[-40, 120], [70, 125], [10, 150], [-120, 70]].map(([x, z], i) => { const g = new T.Group(), h = box(5, 1.2, 1.8, M('#ffffff')); h.position.y = .3; g.add(h); const sl = new T.Mesh(new T.ConeGeometry(1.6, 5, 3), M(i % 2 ? '#ff6f59' : '#ffc21a')); sl.position.y = 3.5; sl.scale.z = .15; g.add(sl); g.position.set(x, -.7, z); g.rotation.y = R(0, 6); scene.add(g); return g; });
  upd.push(t => boats.forEach((g, i) => { g.position.y = -.7 + Math.sin(t * .9 + i) * .15; g.rotation.z = Math.sin(t * .7 + i) * .05; }));
  const clouds = []; const clm = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .9, fog: false });
  for (let i = 0; i < 12; i++) { const g = new T.Group(); for (let k = 0; k < 5; k++) { const s = new T.Mesh(new T.SphereGeometry(R(5, 9), 12, 9), clm); s.position.set(k * 6 - 12 + R(-2, 2), R(-1, 2), R(-3, 3)); s.scale.y = .6; g.add(s); } g.position.set(R(-260, 260), R(60, 95), R(-260, 100)); g.userData.v = R(.5, 1.6); scene.add(g); clouds.push(g); }

  const tileTop = i => { const p = P[Math.min(i, size)]; return new T.Vector3(p.x, p.y + (i === 0 ? .4 : .65), p.z); };
  return { size, scene, P, tileTop, terrainH,
    update(t, dt) { clouds.forEach(c => { c.position.x += c.userData.v * dt; if (c.position.x > 280) c.position.x = -280; }); cloth.children.forEach((m, i) => { m.position.y = m.userData.y0 + Math.sin(t * .6 + i) * .35; });
      flag.rotation.y = Math.sin(t * 2) * .15; upd.forEach(f => f(t)); },
    dispose() { disposeObj(scene); } };
}
const ri2 = n => Math.floor(Math.random() * n);

/* ---- bord (3D) ---- */
const WS = {};
function ensureRenderer() {
  if (!WS.r) { const r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; WS.r = r; }
  return WS.r;
}
function getWorld(size) { if (WS.w && WS.w.size === size) return WS.w; if (WS.w) WS.w.dispose(); return WS.w = buildWorld(size); }
const lerpAng = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; };

VIEWS.room = () => {
  const r = S.room; if (!r) return go('home');
  const W = app.clientWidth, Hh = app.clientHeight, me = r.players[0];
  const done = r.day.games.filter(g => r.myScores[g] !== undefined).length;
  const rank = [...r.players].sort((a, b) => b.pos - a.pos);
  const winners = (r.winners || []).map(id => r.players.find(p => p.id === id).name).join(' en ');
  const shownPos = id => r.pendingThrow && r.lastResult && r.lastResult.results[id] ? r.lastResult.results[id].from : r.players.find(p => p.id === id).pos;
  app.innerHTML = `<div class="screen" style="background:linear-gradient(#3fa6ea,#cfeaf6)"><div id="gl" style="position:absolute;inset:0;touch-action:none"></div><div id="labels" style="position:absolute;inset:0;pointer-events:none;overflow:hidden"></div>
    <div class="load" id="ld">Kaapstad laden</div>
    <div class="ov banner"><span>Nog</span><b id="left">${Math.max(0, r.size - shownPos('me'))}</b><span>vakjes</span></div>
    <div class="ov pill">${rank.map(p => avatarSVG(p.look, 34, p.color)).join('')}</div>
    <div class="ov tb"><button class="tbb" data-act="home">‹ Terug</button><button class="tbb" id="vb">Overzicht</button></div>
    <div class="ov tr"><button class="codechip" data-act="share" aria-label="Kamercode delen">Code ${r.code} delen</button><div class="zm"><button class="zb" id="zi" aria-label="Inzoomen">+</button><button class="zb" id="zo" aria-label="Uitzoomen">−</button></div></div>
    <button class="ov rot l" id="rl" aria-label="Kijk naar links">◀</button><button class="ov rot r" id="rr2" aria-label="Kijk naar rechts">▶</button><button class="ov rot u" id="ru" aria-label="Kijk omhoog">▲</button><button class="ov rot d" id="rd" aria-label="Kijk omlaag">▼</button>
    <div class="ov hint2" id="h2">Sleep over het scherm om rond te kijken</div>
    <div class="bottom" id="bt"></div></div>`;
  const bt = $('#bt');
  if (r.status === 'finished') bt.innerHTML = `<h3 style="font-size:26px">De top is bereikt</h3><div class="t" style="margin:4px 0 10px">Winnaar: ${esc(winners)}</div><div class="row"><button class="btn" data-act="lastres">Laatste uitslag</button><button class="btn blue" data-act="home">Klaar</button></div>`;
  else if (r.pendingThrow) bt.innerHTML = `<div class="t">De uitslag is binnen. Jij gooit ${r.lastResult.results.me.rolls.length} ${r.lastResult.results.me.rolls.length === 1 ? 'dobbelsteen' : 'dobbelstenen'}.</div><div class="row" style="margin-top:10px"><button class="btn" data-act="lastres">Dobbel nu</button></div>`;
  else {
    const open = r.day.revealAt > Date.now();
    bt.innerHTML = `<div class="t">Vandaag ${done} van 4 gedaan, ${open ? 'uitslag over <span class="cd" id="cd">' + fmtCd(r.day.revealAt - Date.now()) + '</span>' : 'de uitslag staat klaar'}</div>
      ${r.players.length === 1 ? '<div class="muted" style="font-size:13px;margin-top:4px">Je speelt nog alleen. Tik op Code bovenaan om je vrienden uit te nodigen.</div>' : ''}<div class="row" style="margin-top:10px"><button class="btn" data-act="day">${done === 4 ? 'Klaar voor vandaag' : 'Speel'}</button>${r.lastResult ? '<button class="btn blue" style="width:auto" data-act="lastres">Uitslag</button>' : ''}</div>`;
  }
  const iv = setInterval(() => { const c = $('#cd'); if (c) c.textContent = fmtCd(r.day.revealAt - Date.now()); }, 1000); cleanups.push(() => clearInterval(iv));
  setTimeout(() => { const h = $('#h2'); if (h) h.style.opacity = 0; }, 5000);

  let alive = true, raf = 0; cleanups.push(() => alive = false);
  setTimeout(() => {
    if (!alive) return;
    let world, R;
    try { world = getWorld(r.size); R = ensureRenderer(); } catch (e) { console.warn(e); $('#ld').textContent = 'Je apparaat kan geen 3D laten zien.'; return; }
    $('#ld').remove(); R.setSize(W, Hh); $('#gl').appendChild(R.domElement);
    const cam = new THREE.PerspectiveCamera(52, W / Hh, .5, 1500), labels = $('#labels'), T = THREE;
    const pawns = {}, cur = {}; r.players.forEach(p => cur[p.id] = shownPos(p.id));
    r.players.forEach(p => {
      const av = buildAvatar(p.look, p.color); world.scene.add(av);
      const sh = new T.Mesh(new T.CircleGeometry(1.2, 20), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3 })); sh.rotation.x = -Math.PI / 2; world.scene.add(sh);
      const lab = document.createElement('div'); lab.className = 'plab' + (p.id === 'me' ? ' me' : ''); lab.style.background = p.color; lab.style.color = p.color === '#ffc21a' ? '#3a2a00' : '#fff'; lab.textContent = p.name; labels.appendChild(lab);
      pawns[p.id] = { av, sh, lab, pos: new T.Vector3(), tgt: new T.Vector3(), ang: 0, first: true, sc: .82 };
    });
    const layout = () => r.players.forEach(p => {
      const same = r.players.filter(q => cur[q.id] === cur[p.id]), k = same.findIndex(q => q.id === p.id), pt = world.P[Math.min(cur[p.id], r.size)], off = (k - (same.length - 1) / 2) * 1.5;
      const t = world.tileTop(Math.min(cur[p.id], r.size)); t.x += pt.tx * off; t.z += pt.tz * off; const pw = pawns[p.id]; pw.tgt.copy(t); if (pw.first) { pw.pos.copy(t); pw.first = false; }
    });
    // camera: slepen = om je heen kijken, knoppen en inertia
    const view = { f: { az: 0, pitch: .62, dist: 30 }, o: { az: 0, pitch: .55, dist: 210 } }; let overview = false, drag = null, last2 = null, held = 0;
    const V = () => overview ? view.o : view.f;
    const gl = $('#gl'); let vel = { az: 0, pitch: 0 };
    gl.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY }; gl.setPointerCapture(e.pointerId); const h = $('#h2'); if (h) h.style.opacity = 0; };
    gl.onpointermove = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; const v = V(); v.az += dx * .014; v.pitch = Math.max(.1, Math.min(1.4, v.pitch + dy * .006)); vel.az = dx * .014 * 12; };
    gl.onpointerup = gl.onpointercancel = () => drag = null; gl.onwheel = e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.1 : .9); };
    const hold = (id, dir) => { const b = $(id); b.onpointerdown = () => held = dir; b.onpointerup = b.onpointerleave = b.onpointercancel = () => held = 0; };
    hold('#rl', 1); hold('#rr2', -1); { let pv = 0; const hp = (id, d) => { const b = $(id); b.onpointerdown = () => pv = d; b.onpointerup = b.onpointerleave = b.onpointercancel = () => pv = 0; }; hp('#ru', 1); hp('#rd', -1); const piv = setInterval(() => { if (pv) { const v = V(); v.pitch = Math.max(.1, Math.min(1.4, v.pitch + pv * .02)); } }, 16); cleanups.push(() => clearInterval(piv)); }
    var zoom = f => { const v = V(); v.dist = Math.max(overview ? 80 : 12, Math.min(overview ? 330 : 60, v.dist * f)); }; $('#zi').onclick = () => zoom(.8); $('#zo').onclick = () => zoom(1.25);
    $('#vb').onclick = () => { overview = !overview; $('#vb').textContent = overview ? 'Mijn poppetje' : 'Overzicht'; };
    const camP = new T.Vector3(), lookV = new T.Vector3(), des = new T.Vector3(), lk = new T.Vector3(), v3 = new T.Vector3();
    let started = false, last = performance.now(), t = 0;
    const frame = now => {
      if (!alive) return; const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; world.update(t, dt);
      const vw = V(); if (held) vw.az += held * dt * 1.4; if (!drag) { vw.az += vel.az * dt; vel.az *= Math.exp(-dt * 4); }
      r.players.forEach((p, i) => {
        const pw = pawns[p.id], d = pw.tgt.clone().sub(pw.pos), dist = d.length(); pw.pos.addScaledVector(d, 1 - Math.exp(-dt * 8));
        const mv = dist > .5, hop = mv ? Math.sin(Math.min(1, dist / 4) * Math.PI) : 0, ts = overview ? 2.3 : .82; pw.sc += (ts - pw.sc) * Math.min(1, dt * 5); pw.av.scale.setScalar(pw.sc);
        pw.av.position.set(pw.pos.x, pw.pos.y + hop * pw.sc + (mv ? 0 : Math.sin(t * 3 + i) * .05), pw.pos.z);
        const want = mv ? Math.atan2(d.x, d.z) : Math.atan2(cam.position.x - pw.pos.x, cam.position.z - pw.pos.z); pw.ang = lerpAng(pw.ang, want, 1 - Math.exp(-dt * 8)); pw.av.rotation.y = pw.ang;
        const sw = mv ? Math.sin(t * 14) * .9 : 0, U = pw.av.userData; U.armL.rotation.x = sw; U.armR.rotation.x = -sw; U.armR.rotation.z = mv ? .18 : .18 + Math.sin(t * 2 + i) * .05;
        pw.sh.position.set(pw.pos.x, pw.pos.y + .05, pw.pos.z); pw.sh.scale.setScalar(pw.sc / .82 * (1 - hop * .3));
      });
      const mp = pawns.me.pos;
      if (overview) { const a = Math.PI / 2 + vw.az, cp = Math.cos(vw.pitch) * vw.dist; des.set(Math.cos(a) * cp, 12 + Math.sin(vw.pitch) * vw.dist, Math.sin(a) * cp); lk.set(0, 12, 0); }
      else { const hi = clamp01((mp.y - 16) / 10), pd = vw.dist * (1 + hi * .9), pp = Math.min(1.4, vw.pitch + hi * .5), a = Math.atan2(mp.z, mp.x) + vw.az, cp = Math.cos(pp) * pd; des.set(mp.x + Math.cos(a) * cp, mp.y + 1.5 + Math.sin(pp) * pd, mp.z + Math.sin(a) * cp); lk.set(mp.x, mp.y - 2.5 - hi * 3, mp.z); }
      des.y = Math.max(des.y, world.terrainH(des.x, des.z) + 3);
      if (!started) { camP.copy(des); lookV.copy(lk); started = true; } else { const k = 1 - Math.exp(-dt * 6); camP.lerp(des, k); lookV.lerp(lk, k); }
      cam.position.copy(camP); cam.lookAt(lookV); R.render(world.scene, cam);
      r.players.forEach(p => { const pw = pawns[p.id]; v3.copy(pw.av.position); v3.y += 4.8 * pw.sc / .82; v3.project(cam); pw.lab.style.display = v3.z < 1 ? '' : 'none'; pw.lab.style.left = ((v3.x * .5 + .5) * W) + 'px'; pw.lab.style.top = ((-v3.y * .5 + .5) * Hh) + 'px'; });
      raf = requestAnimationFrame(frame);
    };
    layout();
    cleanups.push(() => { cancelAnimationFrame(raf); r.players.forEach(p => { const pw = pawns[p.id]; world.scene.remove(pw.av); world.scene.remove(pw.sh); disposeObj(pw.av); }); try { R.domElement.remove(); } catch (e) {} });
    if (r.anim && !r.pendingThrow) {
      const anim = r.anim; r.players.forEach(p => cur[p.id] = anim[p.id] ? anim[p.id].from : p.pos); layout();
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      (async () => {
        await sleep(900);
        await Promise.all(r.players.map(async p => {
          const a = anim[p.id]; if (!a || !a.played) return;
          for (let i = a.from + 1; i <= a.landed; i++) { if (!alive) return; cur[p.id] = i; layout(); await sleep(300); }
          if (a.to !== a.landed) { await sleep(600); if (!alive) return; cur[p.id] = a.to; layout(); }
        }));
        if (!alive) return; markSeen(); const L = $('#left'); if (L) L.textContent = Math.max(0, r.size - me.pos);
      })();
    }
    raf = requestAnimationFrame(frame);
  }, 40);
};

ACT.throw = () => go('throw');
VIEWS.throw = () => {
  const r = S.room, x = r.lastResult.results.me, n = x.rolls.length, me = r.players[0];
  app.innerHTML = `<div class="screen cape throw" style="background:linear-gradient(180deg,#ff9a8b,#ffd1a0 55%,#fff1d6)">
    <div class="tt"><h1>Jouw worp</h1><div class="note" id="tn">Swipe omhoog om te gooien, of tik op Gooi</div></div>
    <div class="stage" id="stg">${x.rolls.map((v, i) => `<div class="dh hov" data-i="${i}" style="left:${(i + .5) / n * 100}%;animation-delay:${i * .25}s">${cubeHTML(v)}</div>`).join('')}</div>
    <div class="who" id="who"><img class="av" alt="" src="${snap(me.look, me.color, { mode: 'full', size: 440, yaw: .15 })}"></div>
    <div class="tfoot"><button class="btn" id="gb">Gooi</button></div></div>`;
  const stg = $('#stg'), cws = [...stg.querySelectorAll(".dh")]; let thrown = false, drag = null;
  cws.forEach(cw => cw.querySelector('.cube').classList.remove('roll'));
  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const doThrow = async () => {
    if (thrown) return; thrown = true; $('#gb').disabled = true; $('#who').classList.add('lean'); beep(300, .2, 'sine'); $('#tn').textContent = '';
    cws.forEach((cw, i) => { cw.classList.remove('hov'); cw.style.transition = 'transform .55s cubic-bezier(.3,.1,.6,1)'; cw.style.transform = `translate(${(i - (n - 1) / 2) * 30}px,-420px) scale(.35) rotate(${i * 40}deg)`; cw.querySelector('.cube').classList.add('roll'); });
    await sleep(600);
    const floor = stg.clientHeight * .78;
    cws.forEach((cw, i) => { cw.style.transition = 'none'; cw.style.transform = `translate(${(Math.random() - .5) * 120}px,-380px) scale(.4)`; }); void stg.offsetWidth;
    cws.forEach((cw, i) => { cw.style.transition = `transform .75s cubic-bezier(.2,.8,.3,1.2) ${i * .08}s`; cw.style.transform = `translate(${(Math.random() - .5) * 40}px,${floor - 30}px) scale(1.25)`; });
    await sleep(900); cws.forEach(cw => beep(160, .1, 'square', .08));
    for (let i = 0; i < cws.length; i++) { const c = cws[i].querySelector('.cube'); await sleep(260); c.classList.remove('roll'); c.style.transform = `rotateX(-22deg) rotateY(-28deg) ${FACE[c.dataset.n]}`; beep(220 + i * 60, .12); }
    await sleep(900); const sum = x.rolls.reduce((a, b) => a + b, 0);
    $('#tn').innerHTML = `Je gooide <b>${x.rolls.join(' + ')} = ${sum}</b>`; $('.tfoot').innerHTML = `<button class="btn" id="nb">Naar het bord</button>`; markThrown(); $('#nb').onclick = () => go('room');
  };
  $('#gb').onclick = doThrow;
  const scr = $('.throw'); scr.onpointerdown = e => { if (e.target.closest('button')) return; drag = e.clientY; scr.setPointerCapture(e.pointerId); };
  scr.onpointermove = e => { if (drag === null || thrown) return; const dy = Math.min(0, e.clientY - drag); cws.forEach(cw => { cw.classList.remove('hov'); cw.style.transition = 'none'; cw.style.transform = `translateY(${dy}px) scale(${1 + dy / 800})`; }); };
  scr.onpointerup = scr.onpointercancel = e => { if (drag === null) return; const dy = e.clientY - drag; drag = null; if (dy < -70) doThrow(); else if (!thrown) cws.forEach(cw => { cw.style.transition = 'transform .3s'; cw.style.transform = ''; cw.classList.add('hov'); }); };
};

ACT.day = () => go('day');
ACT.lastres = () => go('result');
/* ---- dagscherm ---- */
VIEWS.day = () => {
  const r = S.room, open = r.day.revealAt > Date.now();
  app.innerHTML = `<div class="screen cape" style="background:linear-gradient(180deg,#8fd4f7,#e6f7ff)"><div class="pad-body">
    <h1>Vandaag</h1>
    <p class="note">${open ? 'Nog <span class="cd" id="cd">' + fmtCd(r.day.revealAt - Date.now()) + '</span> tot de uitslag. ' : 'De uitslag staat klaar. '}Elke minigame speel je één keer. Wat de anderen scoren zie je pas na de uitslag.</p>
    ${r.day.games.map(g => { const d = r.myScores[g] !== undefined; return `<div class="card gamecard"><div class="gico">${GAMES[g].icon}</div><div style="flex:1;min-width:0"><div class="n">${GAMES[g].title}</div><div class="h">${d ? 'Jouw score: ' + GAMES[g].fmt(r.myScores[g]) : GAMES[g].how}</div></div><button class="btn" ${d || !open ? 'disabled' : ''} data-act="play" data-g="${g}">${d ? 'Klaar' : 'Start'}</button></div>`; }).join('')}
    <button class="btn blue" data-act="room" style="margin-top:18px">Terug naar het bord</button></div></div>`;
  const iv = setInterval(() => { const c = $('#cd'); if (c) c.textContent = fmtCd(r.day.revealAt - Date.now()); }, 1000); cleanups.push(() => clearInterval(iv));
};
ACT.room = () => go('room');
ACT.play = t => go('play', t.dataset.g);

/* ---- spelen ---- */
let audio = null;
function beep(f, d = 0.18, type = 'triangle', vol = .12) {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.value = f; g.gain.value = vol; o.connect(g); g.connect(audio.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + d); o.stop(audio.currentTime + d); } catch (e) {}
}
const FORFEIT = { surf: 0, baboon: 0, kick: 0, vine: 0, fruit: 0, barrel: 200, tilt: 120, memory: 0, react: 500, stack: 0, dart: 0 };
VIEWS.play = () => {
  const g = viewArg, r = S.room, meta = GAMES[g];
  const intro = () => {
    app.innerHTML = `<div class="screen cape" style="background:linear-gradient(180deg,#8fd4f7,#e6f7ff)"><div class="center" style="position:relative;z-index:1">
      <div style="font-size:76px">${meta.icon}</div><h1>${meta.title}</h1><p class="note">${meta.how}</p>
      <button class="btn" id="go" style="max-width:260px;margin-top:10px">Start</button><button class="btn ghost" data-act="day" style="max-width:260px">Terug</button></div></div>`;
    $('#go').onclick = () => { beep(520); play(); };
  };
  const play = () => {
    app.innerHTML = `<div class="screen" style="background:#bfe8fb"><div class="area" id="area"><div class="hud" id="hud"></div></div>
      <button class="closex" id="cx" aria-label="Minigame afsluiten">✕</button>
      <div class="confirm" id="cf" hidden><div class="card"><h3 style="font-size:22px">Minigame afsluiten?</h3><p class="note">Weet je zeker dat je wilt stoppen? Je kunt deze minigame vandaag niet opnieuw spelen en je krijgt de laagste score.</p>
        <div class="row"><button class="btn blue" id="no">Verder spelen</button><button class="btn" id="yes">Stoppen</button></div></div></div></div>`;
    const area = $('#area'), hud = $('#hud'); let over = false;
    $('#cx').onclick = () => $('#cf').hidden = false; $('#no').onclick = () => $('#cf').hidden = true;
    $('#yes').onclick = () => { if (over) return; over = true; cleanups.forEach(f => { try { f(); } catch (e) {} }); cleanups = []; recordScore(g, FORFEIT[g]); go('day'); };
    const stop = RUN[g](area, hud, r.players[0].look, score => {
      if (over) return; recordScore(g, score);
      setTimeout(() => { if (view === 'play' && !over) { over = true; finished(score); } }, g === 'fruit' ? 400 : 1700);
    });
    cleanups.push(stop);
  };
  const finished = score => {
    cleanups.forEach(f => { try { f(); } catch (e) {} }); cleanups = [];
    const q = rateScore(g, score), me = r.players[0], expr = { good: 'happy', mid: 'meh', bad: 'sad' }[q], txt = { good: 'Fantastisch!', mid: 'Mwa, kan beter', bad: 'Ah balen...' }[q];
    const bg = { good: 'linear-gradient(180deg,#ffd86b,#ff9a8b)', mid: 'linear-gradient(180deg,#d7dde6,#b6c2d1)', bad: 'linear-gradient(180deg,#8fa3bd,#5d7390)' }[q];
    let fx = ''; for (let i = 0; i < 26; i++) fx += `<i class="fx ${q}" style="left:${Math.random() * 100}%;animation-delay:${Math.random() * 2}s;animation-duration:${1.6 + Math.random() * 1.6}s;background:${q === 'good' ? HCOL[i % 8] : '#9fd0ff'}"></i>`;
    app.innerHTML = `<div class="screen fin" style="background:${bg}">${q === 'mid' ? '' : fx}<div class="center" style="position:relative;z-index:2"><div class="zoomwrap ${q}"><img class="av" alt="" src="${snap(me.look, me.color, { mode: 'head', size: 460, yaw: .15, expr })}"></div>
      <div class="rtxt">${txt}</div><div class="big" style="color:${q === 'bad' ? '#fff' : 'var(--coralbtn)'}">${meta.fmt(score)}</div><p class="note" style="color:${q === 'bad' ? '#fff' : 'var(--ink)'}">Pas na de uitslag zie je hoe de anderen het deden.</p>
      <button class="btn" data-act="day" style="max-width:260px;margin-top:6px">Verder</button></div></div>`;
    beep(q === 'good' ? 880 : q === 'mid' ? 330 : 160, .4);
  };
    r.myScores[g] !== undefined ? go('day') : intro();
};

/* ---- tekenhulp ---- */
function mkCanvas(area) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = area.clientWidth, h = Math.max(380, area.clientHeight - 46), sc = w / 380;
  const cv = document.createElement('canvas'); cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.style.touchAction = 'none';
  area.appendChild(cv); const c = cv.getContext('2d'); c.setTransform(dpr * sc, 0, 0, dpr * sc, 0, 0); return { cv, c, w, h, W: 380, H: h / sc, sc };
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function drawAv(c, look, x, y, s) { const i = avImg(look); if (i.complete && i.naturalWidth) c.drawImage(i, x, y, s, s); }
const AVF = {};
function avFull(look) { const col = curColor(), k = JSON.stringify([look, col]); if (!AVF[k]) { const i = new Image(); i.src = snap(look, col, { mode: 'full', size: 320 }); AVF[k] = i; } return AVF[k]; }
function drawFull(c, look, x, y, h, rot = 0) { const i = avFull(look); if (!(i.complete && i.naturalWidth)) return; c.save(); c.translate(x, y); c.rotate(rot); c.drawImage(i, -h / 2, -h / 2, h, h); c.restore(); }
const mod = (a, b) => ((a % b) + b) % b;
const HCOL = ['#ff4f8b', '#ffc21a', '#35c4d9', '#7bdc5a', '#ff8a3d', '#9b6bff', '#ff6f59', '#4fa3ff'];

/** Kaapstad achtergrond: Tafelberg met wolk, Leeuwenkop, zee, Bo-Kaap huisjes. cam is de zijwaartse scroll. */
function capeBG(c, W, H, gy, cam = 0, t = 0) {
  const g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, '#46aeee'); g.addColorStop(.7, '#bfe8fb'); g.addColorStop(1, '#fff1d6'); c.fillStyle = g; c.fillRect(0, -50, W, gy + 52);
  const sg = c.createRadialGradient(W * .8, 56, 4, W * .8, 56, 70); sg.addColorStop(0, '#fffbe0'); sg.addColorStop(.3, '#fff3b0'); sg.addColorStop(1, 'rgba(255,243,176,0)'); c.fillStyle = sg; c.fillRect(W * .8 - 70, -14, 140, 140);
  c.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 4; k++) { const x = mod(k * 150 + t * 6 - cam * .05, W + 200) - 100, y = 34 + k * 22; c.beginPath(); c.ellipse(x, y, 40, 11, 0, 0, 7); c.ellipse(x + 22, y - 6, 24, 10, 0, 0, 7); c.fill(); }
  const P = 820;
  for (let k = -1; k <= 1; k++) {
    const ox = mod(-cam * .1, P) + k * P;
    const rock = c.createLinearGradient(0, gy - 150, 0, gy - 20); rock.addColorStop(0, '#c9a17a'); rock.addColorStop(.5, '#a78766'); rock.addColorStop(1, '#6f8a58');
    c.fillStyle = rock; c.beginPath(); c.moveTo(ox + 30, gy - 24); c.lineTo(ox + 90, gy - 100); c.lineTo(ox + 110, gy - 140); c.lineTo(ox + 330, gy - 140); c.lineTo(ox + 352, gy - 112); c.lineTo(ox + 420, gy - 60); c.lineTo(ox + 470, gy - 24); c.fill();
    c.strokeStyle = 'rgba(80,55,35,.28)'; c.lineWidth = 2; for (let s = 0; s < 6; s++) { c.beginPath(); c.moveTo(ox + 110 + s * 36, gy - 138); c.lineTo(ox + 96 + s * 44, gy - 40); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(ox + 220, gy - 150, 120, 17, 0, 0, 7); c.ellipse(ox + 130, gy - 138, 60, 14, 0, 0, 7); c.ellipse(ox + 320, gy - 142, 70, 15, 0, 0, 7); c.fill();
    const ox2 = mod(-cam * .16 + 500, P) + k * P - 60; c.fillStyle = '#8fa56a'; c.beginPath(); c.moveTo(ox2, gy - 24); c.quadraticCurveTo(ox2 + 40, gy - 130, ox2 + 80, gy - 96); c.quadraticCurveTo(ox2 + 105, gy - 70, ox2 + 150, gy - 24); c.fill();
    c.fillStyle = '#b79872'; c.beginPath(); c.moveTo(ox2 + 36, gy - 100); c.quadraticCurveTo(ox2 + 50, gy - 126, ox2 + 76, gy - 98); c.quadraticCurveTo(ox2 + 56, gy - 90, ox2 + 36, gy - 100); c.fill();
  }
  c.fillStyle = '#25b8d6'; c.fillRect(0, gy - 30, W, 30); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; for (let k = 0; k < 9; k++) { const x = mod(k * 61 - cam * .2 + Math.sin(t + k) * 6, W + 60) - 30; c.beginPath(); c.moveTo(x, gy - 22 + (k % 3) * 8); c.lineTo(x + 18, gy - 22 + (k % 3) * 8); c.stroke(); }
  const hp = 52;
  for (let i = -2; i < W / hp + 3; i++) {
    const idx = Math.floor((cam * .38) / hp) + i, x = i * hp - mod(cam * .38, hp), hh = 34 + (mod(idx * 7, 5)) * 6;
    c.fillStyle = HCOL[mod(idx, 8)]; c.fillRect(x, gy - hh, 46, hh); c.fillStyle = '#fff'; c.fillRect(x - 2, gy - hh - 4, 50, 5);
    c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(x + 8, gy - hh + 9, 10, 13); c.fillRect(x + 28, gy - hh + 9, 10, 13); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 18, gy - 17, 10, 17);
  }
}
function palmAt(c, x, y, s = 1) { c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = '#8a5a35'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -40, 4, -80); c.stroke(); c.fillStyle = '#2f9e5b'; for (let i = 0; i < 6; i++) { c.save(); c.translate(4, -80); c.rotate(-1.4 + i * .56); c.beginPath(); c.ellipse(24, 0, 28, 7, 0, 0, 7); c.fill(); c.restore(); } c.restore(); }
function star(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); }
function bubble(c, x, y, txt, col = '#22304a') { c.font = '800 20px "Baloo 2",Nunito,sans-serif'; const w = c.measureText(txt).width + 24; c.fillStyle = '#fff'; rr(c, x - w / 2, y - 30, w, 38, 14); c.fill(); c.strokeStyle = col; c.lineWidth = 3; c.stroke(); c.fillStyle = col; c.textAlign = 'center'; c.fillText(txt, x, y - 4); }
function swirl(c, x, y, r, t) { c.strokeStyle = '#22304a'; c.lineWidth = 3; c.beginPath(); for (let a = 0; a < 12; a += .3) { const rad = r * a / 12; c.lineTo(x + Math.cos(a + t * 6) * rad, y + Math.sin(a + t * 6) * rad); } c.stroke(); }

const RUN = {};
/* ---- Liaan zwaaien: vanaf Leeuwenkop ---- */
RUN.vine = (area, hud, look, finish) => {
  const { cv, c, W, H, sc } = mkCanvas(area);
  const PX = 110, PY = 175, L = 140, G = 900, PPM = 30, GY = H - 70, J = 3, OM = 1.75, AMPS = [2.25, 2.5, 2.72];
  const st = { jump: 0, phase: 'swing', t0: performance.now(), x: PX, y: PY + L, ang: 0, rot: 0, x0: 0, vx: 0, vy: 0, ft: 0, total: 0, last: 0, cam: 0, q: null, lt: 0, fin: false };
  const parts = []; let raf, tm, T = 0;
  const th = t => AMPS[st.jump] * Math.sin(OM * t);
  const pos = a => ({ x: PX + (L + 26) * Math.sin(a), y: PY + (L + 26) * Math.cos(a) });
  const confetti = (x, y) => { for (let i = 0; i < 40; i++) parts.push({ x, y, vx: (Math.random() - .5) * 260, vy: -Math.random() * 300 - 60, col: HCOL[i % 8], life: 1.4 }); };
  const loop = now => {
    const dt = Math.min(.05, (now - (loop.l || now)) / 1000); loop.l = now; T += dt; const tt = (now - st.t0) / 1000;
    if (st.phase === 'swing') { const a = th(tt); st.ang = a; const p = pos(a); st.x = p.x; st.y = p.y; st.rot = -a; st.cam += (0 - st.cam) * Math.min(1, dt * 4); }
    else if (st.phase === 'fly') {
      const d = (now - st.ft) / 1000; st.x = st.x0 + st.vx * d; st.y = st.y0 + st.vy * d + .5 * G * d * d; st.rot = Math.atan2(st.vx, -(st.vy + G * d)) + (st.q2 ? d * 5 : 0);
      st.cam += ((st.x - 120) - st.cam) * Math.min(1, dt * 5);
      if (st.y >= GY - 30) {
        st.y = GY - 30; st.last = Math.max(0, (st.x - PX) / PPM); st.total += st.last; st.q = st.last >= 14 ? 'top' : st.last >= 7 ? 'mid' : 'bad'; st.phase = 'land'; st.lt = now;
        if (st.q === 'top') confetti(st.x, st.y - 40); beep(st.q === 'top' ? 660 : st.q === 'mid' ? 400 : 150, .3);
        tm = setTimeout(() => { st.jump++; if (st.jump >= J) { if (!st.fin) { st.fin = true; finish(Math.round(st.total * 10) / 10); } } else { st.phase = 'swing'; st.t0 = performance.now(); st.q = null; st.rot = 0; } }, 1700);
      }
    } else if (st.phase === 'land') { st.cam += ((st.x - 140) - st.cam) * Math.min(1, dt * 3); }
    hud.textContent = `Sprong ${Math.min(st.jump + 1, J)} van ${J}, totaal ${nl(st.total)} m`;
    capeBG(c, W, H, GY, st.cam, T);
    c.save(); c.translate(-st.cam, 0);
    c.fillStyle = '#8bd36a'; c.fillRect(st.cam - 20, GY, W + 40, H); c.fillStyle = '#5fae4b'; c.fillRect(st.cam - 20, GY, W + 40, 8); c.fillStyle = '#e8cf93'; c.fillRect(PX + 14 * PPM, GY, W * 3, 14);
    for (let m = 0; m <= 80; m += 5) { const x = PX + m * PPM; if (x < st.cam - 30 || x > st.cam + W + 30) continue; c.fillStyle = m >= 14 ? '#d99a0a' : '#7b4f2d'; c.fillRect(x - 2, GY - 26, 4, 26); c.fillStyle = m >= 14 ? '#ffc21a' : '#fff'; c.fillRect(x, GY - 26, 22, 12); c.fillStyle = '#22304a'; c.font = '800 10px Nunito,sans-serif'; c.textAlign = 'left'; c.fillText(m, x + 3, GY - 17); }
    { const gx = PX + 14 * PPM; c.strokeStyle = '#ffc21a'; c.lineWidth = 5; c.beginPath(); c.moveTo(gx, GY - 6); c.lineTo(gx, GY - 150); c.moveTo(gx + 70, GY - 6); c.lineTo(gx + 70, GY - 150); c.stroke(); c.fillStyle = '#ffc21a'; rr(c, gx - 4, GY - 168, 82, 26, 8); c.fill(); c.fillStyle = '#6b4300'; c.font = '800 16px "Baloo 2",sans-serif'; c.textAlign = 'center'; c.fillText('GOUD 14 m', gx + 37, GY - 149); }
    palmAt(c, PX + 9 * PPM, GY, .8); palmAt(c, PX + 23 * PPM, GY, 1); palmAt(c, PX + 40 * PPM, GY, .9);
    // boom, tak en liaan
    c.fillStyle = '#7b4f2d'; c.beginPath(); c.moveTo(PX - 80, GY); c.quadraticCurveTo(PX - 62, GY - 120, PX - 52, PY - 4); c.lineTo(PX + 8, PY - 12); c.lineTo(PX + 8, PY + 6); c.lineTo(PX - 40, PY + 12); c.quadraticCurveTo(PX - 38, GY - 100, PX - 30, GY); c.fill();
    c.fillStyle = '#2f9e5b'; [[-64, PY - 26, 38], [-30, PY - 40, 32], [-96, PY - 4, 28], [4, PY - 22, 22]].forEach(([dx, y, r]) => { c.beginPath(); c.arc(PX + dx, y, r, 0, 7); c.fill(); });
    const pa = st.phase === 'swing' ? st.ang : AMPS[Math.min(st.jump, 2)] * Math.sin(OM * tt) * .3, vx = PX + L * Math.sin(pa), vy = PY + L * Math.cos(pa);
    c.strokeStyle = '#3c8d4f'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(PX, PY); c.lineTo(vx, vy); c.stroke(); c.strokeStyle = '#6fc96b'; c.lineWidth = 2; c.beginPath(); c.moveTo(PX, PY); c.lineTo(vx, vy); c.stroke();
    // poppetje
    let rot = st.rot, ax = st.x, ay = st.y;
    if (st.phase === 'land') { const k = (performance.now() - st.lt) / 1000; if (st.q === 'top') { ay -= Math.abs(Math.sin(k * 7)) * 22 * Math.exp(-k * 2); rot = 0; } else if (st.q === 'mid') { rot = k < .8 ? st.rot + k * 9 : 0; } else { rot = k < .35 ? st.rot : 1.45; ay += 10; } }
    if (st.phase !== 'swing' || true) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(ax, GY + 4, 28, 7, 0, 0, 7); c.fill(); }
    drawFull(c, look, ax, ay, 86, rot);
    if (st.phase === 'land') {
      const k = (performance.now() - st.lt) / 1000;
      if (st.q === 'bad') { const hx = ax + 30, hy = ay - 8; swirl(c, hx, hy, 11, k); for (let i = 0; i < 4; i++) { const a = k * 5 + i * 1.57; star(c, hx + Math.cos(a) * 30, hy - 26 + Math.sin(a) * 9, 7, '#ffc21a'); } bubble(c, ax, ay - 70, 'Ah balen!', '#e5484d'); }
      else if (st.q === 'top') bubble(c, ax, ay - 74, 'Geweldig! ' + nl(st.last) + ' m', '#2dbf6f'); else bubble(c, ax, ay - 74, 'Goed, ' + nl(st.last) + ' m', '#1f8ee6');
    }
    parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt; c.fillStyle = p.col; c.fillRect(p.x, p.y, 6, 6); }); for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
    c.restore();
    if (st.phase === 'swing') { c.fillStyle = '#22304a'; c.font = '800 15px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText('Tik om los te laten, hoog en naar voren is het verst', W / 2, H - 24); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  cv.onpointerdown = () => {
    if (st.phase !== 'swing') return; const now = performance.now(), t = (now - st.t0) / 1000, a = th(t), da = AMPS[st.jump] * OM * Math.cos(OM * t), p = pos(a), R = L + 26;
    st.x0 = p.x; st.y0 = p.y; st.vx = R * Math.cos(a) * da; st.vy = -R * Math.sin(a) * da; st.ft = now; st.phase = 'fly'; st.q2 = st.vx > 250 && st.vy < -100; beep(500, .1);
  };
  return () => { cancelAnimationFrame(raf); clearTimeout(tm); };
};

/* ---- Fruit hakken: marktkraam in Bo-Kaap, links en rechts afwisselen ---- */
RUN.fruit = (area, hud, look, finish) => {
  const { cv, c, W, H } = mkCanvas(area), GY = H * .5, FR = ['🍉', '🍍', '🥭', '🍊', '🍎', '🥝'], JC = ['#ff5a6e', '#ffd23f', '#ffa21a', '#ff9a2e', '#e8403a', '#8bd34a'];
  let count = 0, side = 0, started = false, t0 = 0, left = 10, done = false, raf, fi = 0, pop = 0, knife = 9, kdir = 1, shake = 0, msg = '', msgT = 0, T = 0;
  const pieces = [], drops = []; hud.textContent = 'Tik links, dan rechts, dan links';
  const loop = now => {
    const dt = Math.min(.05, (now - (loop.l || now)) / 1000); loop.l = now; T += dt;
    if (started && !done) { left = Math.max(0, 10 - (now - t0) / 1000); if (left <= 0) { done = true; beep(660, .3); finish(count); } hud.textContent = `${nl(left)} s, ${count} stukken`; }
    c.save(); if (shake > 0) { c.translate((Math.random() - .5) * shake * 8, 0); shake = Math.max(0, shake - dt * 5); }
    capeBG(c, W, H, GY, 0, T);
    const wood = c.createLinearGradient(0, GY, 0, H); wood.addColorStop(0, '#c58a52'); wood.addColorStop(1, '#8c5a32'); c.fillStyle = wood; c.fillRect(0, GY, W, H); c.strokeStyle = 'rgba(70,40,20,.25)'; c.lineWidth = 2; for (let y = GY + 30; y < H; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.fillStyle = '#f4ead2'; c.beginPath(); c.ellipse(W / 2, GY + 70, 120, 38, 0, 0, 7); c.fill(); c.strokeStyle = '#d2bf93'; c.lineWidth = 4; c.stroke();
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff' : '#e8503a'; c.beginPath(); c.moveTo(i * 48 - 4, 0); c.lineTo(i * 48 + 44, 0); c.lineTo(i * 48 + 44, 20); c.arc(i * 48 + 20, 20, 24, 0, Math.PI); c.fill(); }
    c.font = '110px sans-serif'; c.textAlign = 'center'; const sc2 = Math.min(1, pop += dt * 6); c.save(); c.translate(W / 2, GY + 62); c.scale(sc2, sc2); c.fillText(FR[fi], 0, 24 + Math.sin(T * 3) * 2); c.restore();
    pieces.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; p.r += p.vr * dt; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.beginPath(); c.rect(p.h ? 0 : -60, -60, 60, 120); c.clip(); c.font = '110px sans-serif'; c.textAlign = 'center'; c.fillText(p.e, p.h ? -0 : 0, 24); c.restore(); });
    drops.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.l -= dt; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, 4, 0, 7); c.fill(); });
    for (let i = pieces.length - 1; i >= 0; i--) if (pieces[i].y > H + 80) pieces.splice(i, 1); for (let i = drops.length - 1; i >= 0; i--) if (drops[i].l <= 0) drops.splice(i, 1);
    // mes
    knife = Math.min(1, knife + dt * 9); const ka = kdir * (-.9 + 1.5 * Math.min(1, knife * 1.3)); c.save(); c.translate(W / 2 + kdir * 70, GY - 40); c.rotate(ka * -1); c.fillStyle = '#4b2e1a'; rr(c, -8, 0, 16, 56, 6); c.fill(); const bl = c.createLinearGradient(-30, 0, 30, 0); bl.addColorStop(0, '#f2f6fa'); bl.addColorStop(1, '#9fb0c2'); c.fillStyle = bl; c.beginPath(); c.moveTo(-26, 0); c.lineTo(26, 0); c.lineTo(20, -96); c.quadraticCurveTo(0, -110, -26, -80); c.closePath(); c.fill(); c.restore();
    // zij-aanwijzing
    if (!done) { const a = .18 + .12 * Math.sin(T * 8); c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(side ? W / 2 : 0, GY, W / 2, H - GY); c.fillStyle = '#fff'; c.font = '800 28px "Baloo 2",sans-serif'; c.fillText(side ? 'TIK ▶' : '◀ TIK', side ? W * .75 : W * .25, H - 40); }
    if (msgT > 0) { msgT -= dt; c.fillStyle = '#e8403a'; c.font = '800 24px "Baloo 2",sans-serif'; c.fillText(msg, W / 2, GY - 70); }
    c.fillStyle = '#22304a'; c.font = '800 54px "Baloo 2",sans-serif'; c.fillText(count, W / 2, 90);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(40, 108, W - 80, 10); c.fillStyle = '#e8503a'; c.fillRect(40, 108, (W - 80) * left / 10, 10);
    c.restore(); raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  cv.onpointerdown = e => {
    if (done) return; const x = e.offsetX / (cv.clientWidth / W), s = x > W / 2 ? 1 : 0; if (!started) { started = true; t0 = performance.now(); }
    if (s !== side) { shake = 1; msg = 'Wissel van kant!'; msgT = .6; beep(120, .1, 'square', .06); return; }
    side = 1 - side; count++; knife = 0; kdir = s ? -1 : 1; beep(300 + (count % 8) * 40, .06); if (navigator.vibrate) try { navigator.vibrate(8); } catch (e2) {}
    pieces.push({ e: FR[fi], x: W / 2 - 4, y: GY + 62, vx: -120, vy: -260, r: 0, vr: -2, h: 0 }, { e: FR[fi], x: W / 2 + 4, y: GY + 62, vx: 120, vy: -260, r: 0, vr: 2, h: 1 });
    for (let i = 0; i < 12; i++) drops.push({ x: W / 2, y: GY + 60, vx: (Math.random() - .5) * 300, vy: -Math.random() * 300, col: JC[fi], l: .8 });
    fi = (fi + 1) % FR.length; pop = 0;
  };
  return () => cancelAnimationFrame(raf);
};

/* ---- Gondel stoppen: de kabelbaan van de Tafelberg ---- */
RUN.barrel = (area, hud, look, finish) => {
  const { cv, c, W, H } = mkCanvas(area), GY = H - 80, HEAD = GY - 92, BH = 70, MAX = 200; hud.textContent = 'Tik als de gondel boven je hoofd is';
  const delay = .8 + Math.random() * .9, hoverAt = HEAD - BH - 230, hoverLen = .5 + Math.random() * .4;
  let y = -100, vy = 0, st = 'wait', t = 0, raf, done = false, shake = 0, miss = null, T = 0;
  const loop = now => {
    const dt = Math.min(.05, (now - (loop.l || now)) / 1000); loop.l = now; T += dt; t += dt;
    if (!done) {   // na de tik blijft de gondel precies hangen waar hij was
      if (st === 'wait' && t > delay) st = 'fall1';
      if (st === 'fall1') { vy += 330 * dt; y += vy * dt; if (y >= hoverAt) { st = 'hover'; t = 0; vy = 0; } }
      else if (st === 'hover') { if (t > hoverLen) st = 'fall2'; }
      else if (st === 'fall2') { vy += 760 * dt; y += vy * dt; if (y + BH >= HEAD + MAX) end(); }
    }
    const sway = !done && (st === 'wait' || st === 'hover') ? Math.sin(T * 5) * 4 : 0;
    c.save(); if (shake > 0) { c.translate(0, (Math.random() - .5) * shake * 10); shake = Math.max(0, shake - dt * 4); }
    capeBG(c, W, H, GY - 20, 0, T); c.fillStyle = '#8bd36a'; c.fillRect(0, GY - 20, W, H); c.fillStyle = '#b79872'; rr(c, W / 2 - 90, GY - 10, 180, 40, 12); c.fill(); c.fillStyle = '#8a6c4a'; c.fillRect(W / 2 - 90, GY + 20, 180, 12);
    c.strokeStyle = '#3b4252'; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2 - 14, 0); c.lineTo(W / 2 - 14, H); c.moveTo(W / 2 + 14, 0); c.lineTo(W / 2 + 14, H); c.stroke();
    c.strokeStyle = '#e8503a'; c.lineWidth = 2; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(W / 2 - 80, HEAD); c.lineTo(W / 2 + 80, HEAD); c.stroke(); c.setLineDash([]);
    drawFull(c, look, W / 2, GY - 48, 100);
    c.save(); c.translate(W / 2 + sway, y); c.fillStyle = '#3b4252'; c.fillRect(-4, -30, 8, 32); rr(c, -22, -40, 44, 12, 6); c.fill(); c.fillStyle = '#d9dee6'; c.beginPath(); c.arc(-14, -34, 5, 0, 7); c.arc(14, -34, 5, 0, 7); c.fill();
    const g = c.createLinearGradient(0, 0, 0, BH); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd6e0'); c.fillStyle = g; rr(c, -54, 0, 108, BH, 22); c.fill(); c.fillStyle = '#4a90c8'; rr(c, -46, 8, 92, 30, 12); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(-46, 12, 92, 6); c.fillStyle = '#e8503a'; c.fillRect(-54, 44, 108, 8); c.fillStyle = '#1f8ee6'; c.fillRect(-54, 52, 108, 5);
    for (let i = -1; i <= 1; i++) { c.fillStyle = '#fff'; c.beginPath(); c.arc(i * 26, 24, 7, 0, 7); c.fill(); }
    c.restore();
    if (miss !== null) bubble(c, W / 2, 90, Math.round(miss) + ' px ernaast', miss < 14 ? '#2dbf6f' : miss < 50 ? '#1f8ee6' : '#e5484d');
    c.restore(); raf = requestAnimationFrame(loop);
  };
  function end() { if (done || st === 'wait') return; done = true; miss = Math.min(MAX, Math.abs(y + BH - HEAD)); shake = .25; beep(miss < 14 ? 700 : 200, .3); finish(Math.round(miss)); }
  raf = requestAnimationFrame(loop); cv.onpointerdown = () => end();
  return () => cancelAnimationFrame(raf);
};

/* ---- Strandrace: Muizenberg met krabben en getijdenpoelen ---- */
RUN.tilt = (area, hud, look, finish) => {
  const FW = Math.min(area.clientWidth - 24, 350), FH = Math.max(300, Math.min(400, area.clientHeight - 260)), R = 11, GAIN = 1100, MAXT = 60;
  const HOLES = [[.5, .2, 20], [.2, .34, 20], [.78, .4, 22], [.42, .52, 20], [.15, .68, 22], [.65, .74, 20], [.4, .88, 20]].map(([x, y, r]) => ({ x: x * FW, y: y * FH, r }));
  const CRABS = [{ y: .28 * FH, ph: 0, sp: .9 }, { y: .6 * FH, ph: 2, sp: 1.2 }, { y: .8 * FH, ph: 4, sp: .7 }];
  const START = { x: .1 * FW, y: .07 * FH }, GOAL = { x: .86 * FW, y: .93 * FH, r: 24 };
  const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center'; area.appendChild(wrap);
  const dpr = Math.min(2, devicePixelRatio || 1), cv = document.createElement('canvas'); cv.width = FW * dpr; cv.height = FH * dpr; cv.style.cssText = `width:${FW}px;height:${FH}px;border-radius:24px;border:4px solid #fff;box-shadow:0 8px 0 #c9a96a,0 14px 18px rgba(0,0,0,.25)`; wrap.appendChild(cv);
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  wrap.insertAdjacentHTML('beforeend', `<div class="padzone" id="pz"><div class="knob" id="kb"></div></div><button class="link" id="inv">Rolt de bal de verkeerde kant op? Draai om</button>`);
  let inv = 1; $('#inv').onclick = () => { inv = -inv; $('#inv').textContent = inv < 0 ? 'Besturing is omgedraaid, tik om terug te draaien' : 'Rolt de bal de verkeerde kant op? Draai om'; };
  const tilt = { x: 0, y: 0 }, keys = {}, pz = $('#pz'), kb = $('#kb');
  const setPad = e => { const b = pz.getBoundingClientRect(), r = b.width / 2; let dx = (e.clientX - b.left - r) / r, dy = (e.clientY - b.top - r) / r; const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } tilt.x = dx; tilt.y = dy; kb.style.left = (47 + dx * 45) + 'px'; kb.style.top = (47 + dy * 45) + 'px'; };
  pz.onpointerdown = e => { pz.setPointerCapture(e.pointerId); setPad(e); }; pz.onpointermove = e => { if (e.buttons || e.pressure) setPad(e); };
  pz.onpointerup = pz.onpointercancel = () => { tilt.x = tilt.y = 0; kb.style.left = kb.style.top = '47px'; };
  const kd = e => { keys[e.key] = true; }, ku = e => { keys[e.key] = false; }; window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const b = { x: START.x, y: START.y, vx: 0, vy: 0, pen: 0, falls: 0, t0: performance.now(), last: performance.now(), done: false, spin: 0 }; let raf, T = 0;
  const reset = () => { b.pen += 2; b.falls++; b.x = START.x; b.y = START.y; b.vx = b.vy = 0; beep(180, .25); };
  const loop = now => {
    const dt = Math.min(.05, (now - b.last) / 1000); b.last = now; T += dt;
    CRABS.forEach(cr => { cr.x = FW * (.5 + .42 * Math.sin(T * cr.sp + cr.ph)); });
    if (!b.done) {
      const tx = tilt.x + (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), ty = tilt.y + (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0), damp = Math.pow(.985, dt * 60);
      b.vx = (b.vx + inv * tx * GAIN * dt) * damp; b.vy = (b.vy + inv * ty * GAIN * dt) * damp; b.x += b.vx * dt; b.y += b.vy * dt; b.spin += b.vx * dt * .1;
      if (b.x < R) { b.x = R; b.vx *= -.4; } if (b.x > FW - R) { b.x = FW - R; b.vx *= -.4; } if (b.y < R) { b.y = R; b.vy *= -.4; } if (b.y > FH - R) { b.y = FH - R; b.vy *= -.4; }
      for (const hl of HOLES) if (Math.hypot(b.x - hl.x, b.y - hl.y) < hl.r - 4) reset();
      for (const cr of CRABS) if (Math.hypot(b.x - cr.x, b.y - cr.y) < 20) reset();
      const el = (now - b.t0) / 1000; if (Math.hypot(b.x - GOAL.x, b.y - GOAL.y) < GOAL.r - 4 || el >= MAXT) { b.done = true; beep(700, .3); finish(Math.round((Math.min(el, MAXT) + b.pen) * 10) / 10); }
    }
    const el = Math.min(MAXT, (now - b.t0) / 1000); hud.textContent = `${nl(el + b.pen)} s, gaten en krabben: ${b.falls}`;
    const sg = ctx.createLinearGradient(0, 0, 0, FH); sg.addColorStop(0, '#fbeec6'); sg.addColorStop(1, '#ecd39a'); ctx.fillStyle = sg; ctx.fillRect(0, 0, FW, FH);
    ctx.fillStyle = 'rgba(160,120,60,.18)'; for (let i = 0; i < 80; i++) ctx.fillRect((i * 97) % FW, (i * 53) % FH, 2, 2);
    HOLES.forEach((hl, i) => { ctx.fillStyle = '#d9c08a'; ctx.beginPath(); ctx.arc(hl.x, hl.y, hl.r + 5, 0, 7); ctx.fill(); const g = ctx.createRadialGradient(hl.x, hl.y, 2, hl.x, hl.y, hl.r); g.addColorStop(0, '#3ec6e8'); g.addColorStop(1, '#1479a8'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hl.x, hl.y, hl.r, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hl.x, hl.y, hl.r * (.4 + .3 * Math.sin(T * 2 + i)), 0, 7); ctx.stroke(); });
    CRABS.forEach(cr => { ctx.fillStyle = '#e8503a'; ctx.beginPath(); ctx.ellipse(cr.x, cr.y, 15, 10, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#e8503a'; ctx.lineWidth = 3; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cr.x + s * 12, cr.y - 3); ctx.lineTo(cr.x + s * 22, cr.y - 12); ctx.moveTo(cr.x + s * 10, cr.y + 4); ctx.lineTo(cr.x + s * 20, cr.y + 10 + Math.sin(T * 12) * 2); ctx.stroke(); ctx.fillStyle = '#e8503a'; ctx.beginPath(); ctx.arc(cr.x + s * 23, cr.y - 13, 5, 0, 7); ctx.fill(); } ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cr.x - 5, cr.y - 8, 3, 0, 7); ctx.arc(cr.x + 5, cr.y - 8, 3, 0, 7); ctx.fill(); ctx.fillStyle = '#22304a'; ctx.fillRect(cr.x - 6, cr.y - 9, 2, 2); ctx.fillRect(cr.x + 4, cr.y - 9, 2, 2); });
    ctx.fillStyle = '#8de39a'; ctx.beginPath(); ctx.arc(GOAL.x, GOAL.y, GOAL.r, 0, 7); ctx.fill(); ctx.fillStyle = '#22304a'; ctx.fillRect(GOAL.x - 1, GOAL.y - 16, 2.5, 28); HCOL.slice(0, 3).forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(GOAL.x + 1, GOAL.y - 16 + i * 5, 16, 5); });
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(b.x + 3, b.y + 6, R, R * .6, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin); ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.clip(); ['#ff4f8b', '#fff', '#ffc21a', '#fff', '#35c4d9', '#fff'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R + 2, i * 1.047, (i + 1) * 1.047); ctx.fill(); }); ctx.restore(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(b.x - 3, b.y - 4, 3, 0, 7); ctx.fill();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
};

/* ---- Dierengeheugen: Kaapse dieren op Bo-Kaap huisjes ---- */
RUN.memory = (area, hud, look, finish) => {
  const COL = ['#35c4d9', '#ffc21a', '#ff4f8b', '#7bdc5a'], AN = ['🐧', '🐒', '🦩', '🦭'], TONE = [262, 330, 392, 523];
  area.classList.add('cape'); area.style.background = 'linear-gradient(180deg,#46aeee,#dff3fb)';
  area.insertAdjacentHTML('beforeend', `<div class="hud" id="h2" style="font-size:30px;position:relative;z-index:1"></div><div class="hud" id="h3" style="position:relative;z-index:1"></div><div class="mgrid" style="position:relative;z-index:1">${AN.map((a, i) => `<button class="mcell" id="m${i}" style="background:linear-gradient(${COL[i]},${shade(COL[i], .8)})" aria-label="Dier ${i + 1}"><span class="roof"></span>${a}</button>`).join('')}</div>`);
  const seq = []; let idx = 0, alive = true, input = false, over = false, speed = 520;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const light = (i, ms) => { const el = $('#m' + i); if (!el) return; el.classList.add('lit'); beep(TONE[i], ms / 1000); setTimeout(() => el.classList.remove('lit'), ms); };
  const next = async () => {
    if (!seq.length) seq.push(ri(4)); seq.push(ri(4)); speed = Math.max(220, 520 - seq.length * 28); $('#h2').textContent = 'Ronde ' + (seq.length - 1); $('#h3').textContent = 'Kijk goed'; input = false; await sleep(700);
    for (const a of seq) { if (!alive) return; light(a, speed * .8); await sleep(speed); }
    idx = 0; input = true; if (alive) $('#h3').textContent = 'Nu jij';
  };
  next();
  AN.forEach((_, i) => $('#m' + i).onpointerdown = () => {
    if (!input || over) return; light(i, 160);
    if (seq[idx] !== i) { over = true; input = false; $('#h3').textContent = 'Ah balen, dat was het'; finish(seq.length - 2); return; }
    idx++; if (idx === seq.length) { input = false; setTimeout(() => alive && next(), 600); }
  });
  return () => { alive = false; };
};

/* ---- Noenschot: het kanon op Signal Hill ---- */
RUN.react = (area, hud, look, finish) => {
  const { cv, c, W, H } = mkCanvas(area), GY = H * .62, times = []; let st = 'idle', tm, t0, raf, T = 0, fl = 0, shake = 0, msg = 'Tik om te beginnen', done = false, bird = -1, smoke = [];
  const next = () => {
    if (times.length >= 3) { done = true; finish(Math.round(times.reduce((a, b) => a + b, 0) / 3)); return; }
    st = 'wait'; hud.textContent = `Poging ${times.length + 1} van 3`; msg = 'Wacht op het schot'; if (Math.random() < .7) tm = setTimeout(() => bird = 0, 600 + Math.random() * 800);
    setTimeout(() => { if (st === 'wait') tm = setTimeout(fire, 0); }, 1800 + Math.random() * 2800);
  };
  const fire = () => { if (st !== 'wait') return; st = 'go'; t0 = performance.now(); fl = 1; shake = 1; msg = 'NU'; beep(90, .5, 'sawtooth', .2); for (let i = 0; i < 14; i++) smoke.push({ x: W * .66, y: GY - 62, vx: 40 + Math.random() * 90, vy: -Math.random() * 40, r: 8, l: 1.6 }); };
  const loop = now => {
    const dt = Math.min(.05, (now - (loop.l || now)) / 1000); loop.l = now; T += dt; fl = Math.max(0, fl - dt * 3); shake = Math.max(0, shake - dt * 4);
    c.save(); c.translate((Math.random() - .5) * shake * 10, (Math.random() - .5) * shake * 10); capeBG(c, W, H, GY, 0, T);
    c.fillStyle = '#8bd36a'; c.fillRect(0, GY, W, H); c.fillStyle = '#5fae4b'; c.fillRect(0, GY, W, 8); c.fillStyle = '#8c8c94'; c.beginPath(); c.moveTo(0, GY + 60); c.lineTo(W, GY + 40); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    c.save(); c.translate(W * .45, GY + 8); c.fillStyle = '#7b4f2d'; rr(c, -44, 4, 140, 24, 6); c.fill(); for (const x of [0, 70]) { c.fillStyle = '#5f3b20'; c.beginPath(); c.arc(x, 30, 26, 0, 7); c.fill(); c.fillStyle = '#e8c07a'; c.beginPath(); c.arc(x, 30, 10, 0, 7); c.fill(); }
    const bg = c.createLinearGradient(0, -50, 0, 10); bg.addColorStop(0, '#6b7280'); bg.addColorStop(1, '#1f2430'); c.fillStyle = bg; c.save(); c.rotate(-.15); rr(c, -30, -50, 150, 44, 18); c.fill(); c.fillStyle = '#ffc21a'; c.fillRect(30, -50, 8, 44); c.fillRect(80, -50, 8, 44); c.restore(); c.restore();
    if (fl > 0) { const g = c.createRadialGradient(W * .69, GY - 60, 4, W * .69, GY - 60, 70 * fl + 10); g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(.4, 'rgba(255,170,40,.9)'); g.addColorStop(1, 'rgba(255,120,0,0)'); c.fillStyle = g; c.fillRect(0, GY - 160, W, 200); }
    smoke.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.r += dt * 26; s.l -= dt; c.fillStyle = `rgba(235,235,240,${Math.max(0, s.l / 1.6) * .8})`; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); });
    if (bird >= 0) { bird += dt; const bx = -30 + bird * 150, by = 120 + Math.sin(bird * 3) * 12; c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx - 16, by - 4 + Math.sin(T * 14) * 6); c.quadraticCurveTo(bx - 6, by - 10, bx, by); c.quadraticCurveTo(bx + 6, by - 10, bx + 16, by - 4 + Math.sin(T * 14) * 6); c.stroke(); if (bx > W + 40) bird = -1; }
    drawFull(c, look, W * .2, GY + 30, 110); c.restore();
    c.fillStyle = st === 'go' ? '#2dbf6f' : '#22304a'; c.font = '800 34px "Baloo 2",sans-serif'; c.textAlign = 'center'; c.fillText(msg, W / 2, 80);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop); hud.textContent = 'Drie pogingen';
  cv.onpointerdown = () => {
    if (done) return;
    if (st === 'idle') { next(); return; }
    if (st === 'wait') { clearTimeout(tm); st = 'pause'; times.push(500); msg = 'Te vroeg, 500 ms erbij'; beep(120, .2, 'square', .08); setTimeout(next, 1200); }
    else if (st === 'go') { const ms = Math.min(500, performance.now() - t0); times.push(ms); st = 'pause'; msg = Math.round(ms) + ' ms'; beep(660, .12); setTimeout(next, 1300); }
  };
  return () => { cancelAnimationFrame(raf); clearTimeout(tm); };
};

/* ---- Bo-Kaap toren: huisjes stapelen ---- */
RUN.stack = (area, hud, look, finish) => {
  const { cv, c, W, H } = mkCanvas(area), BH = 34, GYB = H - 50; const blocks = [{ x: W / 2 - 80, wd: 160 }], cur = { x: 0, wd: 160, dir: 1 };
  let n = 0, done = false, raf, cam = 0, T = 0, msg = '', msgT = 0; hud.textContent = 'Huisjes: 0';
  const house = (x, y, wd, i) => { c.fillStyle = HCOL[mod(i, 8)]; c.fillRect(x, y, wd, BH); c.fillStyle = '#fff'; c.fillRect(x - 2, y - 4, wd + 4, 6); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, y + BH - 6, wd, 6); const k = Math.max(1, Math.floor(wd / 32)); for (let j = 0; j < k; j++) { c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(x + (j + .5) * wd / k - 6, y + 9, 12, 16); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + (j + .5) * wd / k - 1, y + 9, 2, 16); } };
  const loop = now => {
    const dt = Math.min(.05, (now - (loop.l || now)) / 1000); loop.l = now; T += dt;
    if (!done) { cur.x += cur.dir * (190 + n * 18) * dt; if (cur.x < 0) { cur.x = 0; cur.dir = 1; } if (cur.x + cur.wd > W) { cur.x = W - cur.wd; cur.dir = -1; } }
    cam += (Math.max(0, blocks.length - 8) * BH - cam) * Math.min(1, dt * 6);
    capeBG(c, W, H + cam * 0, H - 120 + cam * .6, 0, T); c.fillStyle = '#8bd36a'; c.fillRect(0, GYB + cam, W, H); c.fillStyle = '#5fae4b'; c.fillRect(0, GYB + cam, W, 6);
    blocks.forEach((b, i) => house(b.x, GYB - (i + 1) * BH + cam, b.wd, i)); if (!done) house(cur.x, GYB - (blocks.length + 1) * BH + cam, cur.wd, blocks.length);
    if (msgT > 0) { msgT -= dt; c.fillStyle = '#ffc21a'; c.strokeStyle = '#6b4300'; c.lineWidth = 4; c.font = '800 30px "Baloo 2",sans-serif'; c.textAlign = 'center'; c.strokeText(msg, W / 2, 110); c.fillText(msg, W / 2, 110); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  cv.onpointerdown = () => {
    if (done) return; const p = blocks[blocks.length - 1], ov = Math.min(cur.x + cur.wd, p.x + p.wd) - Math.max(cur.x, p.x);
    if (ov <= 4) { done = true; hud.textContent = `Omgevallen, ${n} huisjes`; beep(150, .5); finish(n); return; }
    const perfect = Math.abs(cur.x - p.x) < 4; let wd = ov, x = Math.max(cur.x, p.x); if (perfect) { x = p.x; wd = p.wd; msg = 'Perfect!'; msgT = .8; }
    blocks.push({ x, wd }); n++; cur.wd = wd; cur.dir = n % 2 ? 1 : -1; cur.x = n % 2 ? 0 : W - wd; hud.textContent = 'Huisjes: ' + n; beep(300 + n * 25, .1);
  };
  return () => cancelAnimationFrame(raf);
};

/* ---- Mikken op de gong: kokosnoten met wind ---- */
RUN.dart = (area, hud, look, finish) => {
  const { cv, c, W, H } = mkCanvas(area), GY = H * .66, cx = W / 2, cy = H * .3, R = 105, shots = []; let raf, done = false, lock = 0, T = 0, fly = null, wind = (Math.random() - .5) * 2, gong = 0;
  const posAt = t => { const k = shots.length; return { x: cx + (R + 30) * Math.sin(t * (1.9 + k * .5) + wind * Math.sin(t * .7)), y: cy + (R + 30) * Math.sin(t * (2.5 + k * .55) + 1) }; };
  const total = () => shots.reduce((a, b) => a + b.pts, 0);
  const loop = now => {
    const dt = Math.min(.05, (now - (loop.l || now)) / 1000); loop.l = now; T += dt; gong = Math.max(0, gong - dt * 2);
    hud.textContent = `Worp ${Math.min(shots.length + 1, 3)} van 3, totaal ${total()} punten`;
    capeBG(c, W, H, GY, 0, T); c.fillStyle = '#8bd36a'; c.fillRect(0, GY, W, H); c.fillStyle = '#5fae4b'; c.fillRect(0, GY, W, 8);
    c.fillStyle = '#7b4f2d'; rr(c, cx - R - 22, cy - R - 24, 14, R * 2 + 60, 6); c.fill(); rr(c, cx + R + 8, cy - R - 24, 14, R * 2 + 60, 6); c.fill(); rr(c, cx - R - 22, cy - R - 30, R * 2 + 44, 14, 6); c.fill();
    c.save(); c.translate(cx, cy); c.rotate(Math.sin(T * 30) * gong * .03); const cols = ['#c8873a', '#ffe08a', '#e8503a', '#ffe08a', '#c8873a']; [R, R * .8, R * .6, R * .4, R * .2].forEach((r, i) => { const g = c.createRadialGradient(-r * .3, -r * .3, 2, 0, 0, r); g.addColorStop(0, '#fff6c8'); g.addColorStop(1, cols[i]); c.fillStyle = i === 3 ? '#e8503a' : g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.strokeStyle = 'rgba(80,50,10,.5)'; c.lineWidth = 2; c.stroke(); }); c.restore();
    shots.forEach((s, i) => { c.fillStyle = '#5b3a1c'; c.beginPath(); c.arc(s.x, s.y, 10, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '800 11px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText(s.pts, s.x, s.y + 4); });
    if (fly) { fly.t += dt / .35; const k = Math.min(1, fly.t), x = fly.x0 + (fly.x - fly.x0) * k, y = fly.y0 + (fly.y - fly.y0) * k - Math.sin(k * Math.PI) * 60, s = 1 - .55 * k; c.fillStyle = '#5b3a1c'; c.beginPath(); c.arc(x, y, 18 * s, 0, 7); c.fill(); if (k >= 1) { const sh = fly.shot; fly = null; shots.push(sh); gong = 1; beep(150 + sh.pts * 3, .5, 'sine', .2); if (shots.length >= 3) { done = true; hud.textContent = `Totaal ${total()} punten`; finish(total()); } } }
    if (!done && !fly) { const p = posAt(T); c.strokeStyle = '#22304a'; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, 15, 0, 7); c.moveTo(p.x - 24, p.y); c.lineTo(p.x + 24, p.y); c.moveTo(p.x, p.y - 24); c.lineTo(p.x, p.y + 24); c.stroke(); }
    c.fillStyle = '#22304a'; c.font = '800 15px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText('Wind ' + (wind > 0 ? '▶' : '◀') + ' ' + Math.round(Math.abs(wind) * 10), 60, H - 20);
    drawFull(c, look, W / 2, GY + 64, 120);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  cv.onpointerdown = () => {
    if (done || fly || performance.now() - lock < 350) return; lock = performance.now(); const p = posAt(T), d = Math.hypot(p.x - cx, p.y - cy), pts = Math.max(0, Math.round(100 * (1 - d / R)));
    fly = { t: 0, x0: W / 2, y0: GY + 40, x: p.x, y: p.y, shot: { x: p.x, y: p.y, pts } }; wind = (Math.random() - .5) * 2; beep(300, .1);
  };
  return () => cancelAnimationFrame(raf);
};

/* ---- Surfen bij Muizenberg: haaien en rotsen ontwijken ---- */
RUN.surf = (area, hud, look, finish) => {
  const { cv, c, W, H } = mkCanvas(area), LX = [W * .22, W * .5, W * .78], HY = H * .27, PY = H * .8; let lane = 1, px = LX[1], raf, T = 0, el = 0, stars = 0, dead = false, tdead = 0, spawnT = 2.2; const obs = [], spl = [];
  const ys = f => HY + (PY + 40 - HY) * f * f;           // f 0..1.1 perspectief
  const loop = now => {
    const dt = Math.min(.05, (now - (loop.l || now)) / 1000); loop.l = now; T += dt;
    if (!dead) { el += dt; px += (LX[lane] - px) * Math.min(1, dt * 12); spawnT -= dt; const sp = .5 + Math.min(.7, el * .016);
      if (spawnT <= 0) { spawnT = Math.max(.42, 1.05 - el * .02); const free = ri(3), types = ['shark', 'rock', 'buoy']; for (let l = 0; l < 3; l++) { if (l === free) { if (Math.random() < .5) obs.push({ l, f: 0, t: 'star', s: sp }); continue; } if (Math.random() < .75) obs.push({ l, f: 0, t: types[ri(3)], s: sp }); } }
      for (const o of obs) { o.f += o.s * dt; if (o.f > .86 && o.f < 1.02 && o.l === lane) { if (o.t === 'star') { if (!o.got) { o.got = true; stars++; beep(880, .1); } } else { dead = true; tdead = T; beep(120, .5, 'sawtooth', .15); finish(Math.round((el + stars * 2) * 10) / 10); for (let i = 0; i < 20; i++) spl.push({ x: px, y: PY, vx: (Math.random() - .5) * 240, vy: -Math.random() * 280, l: 1 }); } } }
      for (let i = obs.length - 1; i >= 0; i--) if (obs[i].f > 1.2 || obs[i].got) obs.splice(i, 1);
      if (el >= 60) { dead = true; tdead = T; finish(60 + stars * 2); } hud.textContent = `${nl(el)} s, sterren: ${stars}`; }
    capeBG(c, W, H, HY, 0, T);
    const sg = c.createLinearGradient(0, HY, 0, H); sg.addColorStop(0, '#32c3dc'); sg.addColorStop(1, '#0f78a8'); c.fillStyle = sg; c.fillRect(0, HY, W, H - HY);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; for (let i = 0; i < 12; i++) { const f = mod(i / 12 + T * .35, 1), y = ys(f), w2 = 40 + f * 420; c.beginPath(); c.moveTo(W / 2 - w2 / 2 + Math.sin(T * 2 + i) * 8, y); c.quadraticCurveTo(W / 2, y - 6 - f * 12, W / 2 + w2 / 2, y); c.stroke(); }
    obs.slice().sort((a, b) => a.f - b.f).forEach(o => { const y = ys(o.f), sc2 = .25 + o.f * .95, x = W / 2 + (LX[o.l] - W / 2) * (.35 + o.f * .65); c.save(); c.translate(x, y); c.scale(sc2, sc2);
      if (o.t === 'shark') { c.fillStyle = '#5b6677'; c.beginPath(); c.moveTo(-26, 8); c.quadraticCurveTo(-8, -50, 6, -52); c.quadraticCurveTo(10, -20, 28, 8); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(0, 10, 36, 7, 0, 0, 7); c.fill(); }
      if (o.t === 'rock') { c.fillStyle = '#5a5148'; c.beginPath(); c.moveTo(-30, 10); c.lineTo(-18, -26); c.lineTo(6, -34); c.lineTo(30, 10); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(0, 10, 38, 7, 0, 0, 7); c.fill(); }
      if (o.t === 'buoy') { c.fillStyle = '#e8503a'; c.beginPath(); c.arc(0, -14, 20, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(-20, -22, 40, 8); c.fillStyle = '#e8503a'; c.fillRect(-4, -48, 8, 20); }
      if (o.t === 'star') star(c, 0, -18, 24 + Math.sin(T * 8) * 3, '#ffc21a');
      c.restore(); });
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(px, PY + 36, 40, 10, 0, 0, 7); c.fill();
    c.save(); c.translate(px, PY + 30); if (dead) c.rotate((T - tdead) * 5); c.fillStyle = '#ff4f8b'; c.beginPath(); c.ellipse(0, 6, 22, 44, 0, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -36); c.lineTo(0, 46); c.stroke(); c.restore();
    drawFull(c, look, px + (lane - 1) * -2, PY - 6, 108, dead ? (T - tdead) * 5 : (px - LX[lane]) * -.004);
    spl.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.l -= dt; c.fillStyle = `rgba(255,255,255,${Math.max(0, p.l)})`; c.beginPath(); c.arc(p.x, p.y, 5, 0, 7); c.fill(); });
    if (el < 3 && !dead) { c.fillStyle = '#fff'; c.font = '800 20px "Baloo 2",sans-serif'; c.textAlign = 'center'; c.fillText('Tik links of rechts om te sturen', W / 2, H - 30); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  cv.onpointerdown = e => { if (dead) return; const x = e.offsetX / (cv.clientWidth / W); lane = Math.max(0, Math.min(2, lane + (x > W / 2 ? 1 : -1))); beep(400 + lane * 80, .05); };
  return () => cancelAnimationFrame(raf);
};

/* ---- Baviaantjes vangen: Bo-Kaap ramen ---- */
RUN.baboon = (area, hud, look, finish) => {
  const { cv, c, W, H } = mkCanvas(area), TOP = H * .16, WW = 96, WH = 104, cols = 3, rows = 3, gx = (W - cols * WW) / (cols + 1), gy = ((H - TOP - 30) - rows * WH) / (rows + 1); let raf, T = 0, t0 = performance.now(), score = 0, bad = 0, done = false, spawnT = 1, msg = '', msgT = 0; const slots = Array.from({ length: 9 }, () => ({ s: 0, t: 0, type: 'b', hit: 0 })), fx = [];
  const wx = i => gx + (i % 3) * (WW + gx), wy = i => TOP + 24 + gy + Math.floor(i / 3) * (WH + gy);
  const loop = now => {
    const dt = Math.min(.05, (now - (loop.l || now)) / 1000); loop.l = now; T += dt; const left = Math.max(0, 15 - (now - t0) / 1000);
    if (!done) { hud.textContent = `${nl(left)} s, gevangen: ${score}`; spawnT -= dt; if (spawnT <= 0) { spawnT = Math.max(.35, .85 - (15 - left) * .03); const free = slots.map((s, i) => i).filter(i => !slots[i].s); if (free.length) { const i = free[ri(free.length)]; Object.assign(slots[i], { s: 1, t: Math.max(.55, 1.1 - (15 - left) * .035), type: Math.random() < .2 ? 'g' : 'b', hit: 0 }); } }
      slots.forEach(s => { if (s.s) { s.t -= dt; if (s.t <= 0) s.s = 0; } }); if (left <= 0) { done = true; beep(660, .3); finish(Math.max(0, score - bad * 3)); } }
    capeBG(c, W, H, TOP, 0, T); c.fillStyle = '#ffd1dc'; c.fillRect(0, TOP, W, H); c.fillStyle = '#fff'; c.fillRect(0, TOP - 6, W, 12); c.fillStyle = '#ff4f8b'; c.fillRect(0, TOP + 6, W, 10);
    slots.forEach((s, i) => { const x = wx(i), y = wy(i); c.fillStyle = '#fff'; rr(c, x - 6, y - 6, WW + 12, WH + 12, 10); c.fill(); c.fillStyle = '#2a2f45'; rr(c, x, y, WW, WH, 6); c.fill();
      if (s.s || s.hit) { const k = s.hit ? Math.max(0, 1 - (T - s.hit) * 3) : Math.min(1, (1.1 - s.t) * 6 + .2), up = Math.min(1, k); c.save(); c.beginPath(); c.rect(x, y, WW, WH); c.clip(); c.font = '74px sans-serif'; c.textAlign = 'center'; c.fillText(s.type === 'g' ? '👵' : '🐒', x + WW / 2, y + WH + 20 - up * 70 - (s.hit ? (T - s.hit) * 60 : 0)); c.restore(); }
      c.fillStyle = i % 2 ? '#35c4d9' : '#7bdc5a'; c.fillRect(x - 22, y - 4, 18, WH + 8); c.fillRect(x + WW + 4, y - 4, 18, WH + 8); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - 18, y, 4, WH); c.fillRect(x + WW + 8, y, 4, WH); });
    fx.forEach(p => { p.l -= dt; star(c, p.x, p.y - (1 - p.l) * 30, 8 + p.l * 6, '#ffc21a'); }); for (let i = fx.length - 1; i >= 0; i--) if (fx[i].l <= 0) fx.splice(i, 1);
    if (msgT > 0) { msgT -= dt; c.fillStyle = '#e8403a'; c.font = '800 24px "Baloo 2",sans-serif'; c.textAlign = 'center'; c.fillText(msg, W / 2, TOP + 20); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop); hud.textContent = 'Tik de baviaantjes, niet de oma';
  cv.onpointerdown = e => { if (done) return; const k = cv.clientWidth / W, x = e.offsetX / k, y = e.offsetY / k; for (let i = 0; i < 9; i++) { if (x > wx(i) && x < wx(i) + WW && y > wy(i) && y < wy(i) + WH && slots[i].s) { const s = slots[i]; s.s = 0; s.hit = T; fx.push({ x: wx(i) + WW / 2, y: wy(i) + 30, l: 1 }); if (s.type === 'g') { bad++; msg = 'Oeps, de oma! min 3'; msgT = .9; beep(150, .2, 'square', .08); } else { score++; beep(500 + score * 12, .06); } return; } } };
  return () => cancelAnimationFrame(raf);
};

/* ---- Penalty trappen: Springbok stijl bij het stadion ---- */
RUN.kick = (area, hud, look, finish) => {
  const { cv, c, W, H } = mkCanvas(area), GY = H * .5, GX = W / 2; let raf, T = 0, step = 0, aim = 0, pw = 0, kicks = [], ball = null, msg = '', msgT = 0, done = false, ph = 0, sweep = 0;
  const total = () => kicks.reduce((a, b) => a + b, 0);
  const loop = now => {
    const dt = Math.min(.05, (now - (loop.l || now)) / 1000); loop.l = now; T += dt;
    if (step === 0) { ph += dt * (2.2 + kicks.length * .5); sweep = Math.sin(ph); } if (step === 1) { ph += dt * (2.6 + kicks.length * .6); sweep = Math.sin(ph); }
    hud.textContent = `Trap ${Math.min(kicks.length + 1, 3)} van 3, totaal ${total()} punten`;
    capeBG(c, W, H, GY, 0, T);
    c.fillStyle = '#f4f4f6'; c.beginPath(); c.ellipse(W * .18, GY - 18, 90, 26, 0, 0, 7); c.fill(); c.fillStyle = '#cfd6e0'; c.fillRect(W * .18 - 90, GY - 18, 180, 18); for (let i = 0; i < 14; i++) { c.fillStyle = HCOL[i % 8]; c.fillRect(W * .18 - 80 + i * 12, GY - 30 + (i % 3), 5, 5); }
    const gr = c.createLinearGradient(0, GY, 0, H); gr.addColorStop(0, '#66bb4a'); gr.addColorStop(1, '#3f8a38'); c.fillStyle = gr; c.fillRect(0, GY, W, H); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(0, GY + 30 + i * 70); c.lineTo(W, GY + 30 + i * 70); c.stroke(); }
    c.strokeStyle = '#f4f4f6'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(GX - 55, GY + 8); c.lineTo(GX - 55, GY - 200); c.moveTo(GX + 55, GY + 8); c.lineTo(GX + 55, GY - 200); c.moveTo(GX - 55, GY - 62); c.lineTo(GX + 55, GY - 62); c.moveTo(GX, GY + 8); c.lineTo(GX, GY - 62); c.stroke();
    const bx0 = W / 2, by0 = H - 130;
    drawFull(c, look, bx0 - 50, by0 + 10, 120);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(bx0 + 10, by0 + 50, 18, 6, 0, 0, 7); c.fill();
    if (!ball) { c.save(); c.translate(bx0 + 10, by0 + 38); c.rotate(.4); c.fillStyle = '#f4ead2'; c.beginPath(); c.ellipse(0, 0, 18, 11, 0, 0, 7); c.fill(); c.strokeStyle = '#8c5a32'; c.lineWidth = 2; c.stroke(); c.restore(); }
    else { ball.t += dt / 1.1; const k = Math.min(1, ball.t), x = bx0 + 10 + (ball.x - bx0 - 10) * k, y = by0 + 38 + (ball.y - by0 - 38) * k - Math.sin(k * Math.PI) * 90, s2 = 1 - .6 * k; c.save(); c.translate(x, y); c.rotate(k * 14); c.scale(s2, s2); c.fillStyle = '#f4ead2'; c.beginPath(); c.ellipse(0, 0, 18, 11, 0, 0, 7); c.fill(); c.strokeStyle = '#8c5a32'; c.lineWidth = 2; c.stroke(); c.restore();
      if (k >= 1) { const b = ball; ball = null; kicks.push(b.pts); msg = b.pts >= 70 ? 'Door de palen!' : b.pts > 0 ? 'Net niet' : (b.side ? 'Ernaast!' : b.high ? 'Te hoog!' : 'Te kort!'); msgT = 1.3; beep(b.pts >= 70 ? 700 : 160, .3); if (kicks.length >= 3) { done = true; finish(total()); } else { step = 0; ph = 0; } } }
    if (!done && !ball) { c.fillStyle = 'rgba(255,255,255,.85)'; rr(c, 40, H - 52, W - 80, 20, 10); c.fill(); if (step === 0) { c.fillStyle = '#e8503a'; c.fillRect(W / 2 - 3, H - 54, 6, 24); c.fillStyle = '#22304a'; c.beginPath(); c.arc(W / 2 + sweep * (W / 2 - 50), H - 42, 11, 0, 7); c.fill(); c.font = '800 16px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText('Richting: tik als de bal in het midden is', W / 2, H - 62); }
      if (step === 1) { const p = (sweep + 1) / 2; c.fillStyle = '#7bdc5a'; c.fillRect(40 + (W - 80) * .68, H - 52, (W - 80) * .2, 20); c.fillStyle = '#22304a'; c.beginPath(); c.arc(40 + (W - 80) * p, H - 42, 11, 0, 7); c.fill(); c.font = '800 16px Nunito,sans-serif'; c.textAlign = 'center'; c.fillText('Kracht: tik in het groene stuk', W / 2, H - 62); } }
    if (!ball && !done) { const ax = GX + (step === 0 ? 0 : aim) * 150; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.setLineDash([6, 8]); c.beginPath(); c.moveTo(bx0 + 10, by0 + 30); c.lineTo(ax, GY - 100); c.stroke(); c.setLineDash([]); }
    if (msgT > 0) { msgT -= dt; bubble(c, W / 2, GY - 110, msg, msg === 'Door de palen!' ? '#2dbf6f' : '#e5484d'); }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  cv.onpointerdown = () => {
    if (done || ball) return;
    if (step === 0) { aim = sweep; step = 1; ph = 0; beep(420, .08); return; }
    const p = (sweep + 1) / 2, ex = GX + aim * 150, ey = GY - 60 - (p - .55) * 400, inX = Math.abs(ex - GX) < 55, inY = ey < GY - 62 && ey > GY - 205, pts = Math.max(0, Math.round(100 - Math.abs(aim) * 110 - Math.abs(p - .78) * 260));
    ball = { t: 0, x: ex, y: ey, pts: inX && inY ? Math.max(40, pts) : Math.min(30, pts), side: !inX, high: ey <= GY - 205 }; beep(260, .12);
  };
  return () => cancelAnimationFrame(raf);
};

/* ---- beoordeling en eindscherm met ingezoomd poppetje ---- */
const RATE = { vine: [38, 22], fruit: [45, 30], barrel: [15, 60], tilt: [26, 42], react: [280, 380], stack: [10, 5], dart: [220, 130], surf: [32, 16], baboon: [16, 9], kick: [210, 120], memory: [7, 4] };
function rateScore(g, sc) { const [a, b] = RATE[g]; if (GAMES[g].better === 'high') return sc >= a ? 'good' : sc >= b ? 'mid' : 'bad'; return sc <= a ? 'good' : sc <= b ? 'mid' : 'bad'; }

/* ---- uitslag ---- */
const FACE = { 1: 'rotateX(0deg)', 2: 'rotateX(-90deg)', 3: 'rotateY(-90deg)', 4: 'rotateY(90deg)', 5: 'rotateX(90deg)', 6: 'rotateY(180deg)' };
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const faceHTML = n => `<div class="face f${n}">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n].includes(i) ? 'p' : ''}"></i>`).join('')}</div>`;
const cubeHTML = n => `<div class="cw"><div class="cube roll" data-n="${n}" style="transform:rotateX(-22deg) rotateY(-28deg)">${[1, 2, 3, 4, 5, 6].map(faceHTML).join('')}</div></div>`;
const TILE_TXT = { bonus: 'Bonusvakje, 2 vooruit', trap: 'Val, 2 terug', shortcut: 'Shortcut, 4 vooruit', finish: 'De top' };
VIEWS.result = () => {
  const r = S.room, lr = r.lastResult; if (!lr) return go('room');
  const list = Object.values(lr.results).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)), pend = !!r.pendingThrow, mine = lr.results.me;
  app.innerHTML = `<div class="screen sunset cape"><div class="pad-body">
    <h1>Uitslag van ${lr.label}</h1>
    ${list.map(x => { const p = r.players.find(q => q.id === x.id); if (!p) return ''; return `<div class="card" style="margin-top:14px;border-left:10px solid ${p.color}">
      <div class="row">${avatarSVG(p.look, 60, p.color)}<div style="flex:1;min-width:0"><div style="font-family:var(--display);font-size:21px;font-weight:800;line-height:1.1">${esc(p.name)}${x.rank === 1 ? '<span class="medal">Dagwinnaar</span>' : ''}</div>
      <div class="muted" style="font-size:13px">${x.played ? 'Plek ' + x.rank + ', ' + x.points + ' punten' : 'Niet alles gespeeld, dus geen dobbelstenen'}</div></div></div>
      ${x.played ? Object.entries(x.perGame).map(([g, v]) => `<div class="rline">${GAMES[g].icon} ${GAMES[g].title}: ${GAMES[g].fmt(v.score)}, plek ${v.rank}, ${v.points} punten</div>`).join('') +
        (pend ? `<div class="rline" style="font-weight:800">🎲 ${x.rolls.length} ${x.rolls.length === 1 ? 'dobbelsteen' : 'dobbelstenen'} om te gooien</div>` :
        `<div class="dice" data-rolls="${x.rolls.join(',')}">${x.rolls.map(cubeHTML).join('')}</div>
         <div class="sum" data-sum>${x.rolls.join(' + ')} = ${x.rolls.reduce((a, b) => a + b, 0)}</div>
         <div class="rline sum" data-sum>Van vakje ${x.from} naar ${x.landed}${x.tile !== 'normal' ? ', ' + TILE_TXT[x.tile] + ', nu op ' + x.to : ''}</div>`) : ''}</div>`; }).join('')}
    ${r.status === 'finished' && r.winners ? `<div class="card" style="margin-top:12px;text-align:center"><h2 style="margin:0">De top is bereikt</h2><div>Winnaar: ${esc(r.winners.map(id => r.players.find(p => p.id === id).name).join(' en '))}</div></div>` : ''}
    ${pend && mine.played ? '<button class="btn" data-act="throw" style="margin-top:18px">Dobbel nu</button>' : '<button class="btn" data-act="room" style="margin-top:18px">Naar het bord</button>'}</div></div>`;
  document.querySelectorAll('.cube').forEach(c => { c.classList.remove('roll'); c.style.transform = `rotateX(-22deg) rotateY(-28deg) ${FACE[c.dataset.n]}`; });
  document.querySelectorAll('[data-sum]').forEach(s => s.classList.add('show'));
};


VIEWS.boot = () => { app.innerHTML = `<div class="screen" style="background:linear-gradient(#3fa6ea,#cfeaf6)"><div class="load">Summit Days laden</div></div>`; };
VIEWS.setup = () => { app.innerHTML = `<div class="screen cape" style="background:linear-gradient(180deg,#8fd4f7,#e6f7ff)"><div class="center" style="position:relative;z-index:1"><h1>Firebase is nog niet gekoppeld</h1><p class="note">Vul je gegevens in bij firebase-config.js, zoals beschreven in STAPPENPLAN.md.</p></div></div>`; };
(async function boot() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('VUL_IN')) return go('setup');
  VIEWS.boot();
  try { go(await bootAuth() ? 'home' : 'onboarding'); } catch (e) { console.warn(e); go('onboarding'); toast('Geen verbinding met Firebase. Controleer je internet.'); }
})();
