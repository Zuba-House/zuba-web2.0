import nodemailer from 'nodemailer';

// Configure the SMTP transporter with Hostinger settings
// Uses environment variables for flexibility
// OPTIMIZED: Added connection pooling for faster email delivery
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',  // Hostinger SMTP
  port: Number(process.env.SMTP_PORT) || 465,          // 465 for SSL
  secure: process.env.SMTP_SECURE === 'true' || true,   // true for SSL (port 465)
  auth: {
    user: process.env.EMAIL,                            // orders@zubahouse.com
    pass: process.env.EMAIL_PASS,                       // Your email password
  },
  // Connection pooling for faster email delivery
  pool: true, // Use connection pooling
  maxConnections: 5, // Max concurrent connections
  maxMessages: 100, // Max messages per connection
  rateDelta: 1000, // Time between messages (ms)
  rateLimit: 10, // Max messages per rateDelta
  // Connection timeout settings
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000, // 5 seconds
  socketTimeout: 10000, // 10 seconds
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service ready and verified');
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
    const senderEmail = process.env.EMAIL || 'orders@zubahouse.com';
    const senderName = process.env.EMAIL_SENDER_NAME || 'Zuba House';
    
    if (!senderEmail) {
      console.error('❌ EMAIL environment variable is not set');
      return { success: false, error: 'EMAIL environment variable is not set' };
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