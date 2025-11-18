import nodemailer from 'nodemailer';

/**
 * ✅ GMAIL SMTP CONFIGURATION - FIXED
 * 
 * This file configures Nodemailer to use Gmail SMTP
 * Uses environment variables - no hardcoded values
 */

// Email configuration from environment variables
const emailConfig = {
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true', // false for port 587, true for 465
  auth: {
    user: process.env.EMAIL_USER || process.env.EMAIL,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false  // Allow self-signed certificates
  },
  // Connection timeout settings (increased for Gmail)
  connectionTimeout: 20000, // 20 seconds (Gmail can be slow)
  greetingTimeout: 10000, // 10 seconds
  socketTimeout: 20000, // 20 seconds
  // Connection pooling for faster email delivery
  pool: true, // Use connection pooling
  maxConnections: 5, // Max concurrent connections
  maxMessages: 100, // Max messages per connection
  rateDelta: 1000, // Time between messages (ms)
  rateLimit: 10, // Max messages per rateDelta
};

// Log configuration (for debugging - shows what's being used)
console.log('📧 Email Configuration:', {
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  user: emailConfig.auth.user,
  hasPassword: !!emailConfig.auth.pass,
  connectionTimeout: emailConfig.connectionTimeout
});

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email Configuration Error:', error);
    console.error('❌ Email service verification failed. Check your environment variables:');
    console.error('   - EMAIL_HOST or SMTP_HOST');
    console.error('   - EMAIL_PORT or SMTP_PORT');
    console.error('   - EMAIL_USER or EMAIL');
    console.error('   - EMAIL_PASS or EMAIL_PASSWORD');
  } else {
    console.log('✅ Email server is ready to send messages');
    console.log('✅ Gmail SMTP configured successfully');
  }
});

// Function to send email (optimized for speed)
async function sendEmail(to, subject, text, html) {
  try {
    // Validate inputs
    if (!to) {
      console.error('❌ Email recipient is missing');
      return { success: false, error: 'Email recipient is missing' };
    }
    
    if (!subject) {
      console.error('❌ Email subject is missing');
      return { success: false, error: 'Email subject is missing' };
    }
    
    // Get sender email and display name from environment
    const senderEmail = process.env.EMAIL_USER || process.env.EMAIL || process.env.EMAIL_FROM || 'orders.zubahouse@gmail.com';
    const senderName = process.env.EMAIL_SENDER_NAME || 'Zuba House';
    
    if (!senderEmail) {
      console.error('❌ EMAIL_USER or EMAIL environment variable is not set');
      return { success: false, error: 'EMAIL_USER or EMAIL environment variable is not set' };
    }
    
    // Format: "Display Name <email@address.com>"
    const fromAddress = `${senderName} <${senderEmail}>`;
   
    console.log('📧 Email service - Preparing to send:', {
      from: fromAddress,
      to: to,
      subject: subject,
      hasHtml: !!html,
      hasText: !!text
    });
   
    const startTime = Date.now();
    const info = await transporter.sendMail({
      from: fromAddress, // sender address with display name
      to, // list of receivers
      subject, // Subject line
      text: text || '', // plain text body
      html: html || text || '', // html body (fallback to text if html not provided)
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Email sent successfully in ${duration}ms:`, info.messageId);
    console.log('📧 Email response:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return { success: true, messageId: info.messageId, duration };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('❌ Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    return { success: false, error: error.message, details: error };
  }
}

// Export both transporter (for test route) and sendEmail function
export { sendEmail, transporter };