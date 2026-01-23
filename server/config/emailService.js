import sgMail from '@sendgrid/mail';

/**
 * ✅ SENDGRID EMAIL CONFIGURATION
 * 
 * Professional email delivery using SendGrid API
 * No SMTP ports needed - uses HTTPS (port 443)
 * Works reliably on Render and other cloud platforms
 */

// Set SendGrid API Key from environment
const sendGridApiKey = process.env.SENDGRID_API_KEY;

if (!sendGridApiKey) {
  console.warn('⚠️ SENDGRID_API_KEY not set. Email sending will fail.');
  console.warn('   Set SENDGRID_API_KEY in Render environment variables.');
} else {
  sgMail.setApiKey(sendGridApiKey);
  console.log('✅ SendGrid API Key configured');
  console.log('   From:', process.env.EMAIL_FROM || 'orders@zubahouse.com');
  console.log('   Sender Name:', process.env.EMAIL_SENDER_NAME || 'Zuba House');
}

// Get sender email and name from environment
const getSenderEmail = () => {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.EMAIL || 'orders@zubahouse.com';
};

const getSenderName = () => {
  return process.env.EMAIL_SENDER_NAME || 'Zuba House';
};

// Verify SendGrid configuration (for backward compatibility with transporter.verify())
const verifySendGrid = async () => {
  return new Promise((resolve, reject) => {
    if (!sendGridApiKey) {
      reject(new Error('SENDGRID_API_KEY is not set'));
    } else {
      console.log('✅ SendGrid API Key configured');
      resolve(true);
    }
  });
};

// Transporter object for backward compatibility with existing code
// This allows code using transporter.sendMail() to continue working
const transporter = {
  sendMail: async (mailOptions) => {
    try {
      // Parse from field if provided (can be string or object)
      let fromEmail = getSenderEmail();
      let fromName = getSenderName();
      
      if (mailOptions.from) {
        // Handle string format: "Name <email@domain.com>" or just "email@domain.com"
        if (typeof mailOptions.from === 'string') {
          const fromMatch = mailOptions.from.match(/(?:([^<]+)<)?([^>]+@[^>]+)>?/);
          if (fromMatch) {
            fromName = fromMatch[1]?.trim() || getSenderName();
            fromEmail = fromMatch[2]?.trim() || getSenderEmail();
          } else {
            fromEmail = mailOptions.from;
          }
        }
        // Handle object format: { email: "...", name: "..." }
        else if (typeof mailOptions.from === 'object') {
          fromEmail = mailOptions.from.email || getSenderEmail();
          fromName = mailOptions.from.name || getSenderName();
        }
      }

      const msg = {
        to: mailOptions.to,
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: mailOptions.subject,
        html: mailOptions.html || mailOptions.text || '',
        text: mailOptions.text || (mailOptions.html ? mailOptions.html.replace(/<[^>]*>/g, '') : '')
      };

      if (!sendGridApiKey) {
        throw new Error('SENDGRID_API_KEY is not set');
      }

      const response = await sgMail.send(msg);
      
      // Return in Nodemailer-compatible format
      return {
        messageId: response[0]?.headers?.['x-message-id'] || 'sendgrid-' + Date.now(),
        response: `SendGrid: ${response[0]?.statusCode || 202}`,
        accepted: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
        rejected: []
      };
    } catch (error) {
      console.error('❌ SendGrid sendMail error:', error.response?.body || error.message);
      throw error;
    }
  },
  
  verify: verifySendGrid
};

/**
 * Send email using SendGrid
 * Maintains backward compatibility with existing sendEmail() function signature
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content (optional)
 * @param {string} html - HTML content (optional)
 * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string }
 */
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

    if (!sendGridApiKey) {
      console.error('❌ SENDGRID_API_KEY is not set');
      return { success: false, error: 'SENDGRID_API_KEY environment variable is not set' };
    }
    
    const senderEmail = getSenderEmail();
    const senderName = getSenderName();
   
    console.log('📧 SendGrid - Preparing to send:', {
      from: `${senderName} <${senderEmail}>`,
      to: to,
      subject: subject,
      hasHtml: !!html,
      hasText: !!text
    });
   
    const startTime = Date.now();
    
    // Ensure we have at least text or html content
    const htmlContent = html || '';
    const textContent = text || (html ? html.replace(/<[^>]*>/g, '').trim() : '');
    
    if (!htmlContent && !textContent) {
      console.error('❌ Both HTML and text content are empty');
      return { success: false, error: 'Email content is empty - both HTML and text are missing' };
    }
    
    const msg = {
      to: to,
      from: {
        email: senderEmail,
        name: senderName
      },
      subject: subject,
      html: htmlContent || textContent, // SendGrid requires at least one content type
      text: textContent || (htmlContent ? htmlContent.replace(/<[^>]*>/g, '').trim() : '')
    };
    
    // Log message details before sending
    console.log('📧 SendGrid message prepared:', {
      to: msg.to,
      from: `${msg.from.name} <${msg.from.email}>`,
      subject: msg.subject,
      htmlLength: msg.html?.length || 0,
      textLength: msg.text?.length || 0
    });

    const response = await sgMail.send(msg);
    
    const duration = Date.now() - startTime;
    const messageId = response[0]?.headers?.['x-message-id'] || 'sendgrid-' + Date.now();
    
    console.log(`✅ Email sent successfully via SendGrid in ${duration}ms`);
    console.log('📧 SendGrid response:', {
      statusCode: response[0]?.statusCode,
      messageId: messageId,
      to: to
    });
    
    return { 
      success: true, 
      messageId: messageId, 
      duration,
      statusCode: response[0]?.statusCode
    };
  } catch (error) {
    console.error('❌ SendGrid error:', error.message);
    console.error('❌ Error details:', {
      code: error.code,
      response: error.response?.body || error.response,
      statusCode: error.response?.statusCode,
      errors: error.response?.body?.errors
    });
    
    // Log more detailed error information
    if (error.response?.body) {
      console.error('❌ SendGrid API Error Response:');
      if (error.response.body.errors) {
        error.response.body.errors.forEach((err, index) => {
          console.error(`  Error ${index + 1}:`, {
            message: err.message,
            field: err.field,
            help: err.help
          });
        });
      } else {
        console.error('  Full response body:', JSON.stringify(error.response.body, null, 2));
      }
    }
    
    // Provide helpful error message based on status code
    let errorMessage = error.message;
    if (error.response?.statusCode === 401) {
      errorMessage = 'SendGrid API key is invalid or unauthorized. Please check your SENDGRID_API_KEY.';
    } else if (error.response?.statusCode === 403) {
      errorMessage = 'SendGrid API key does not have permission to send emails. This may be due to: 1) Trial expired - upgrade your SendGrid plan, 2) API key missing "Mail Send" permission, or 3) Sender email not verified.';
    } else if (error.response?.statusCode === 400) {
      const errorBody = error.response?.body;
      const firstError = errorBody?.errors?.[0];
      
      // Check for trial expiration or account issues
      if (firstError?.message?.toLowerCase().includes('trial') || 
          firstError?.message?.toLowerCase().includes('upgrade') ||
          firstError?.message?.toLowerCase().includes('subscription')) {
        errorMessage = `SendGrid trial expired or account issue: ${firstError.message}. Please upgrade your SendGrid plan to continue sending emails.`;
      } else {
        errorMessage = `SendGrid validation error: ${firstError?.message || error.message}`;
      }
    } else if (error.response?.statusCode === 402) {
      errorMessage = 'SendGrid payment required. Your trial has expired. Please upgrade your SendGrid plan to continue sending emails.';
    }
    
    return { 
      success: false, 
      error: errorMessage, 
      details: {
        statusCode: error.response?.statusCode,
        body: error.response?.body,
        errors: error.response?.body?.errors
      }
    };
  }
}

// Export both transporter (for test route) and sendEmail function
export { sendEmail, transporter };