import nodemailer from 'nodemailer';

// Configure the SMTP transporter with Hostinger settings
// Uses environment variables for flexibility
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',  // Hostinger SMTP
  port: Number(process.env.SMTP_PORT) || 465,          // 465 for SSL
  secure: process.env.SMTP_SECURE === 'true' || true,   // true for SSL (port 465)
  auth: {
    user: process.env.EMAIL,                            // orders@zubahouse.com
    pass: process.env.EMAIL_PASS,                       // Your email password
  },
});

// Function to send email
async function sendEmail(to, subject, text, html) {
  try {
    // Get sender email and display name from environment
    const senderEmail = process.env.EMAIL || 'orders@zubahouse.com';
    const senderName = process.env.EMAIL_SENDER_NAME || 'Zuba House';
    
    // Format: "Display Name <email@address.com>"
    const fromAddress = `${senderName} <${senderEmail}>`;
   
    const info = await transporter.sendMail({
      from: fromAddress, // sender address with display name
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });
    
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Export both transporter (for test route) and sendEmail function
export { sendEmail, transporter };