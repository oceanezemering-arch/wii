import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, getDoc, getDocs, updateDoc, collection, Timestamp, query, where } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-summit', firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: 'localhost', port: 8080 } });
const A = env.authenticatedContext('alice').firestore(), B = env.authenticatedContext('bob').firestore(), C = env.authenticatedContext('carol').firestore();
let ok = 0, bad = 0; const t = async (name, p) => { try { await p; ok++; console.log('ok   ', name); } catch (e) { bad++; console.log('FOUT ', name, String(e.message).slice(0, 120)); } };
const look = { skin: 1 }; const future = Timestamp.fromMillis(Date.now() + 3600e3), past = Timestamp.fromMillis(Date.now() - 3600e3);

await t('profiel maken', assertSucceeds(setDoc(doc(A, 'users/alice'), { name: 'Alice', avatar: look, roomIds: [] })));
await t('naam te lang geweigerd', assertFails(setDoc(doc(B, 'users/bob'), { name: 'X'.repeat(15), avatar: look, roomIds: [] })));
await t('naam wijzigen geweigerd', assertFails(updateDoc(doc(A, 'users/alice'), { name: 'Nieuw' })));
await t('uiterlijk wijzigen mag', assertSucceeds(updateDoc(doc(A, 'users/alice'), { avatar: { skin: 2 } })));
await t('profiel van een ander lezen geweigerd', assertFails(getDoc(doc(B, 'users/alice'))));
await t('profiel Bob maken', assertSucceeds(setDoc(doc(B, 'users/bob'), { name: 'Bob', avatar: look, roomIds: [] })));

await t('kamer maken', assertSucceeds(setDoc(doc(A, 'rooms/ABC234'), { code: 'ABC234', ownerId: 'alice', playerIds: ['alice'], boardSize: 50, status: 'playing', timezone: 'Europe/Amsterdam', resultHour: 20 })));
await t('speler Alice maken', assertSucceeds(setDoc(doc(A, 'rooms/ABC234/players/alice'), { uid: 'alice', name: 'Alice', avatar: look, color: '#2f7bff', position: 0, totalPoints: 0, dayWins: 0 })));
await t('kamer opzoeken met code mag', assertSucceeds(getDoc(doc(B, 'rooms/ABC234'))));
await t('speler lezen als geen lid geweigerd', assertFails(getDocs(collection(B, 'rooms/ABC234/players'))));
await t('meedoen', assertSucceeds(updateDoc(doc(B, 'rooms/ABC234'), { playerIds: ['alice', 'bob'] })));
await t('speler Bob maken', assertSucceeds(setDoc(doc(B, 'rooms/ABC234/players/bob'), { uid: 'bob', name: 'Bob', avatar: look, color: '#ff4a3d', position: 0, totalPoints: 0, dayWins: 0 })));
await t('iemand anders toevoegen geweigerd', assertFails(updateDoc(doc(C, 'rooms/ABC234'), { playerIds: ['alice', 'bob', 'carol', 'x'] })));
await t('Carol meedoen mag', assertSucceeds(updateDoc(doc(C, 'rooms/ABC234'), { playerIds: ['alice', 'bob', 'carol'] })));

await t('dag aanmaken', assertSucceeds(setDoc(doc(A, 'rooms/ABC234/days/open1'), { status: 'open', games: ['vine', 'fruit', 'barrel', 'tilt'], revealAt: future })));
await t('score maken', assertSucceeds(setDoc(doc(A, 'rooms/ABC234/days/open1/scores/alice_vine'), { uid: 'alice', gameId: 'vine', score: 20 })));
await t('score twee keer geweigerd', assertFails(setDoc(doc(A, 'rooms/ABC234/days/open1/scores/alice_vine'), { uid: 'alice', gameId: 'vine', score: 99 })));
await t('score voor een ander geweigerd', assertFails(setDoc(doc(A, 'rooms/ABC234/days/open1/scores/bob_fruit'), { uid: 'bob', gameId: 'fruit', score: 1 })));
await t('score voor een andere minigame geweigerd', assertFails(setDoc(doc(A, 'rooms/ABC234/days/open1/scores/alice_surf'), { uid: 'alice', gameId: 'surf', score: 1 })));
await t('eigen scores lezen', assertSucceeds(getDocs(query(collection(A, 'rooms/ABC234/days/open1/scores'), where('uid', '==', 'alice')))));
await t('score van een ander lezen voor het eindtijdstip geweigerd', assertFails(getDoc(doc(B, 'rooms/ABC234/days/open1/scores/alice_vine'))));
await t('alle scores lezen voor het eindtijdstip geweigerd', assertFails(getDocs(collection(B, 'rooms/ABC234/days/open1/scores'))));
await t('ronde sluiten voor het eindtijdstip geweigerd', assertFails(updateDoc(doc(A, 'rooms/ABC234/days/open1'), { status: 'resolved' })));

await env.withSecurityRulesDisabled(async ctx => { const d = ctx.firestore(); await setDoc(doc(d, 'rooms/ABC234/days/old1'), { status: 'open', games: ['vine', 'fruit', 'barrel', 'tilt'], revealAt: past }); await setDoc(doc(d, 'rooms/ABC234/days/old1/scores/alice_vine'), { uid: 'alice', gameId: 'vine', score: 5 }); });
await t('scores van anderen lezen na het eindtijdstip', assertSucceeds(getDocs(collection(B, 'rooms/ABC234/days/old1/scores'))));
await t('score maken na het eindtijdstip geweigerd', assertFails(setDoc(doc(B, 'rooms/ABC234/days/old1/scores/bob_fruit'), { uid: 'bob', gameId: 'fruit', score: 1 })));
await t('uitslag schrijven na het eindtijdstip', assertSucceeds(setDoc(doc(B, 'rooms/ABC234/days/old1/results/alice'), { uid: 'alice', played: true, thrown: false, rolls: [3], from: 0, to: 3 })));
await t('ronde sluiten na het eindtijdstip', assertSucceeds(updateDoc(doc(B, 'rooms/ABC234/days/old1'), { status: 'resolved' })));
await t('gegooid door een ander geweigerd', assertFails(updateDoc(doc(B, 'rooms/ABC234/days/old1/results/alice'), { thrown: true })));
await t('zelf gegooid melden', assertSucceeds(updateDoc(doc(A, 'rooms/ABC234/days/old1/results/alice'), { thrown: true })));
await t('niet lid kan uitslag niet lezen', assertFails(getDoc(doc(env.authenticatedContext('dave').firestore(), 'rooms/ABC234/days/old1/results/alice'))));

console.log(`\n${ok} geslaagd, ${bad} gefaald`); await env.cleanup(); process.exit(bad ? 1 : 0);
