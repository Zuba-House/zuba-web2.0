/**
 * Admin Email Configuration
 * Only emails listed here can access the admin panel
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
 * Get all admin emails
 * @returns {string[]} - Array of admin emails
 */
export const getAdminEmails = () => {
  return [...ADMIN_EMAILS];
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
 * Check if an email can access admin panel (either admin or marketing manager)
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email can access admin panel
 */
export const canAccessAdminPanel = (email) => {
  return isAdminEmail(email) || isMarketingManagerEmail(email);
};

export default {
  ADMIN_EMAILS,
  MARKETING_MANAGER_EMAILS,
  isAdminEmail,
  isMarketingManagerEmail,
  canAccessAdminPanel,
  getAdminEmails
};

