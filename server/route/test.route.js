import express from 'express';
import nodemailer from 'nodemailer';
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

    // Create transporter with your Hostinger settings (using existing or creating new)
    const testTransporter = transporter || nodemailer.createTransport({
      host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '465'),
      secure: true, // Always true for port 465
      auth: {
        user: process.env.EMAIL_USER || process.env.EMAIL_FROM || process.env.EMAIL || 'orders@zubahouse.com',
        pass: process.env.EMAIL_PASS || '',
      },
      logger: true,
      debug: true,
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      }
    });

    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await testTransporter.verify();
    console.log('✅ SMTP connection verified!');

    // Send test email
    const testEmail = req.query.to || process.env.TEST_EMAIL || 'olivier.niyo250@gmail.com';
    const senderEmail = process.env.EMAIL || process.env.EMAIL_USER || process.env.EMAIL_FROM || 'orders@zubahouse.com';
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
            <p>Your Hostinger SMTP is properly configured and working.</p>
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
      troubleshooting = '⚠️ Connection timeout. Render cannot reach smtp.hostinger.com:465. This might be a network/firewall issue.';
    } else if (error.code === 'EAUTH') {
      troubleshooting = '⚠️ Authentication failed. Your password might be incorrect. Try resetting it in Hostinger.';
    } else if (error.code === 'ENOTFOUND') {
      troubleshooting = '⚠️ SMTP host not found. Check if EMAIL_HOST or SMTP_HOST is set to "smtp.hostinger.com".';
    } else if (error.code === 'ESOCKET') {
      troubleshooting = '⚠️ Socket error. Check if SMTP_SECURE=true and EMAIL_PORT=465.';
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

