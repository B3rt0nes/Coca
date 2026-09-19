// ============================================
// CO.CA. — Firestore CRUD Operations
// ============================================

import { db } from './firebase-config.js';
import { getGroupName } from './auth.js';
import {
  collection, addDoc, getDocs, getDoc, deleteDoc, doc, setDoc,
  onSnapshot, updateDoc, serverTimestamp, query, orderBy
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

// ── Collection references ──
function getCapiRef() {
  const group = getGroupName();
  if (!group) throw new Error("Nessun gruppo selezionato");
  return collection(db, 'groups', group, 'capi');
}

function getProposteRef() {
  const group = getGroupName();
  if (!group) throw new Error("Nessun gruppo selezionato");
  return collection(db, 'groups', group, 'proposte');
}

// ══════════════════════════════════════════
// GROUP Operations
// ══════════════════════════════════════════

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get all existing groups
 * @returns {Array<string>} Array of group names
 */
export async function getGroups() {
  const snapshot = await getDocs(collection(db, 'groups'));
  return snapshot.docs.map(doc => doc.id).sort();
}

/**
 * Create a new group with a password
 * @param {string} groupName 
 * @param {string} password 
 */
export async function createGroup(groupName, password) {
  const groupDoc = await getDoc(doc(db, 'groups', groupName));
  if (groupDoc.exists()) {
    throw new Error('Il gruppo esiste già');
  }
  const passwordHash = await hashPassword(password);
  await setDoc(doc(db, 'groups', groupName), { passwordHash });
}

/**
 * Verify a group's password
 * @param {string} groupName 
 * @param {string} password 
 * @returns {boolean} True if password is correct
 */
export async function verifyGroupPassword(groupName, password) {
  const groupDoc = await getDoc(doc(db, 'groups', groupName));
  if (!groupDoc.exists()) {
    throw new Error('Gruppo non trovato');
  }
  const passwordHash = await hashPassword(password);
  return groupDoc.data().passwordHash === passwordHash;
}

const DEFAULT_UNITS = {
  'branco-1': { type: 'branco', name: 'Branco Waingunga' },
  'cerchio-1': { type: 'cerchio', name: 'Cerchio della Gioia' },
  'reparto-1': { type: 'reparto', name: 'Reparto Stella Polare' },
  'noviziato-1': { type: 'noviziato', name: 'Noviziato' },
  'clan-1': { type: 'clan', name: 'Clan del Fuoco' },
  'coca-1': { type: 'coca', name: 'Co.Ca.' }
};

/**
 * Get units configuration for the current group
 */
export async function getGroupUnits() {
  const group = getGroupName();
  if (!group) return null;
  const settingsDoc = await getDoc(doc(db, 'groups', group, 'config', 'settings'));
  if (settingsDoc.exists() && settingsDoc.data().units) {
    return settingsDoc.data().units;
  }
  // Initialize defaults if none exists
  await saveGroupUnits(DEFAULT_UNITS);
  return DEFAULT_UNITS;
}

/**
 * Save units configuration for the current group
 */
export async function saveGroupUnits(units) {
  const group = getGroupName();
  if (!group) throw new Error("Nessun gruppo selezionato");
  await setDoc(doc(db, 'groups', group, 'config', 'settings'), { units }, { merge: true });
}

// ══════════════════════════════════════════
// CAPI (Deck) Operations
// ══════════════════════════════════════════

/**
 * Add a new Capo to Firestore
 * @param {Object} capoData - { nome, cognome, sesso, livelloFoca, cfmDettaglio, altriIncarichi }
 * @returns {string} Document ID
 */
export async function addCapo(capoData) {
  const docRef = await addDoc(getCapiRef(), {
    ...capoData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

function tagDuplicateNames(capi) {
  const nameCounts = new Map();
  capi.forEach(c => {
    if (!c.nome) return;
    const name = c.nome.trim().toLowerCase();
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  });
  capi.forEach(c => {
    if (!c.nome) {
      c.hasDuplicateName = false;
      return;
    }
    const name = c.nome.trim().toLowerCase();
    c.hasDuplicateName = nameCounts.get(name) > 1;
  });
  return capi;
}

/**
 * Get all Capi (one-time fetch)
 * @returns {Array} Array of { id, ...data }
 */
export async function getCapi() {
  const q = query(getCapiRef(), orderBy('cognome', 'asc'));
  const snapshot = await getDocs(q);
  const capi = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return tagDuplicateNames(capi);
}

/**
 * Subscribe to real-time updates on Capi collection
 * @param {Function} callback - Called with array of capi on each change
 * @returns {Function} Unsubscribe function
 */
export function onCapiChange(callback) {
  const q = query(getCapiRef(), orderBy('cognome', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const capi = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tagDuplicateNames(capi));
  }, (error) => {
    console.error('Error listening to capi:', error);
  });
}

/**
 * Delete a Capo from Firestore
 * @param {string} id - Document ID
 */
export async function deleteCapo(id) {
  const group = getGroupName();
  await deleteDoc(doc(db, 'groups', group, 'capi', id));
}

/**
 * Update a Capo in Firestore
 * @param {string} id - Document ID
 * @param {Object} data - Fields to update
 */
export async function updateCapo(id, data) {
  const group = getGroupName();
  await updateDoc(doc(db, 'groups', group, 'capi', id), data);
}


// ══════════════════════════════════════════
// PROPOSTE (Proposals) Operations
// ══════════════════════════════════════════

/**
 * Save a new proposal to Firestore
 * @param {Object} proposalData - { autore, titolo, assegnazioni, warnings }
 * @returns {string} Document ID
 */
export async function saveProposal(proposalData) {
  const docRef = await addDoc(getProposteRef(), {
    ...proposalData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

/**
 * Update an existing proposal
 * @param {string} id - Document ID
 * @param {Object} data - Fields to update
 */
export async function updateProposal(id, data) {
  const group = getGroupName();
  await updateDoc(doc(db, 'groups', group, 'proposte', id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

/**
 * Get all proposals
 * @returns {Array} Array of { id, ...data }
 */
export async function getProposals() {
  const q = query(getProposteRef(), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => p.id !== 'base-year');
}

/**
 * Subscribe to real-time updates on proposals
 * @param {Function} callback - Called with array of proposals on each change
 * @returns {Function} Unsubscribe function
 */
export function onProposalsChange(callback) {
  const q = query(getProposteRef(), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const proposals = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => p.id !== 'base-year');
    callback(proposals);
  }, (error) => {
    console.error('Error listening to proposals:', error);
  });
}

/**
 * Save or update the base year proposal
 * @param {Object} proposalData 
 */
export async function saveBaseYear(proposalData) {
  const group = getGroupName();
  await setDoc(doc(db, 'groups', group, 'proposte', 'base-year'), {
    ...proposalData,
    isBaseYear: true,
    updatedAt: serverTimestamp()
  });
}

/**
 * Get the base year proposal
 */
export async function getBaseYear() {
  const group = getGroupName();
  const docSnap = await getDoc(doc(db, 'groups', group, 'proposte', 'base-year'));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Get a single proposal by ID
 * @param {string} id - Document ID
 * @returns {Object|null} Proposal data or null
 */
export async function getProposal(id) {
  const group = getGroupName();
  const docSnap = await getDoc(doc(db, 'groups', group, 'proposte', id));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Delete a proposal
 * @param {string} id - Document ID
 */
export async function deleteProposal(id) {
  const group = getGroupName();
  await deleteDoc(doc(db, 'groups', group, 'proposte', id));
}

