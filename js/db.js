// ============================================
// CO.CA. — Firestore CRUD Operations
// ============================================

import { db } from './firebase-config.js';
import {
  collection, addDoc, getDocs, getDoc, deleteDoc, doc,
  onSnapshot, updateDoc, serverTimestamp, query, orderBy
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

// ── Collection references ──
const capiRef = collection(db, 'capi');
const proposteRef = collection(db, 'proposte');

// ══════════════════════════════════════════
// CAPI (Deck) Operations
// ══════════════════════════════════════════

/**
 * Add a new Capo to Firestore
 * @param {Object} capoData - { nome, cognome, sesso, livelloFoca, cfmDettaglio, altriIncarichi }
 * @returns {string} Document ID
 */
export async function addCapo(capoData) {
  const docRef = await addDoc(capiRef, {
    ...capoData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

/**
 * Get all Capi (one-time fetch)
 * @returns {Array} Array of { id, ...data }
 */
export async function getCapi() {
  const q = query(capiRef, orderBy('cognome', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Subscribe to real-time updates on Capi collection
 * @param {Function} callback - Called with array of capi on each change
 * @returns {Function} Unsubscribe function
 */
export function onCapiChange(callback) {
  const q = query(capiRef, orderBy('cognome', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const capi = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(capi);
  }, (error) => {
    console.error('Error listening to capi:', error);
  });
}

/**
 * Delete a Capo from Firestore
 * @param {string} id - Document ID
 */
export async function deleteCapo(id) {
  await deleteDoc(doc(db, 'capi', id));
}

/**
 * Update a Capo in Firestore
 * @param {string} id - Document ID
 * @param {Object} data - Fields to update
 */
export async function updateCapo(id, data) {
  await updateDoc(doc(db, 'capi', id), data);
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
  const docRef = await addDoc(proposteRef, {
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
  await updateDoc(doc(db, 'proposte', id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

/**
 * Get all proposals
 * @returns {Array} Array of { id, ...data }
 */
export async function getProposals() {
  const q = query(proposteRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Subscribe to real-time updates on proposals
 * @param {Function} callback - Called with array of proposals on each change
 * @returns {Function} Unsubscribe function
 */
export function onProposalsChange(callback) {
  const q = query(proposteRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(proposals);
  }, (error) => {
    console.error('Error listening to proposals:', error);
  });
}

/**
 * Get a single proposal by ID
 * @param {string} id - Document ID
 * @returns {Object|null} Proposal data or null
 */
export async function getProposal(id) {
  const docSnap = await getDoc(doc(db, 'proposte', id));
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
  await deleteDoc(doc(db, 'proposte', id));
}
