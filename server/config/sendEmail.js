import { sendEmail } from "./emailService.js";

const sendEmailFun = async ({ sendTo, subject, text, html }) => {
  try {
    // Handle both string and array inputs
    const recipients = Array.isArray(sendTo) ? sendTo : [sendTo];
    
    console.log('📧 Attempting to send email to:', recipients);
    console.log('📧 Subject:', subject);
    
    // Send email to all recipients
    // Wrap in try-catch to ensure we catch any errors
    const results = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          const result = await sendEmail(recipient, subject, text, html);
          return result;
        } catch (error) {
          console.error(`❌ Error sending email to ${recipient}:`, error);
          return {
            success: false,
            error: error.message || 'Unknown error',
            details: error.response?.body || error
          };
        }
      })
    );
    
    // Check if all emails were sent successfully
    const allSuccess = results.every(result => result.success);
    
    if (allSuccess) {
      console.log('✅ Email(s) sent successfully to:', recipients);
      return true;
    } else {
      const failedResults = results.filter(r => !r.success);
      const errors = failedResults.map(r => ({
        error: r.error,
        details: r.details
      }));
      
      console.error('❌ Some emails failed to send:');
      errors.forEach((err, index) => {
        console.error(`  Recipient ${index + 1}:`, recipients[index]);
        console.error(`  Error:`, err.error);
        if (err.details) {
          console.error(`  Details:`, JSON.stringify(err.details, null, 2));
        }
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Error in sendEmailFun:', error.message);
    console.error('Full error:', error);
    if (error.response) {
      console.error('SendGrid Response:', {
        statusCode: error.response.statusCode,
        body: error.response.body,
        headers: error.response.headers
      });
    }
    return false;
  }
};

export default sendEmailFun;