// ============================================
// CO.CA. — Authentication (Username only)
// ============================================

const STORAGE_KEY = 'coca_username';

/**
 * Get current username from localStorage
 * @returns {string|null}
 */
export function getUsername() {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Set username in localStorage
 * @param {string} username
 */
export function setUsername(username) {
  localStorage.setItem(STORAGE_KEY, username.trim());
}

/**
 * Remove username (logout)
 */
export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  const username = getUsername();
  return username !== null && username.trim() !== '';
}

/**
 * Check if current user is a master (admin)
 * @returns {boolean}
 */
export function isMasterUser() {
  const username = getUsername();
  if (!username) return false;
  const masterNames = ['master', 'direzione', 'admin'];
  return masterNames.includes(username.trim().toLowerCase());
}
