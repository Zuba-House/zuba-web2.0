/**
 * Admin Email Configuration (Frontend)
 * This should match the backend configuration
 */

// List of allowed admin emails
const ADMIN_EMAILS = [
  'olivier.niyo250@gmail.com'
  // Add more admin emails here as needed
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
 * Check if user is admin (both role and email)
 * @param {object} userData - User data object
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (userData) => {
  if (!userData) return false;
  const role = (userData.role || '').toUpperCase();
  const email = userData.email || '';
  return role === 'ADMIN' && isAdminEmail(email);
};

export default {
  ADMIN_EMAILS,
  isAdminEmail,
  isAdmin
};

