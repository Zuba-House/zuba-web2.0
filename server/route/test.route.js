import express from 'express';
import { transporter } from '../config/emailService.js';

const router = express.Router();

// Test email configuration endpoint
router.get('/test-email', async (req, res) => {
  try {
    console.log('📧 Testing email configuration...');
    
    // Show what environment variables are loaded
    const config = {
      EMAIL_HOST: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'NOT SET',
      EMAIL_PORT: process.env.EMAIL_PORT || process.env.SMTP_PORT || 'NOT SET',
      EMAIL_USER: process.env.EMAIL_USER || process.env.EMAIL || 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL || 'NOT SET',
      EMAIL_PASS: process.env.EMAIL_PASS ? '✓ SET (hidden)' : '❌ NOT SET',
      SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
      SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
      EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME || 'NOT SET',
    };

    console.log('📋 Environment Variables:', config);

    // Use the transporter from emailService.js (already configured for Gmail)
    const testTransporter = transporter;

    // Verify connection with increased timeout for Gmail
    console.log('🔍 Verifying SMTP connection to Gmail...');
    try {
      await Promise.race([
        testTransporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
        )
      ]);
      console.log('✅ SMTP connection verified!');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError.message);
      // Continue anyway - sometimes verify fails but sendMail works
    }

    // Send test email
    const testEmail = req.query.to || process.env.TEST_EMAIL || 'olivier.niyo250@gmail.com';
    const senderEmail = process.env.EMAIL_USER || process.env.EMAIL || process.env.EMAIL_FROM;
    const senderName = process.env.EMAIL_SENDER_NAME || 'Zuba House';
    const fromAddress = `"${senderName}" <${senderEmail}>`;

    const info = await testTransporter.sendMail({
      from: fromAddress,
      to: testEmail,
      subject: '✅ Zuba House Email Test - Success!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #4CAF50;">🎉 Email Configuration Working!</h2>
            <p>Your Gmail SMTP is properly configured and working.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p><strong>📅 Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>🖥️ Server:</strong> ${config.SMTP_HOST || config.EMAIL_HOST}</p>
            <p><strong>🔌 Port:</strong> ${config.SMTP_PORT || config.EMAIL_PORT}</p>
            <p><strong>👤 From:</strong> ${senderEmail}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated test email from Zuba House backend.</p>
          </div>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully:', info.messageId);

    res.status(200).json({
      success: true,
      message: '✅ Email sent successfully!',
      config: config,
      emailSent: info.messageId,
      recipient: testEmail,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    // Detailed error analysis
    let troubleshooting = 'Unknown error. Check server logs for details.';
    
    if (error.code === 'ETIMEDOUT') {
      troubleshooting = '⚠️ Connection timeout. Render cannot reach Gmail SMTP. Possible causes: 1) Firewall blocking port 587, 2) Gmail blocking connection, 3) Network issue. Try: Increase timeout, check firewall rules, verify Gmail app password is correct.';
    } else if (error.code === 'EAUTH') {
      troubleshooting = '⚠️ Authentication failed. Check: 1) Gmail app password is correct (no spaces), 2) EMAIL_USER is orders.zubahouse@gmail.com, 3) 2-Step Verification is enabled on Gmail account.';
    } else if (error.code === 'ENOTFOUND') {
      troubleshooting = '⚠️ SMTP host not found. Check if EMAIL_HOST or SMTP_HOST is set to "smtp.gmail.com".';
    } else if (error.code === 'ESOCKET') {
      troubleshooting = '⚠️ Socket error. For Gmail: EMAIL_PORT should be 587 and SMTP_SECURE should be false.';
    } else if (error.code === 'ECONNREFUSED') {
      troubleshooting = '⚠️ Connection refused. Gmail may be blocking the connection. Check: 1) App password is correct, 2) "Less secure app access" is enabled (if using regular password), 3) Try using OAuth2 instead.';
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      command: error.command,
      config: {
        EMAIL_HOST: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'NOT SET',
        EMAIL_PORT: process.env.EMAIL_PORT || process.env.SMTP_PORT || 'NOT SET',
        EMAIL_USER: process.env.EMAIL_USER || process.env.EMAIL || 'NOT SET',
        EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL || 'NOT SET',
        SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
        SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
        SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
      },
      troubleshooting: troubleshooting,
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Email test route is working',
    timestamp: new Date().toISOString(),
  });
});

export default router;


