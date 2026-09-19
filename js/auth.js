// ============================================
// CO.CA. — Authentication (Username & Group)
// ============================================

const STORAGE_KEY_USER = 'coca_username';
const STORAGE_KEY_GROUP = 'coca_groupname';

/**
 * Get current username from localStorage
 * @returns {string|null}
 */
export function getUsername() {
  return localStorage.getItem(STORAGE_KEY_USER);
}

/**
 * Get current groupname from localStorage
 * @returns {string|null}
 */
export function getGroupName() {
  return localStorage.getItem(STORAGE_KEY_GROUP);
}

/**
 * Set username and group in localStorage
 * @param {string} username
 * @param {string} groupName
 */
export function setAuth(username, groupName) {
  localStorage.setItem(STORAGE_KEY_USER, username.trim());
  localStorage.setItem(STORAGE_KEY_GROUP, groupName.trim());
}

/**
 * Remove auth (logout)
 */
export function logout() {
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_GROUP);
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  const username = getUsername();
  const groupName = getGroupName();
  return username !== null && username.trim() !== '' && groupName !== null && groupName.trim() !== '';
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
