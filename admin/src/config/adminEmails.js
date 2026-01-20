/**
 * Admin Email Configuration (Frontend)
 * This should match the backend configuration
 */

// List of allowed admin emails
const ADMIN_EMAILS = [
  'olivier.niyo250@gmail.com'
  // Add more admin emails here as needed
];

// List of allowed marketing manager emails
const MARKETING_MANAGER_EMAILS = [
  'hugo@zubahouse.com'
  // Add more marketing manager emails here as needed
];

/**
 * Check if an email is an admin email
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email is in admin list
 */
export const isAdminEmail = (email) => {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase().trim() === normalizedEmail);
};

/**
 * Check if an email is a marketing manager email
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email is in marketing manager list
 */
export const isMarketingManagerEmail = (email) => {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return MARKETING_MANAGER_EMAILS.some(mgrEmail => mgrEmail.toLowerCase().trim() === normalizedEmail);
};

/**
 * Check if an email can access admin panel (either admin or marketing manager email)
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email can access admin panel
 */
export const canAccessAdminPanelByEmail = (email) => {
  if (!email) return false;
  return isAdminEmail(email) || isMarketingManagerEmail(email);
};

/**
 * Check if user can access admin panel (ADMIN or MARKETING_MANAGER)
 * @param {object} userData - User data object
 * @returns {boolean} - True if user can access admin panel
 */
export const canAccessAdminPanel = (userData) => {
  if (!userData) return false;
  const role = (userData.role || '').toUpperCase();
  const email = userData.email || '';
  return (role === 'ADMIN' && isAdminEmail(email)) || 
         (role === 'MARKETING_MANAGER' && isMarketingManagerEmail(email));
};

/**
 * Check if user is full admin (both role and email)
 * @param {object} userData - User data object
 * @returns {boolean} - True if user is full admin
 */
export const isAdmin = (userData) => {
  if (!userData) return false;
  const role = (userData.role || '').toUpperCase();
  const email = userData.email || '';
  return role === 'ADMIN' && isAdminEmail(email);
};

/**
 * Check if user is marketing manager
 * @param {object} userData - User data object
 * @returns {boolean} - True if user is marketing manager
 */
export const isMarketingManager = (userData) => {
  if (!userData) return false;
  const role = (userData.role || '').toUpperCase();
  const email = userData.email || '';
  return role === 'MARKETING_MANAGER' && isMarketingManagerEmail(email);
};

export default {
  ADMIN_EMAILS,
  MARKETING_MANAGER_EMAILS,
  isAdminEmail,
  isMarketingManagerEmail,
  canAccessAdminPanelByEmail,
  canAccessAdminPanel,
  isAdmin,
  isMarketingManager
};

