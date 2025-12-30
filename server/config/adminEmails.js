/**
 * Admin Email Configuration
 * Only emails listed here can access the admin panel
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
 * Get all admin emails
 * @returns {string[]} - Array of admin emails
 */
export const getAdminEmails = () => {
  return [...ADMIN_EMAILS];
};

export default {
  ADMIN_EMAILS,
  isAdminEmail,
  getAdminEmails
};

