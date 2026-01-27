import { sendEmail } from '../config/emailService.js';

/**
 * POST /api/vendor/application
 * Public endpoint - Submit vendor application (not full registration)
 * Just collects information and sends emails - no account creation
 */
export const submitVendorApplication = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      whatsapp,
      storeName,
      storeDescription,
      country,
      city,
      addressLine1,
      addressLine2,
      postalCode,
      website,
      socialMedia,
      additionalInfo
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !storeName || !country || !city) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Please fill in all required fields (Name, Email, Phone, Store Name, Country, City)'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const applicationDate = new Date().toLocaleString();
    const applicationId = `VENDOR-APP-${Date.now()}`;

    // Build email HTML for applicant confirmation
    const confirmationEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vendor Application Received - Zuba House</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #0b2735; padding: 30px; text-align: center;">
                    <h1 style="color: #efb291; margin: 0; font-size: 28px; font-weight: bold;">Zuba House</h1>
                    <p style="color: #e5e2db; margin: 10px 0 0 0; font-size: 16px;">Vendor Application Received</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #0b2735; margin: 0 0 20px 0; font-size: 24px;">Thank You, ${name}!</h2>
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      We've successfully received your vendor application for <strong>${storeName}</strong>. Our team will review your application and get back to you within 2-3 business days.
                    </p>
                    
                    <div style="background-color: #f8f9fa; border-left: 4px solid #efb291; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <h3 style="color: #0b2735; margin: 0 0 15px 0; font-size: 18px;">Application Details</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px; width: 40%;"><strong>Application ID:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${applicationId}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Store Name:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${storeName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Email:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${normalizedEmail}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Phone:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${phone}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Location:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${city}, ${country}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Submitted:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${applicationDate}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                      <strong>What happens next?</strong>
                    </p>
                    <ul style="color: #333; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Our team will review your application</li>
                      <li>We'll verify your business information</li>
                      <li>You'll receive an email with the next steps</li>
                      <li>Once approved, you'll get access to create your vendor account</li>
                    </ul>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 30px 0 20px 0;">
                      If you have any questions, feel free to contact us at <a href="mailto:info@zubahouse.com" style="color: #efb291; text-decoration: none;">info@zubahouse.com</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #0b2735; padding: 20px; text-align: center;">
                    <p style="color: #e5e2db; margin: 0; font-size: 12px;">
                      © ${new Date().getFullYear()} Zuba House Inc. All Rights Reserved.
                    </p>
                    <p style="color: #e5e2db; margin: 10px 0 0 0; font-size: 12px;">
                      <a href="https://zubahouse.com" style="color: #efb291; text-decoration: none;">Visit Zuba House</a> | 
                      <a href="mailto:info@zubahouse.com" style="color: #efb291; text-decoration: none;">Contact Us</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Build email HTML for admin notification
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Vendor Application - ${storeName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #0b2735; padding: 30px; text-align: center;">
                    <h1 style="color: #efb291; margin: 0; font-size: 28px; font-weight: bold;">New Vendor Application</h1>
                    <p style="color: #e5e2db; margin: 10px 0 0 0; font-size: 16px;">Application ID: ${applicationId}</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #0b2735; margin: 0 0 20px 0; font-size: 24px;">${storeName}</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="color: #0b2735; margin: 0 0 15px 0; font-size: 18px;">Personal Information</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px; width: 40%;"><strong>Name:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Email:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;"><a href="mailto:${normalizedEmail}" style="color: #efb291; text-decoration: none;">${normalizedEmail}</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Phone:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${phone}</td>
                        </tr>
                        ${whatsapp ? `<tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>WhatsApp:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${whatsapp}</td>
                        </tr>` : ''}
                      </table>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="color: #0b2735; margin: 0 0 15px 0; font-size: 18px;">Store Information</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px; width: 40%;"><strong>Store Name:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${storeName}</td>
                        </tr>
                        ${storeDescription ? `<tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px; vertical-align: top;"><strong>Description:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${storeDescription}</td>
                        </tr>` : ''}
                        ${website ? `<tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Website:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;"><a href="${website}" target="_blank" style="color: #efb291; text-decoration: none;">${website}</a></td>
                        </tr>` : ''}
                        ${socialMedia ? `<tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Social Media:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${socialMedia}</td>
                        </tr>` : ''}
                      </table>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="color: #0b2735; margin: 0 0 15px 0; font-size: 18px;">Location</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px; width: 40%;"><strong>Country:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${country}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>City:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${city}</td>
                        </tr>
                        ${addressLine1 ? `<tr>
                          <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Address:</strong></td>
                          <td style="padding: 8px 0; color: #333; font-size: 14px;">${addressLine1}${addressLine2 ? ', ' + addressLine2 : ''}${postalCode ? ', ' + postalCode : ''}</td>
                        </tr>` : ''}
                      </table>
                    </div>
                    
                    ${additionalInfo ? `<div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="color: #0b2735; margin: 0 0 15px 0; font-size: 18px;">Additional Information</h3>
                      <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0;">${additionalInfo}</p>
                    </div>` : ''}
                    
                    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6;">
                        <strong>Action Required:</strong> Please review this application and create a vendor account for the applicant through the admin panel if approved.
                      </p>
                    </div>
                    
                    <p style="color: #666; font-size: 12px; margin: 30px 0 0 0; text-align: center;">
                      Application submitted on ${applicationDate}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #0b2735; padding: 20px; text-align: center;">
                    <p style="color: #e5e2db; margin: 0; font-size: 12px;">
                      © ${new Date().getFullYear()} Zuba House Admin Portal
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send confirmation email to applicant
    const confirmationResult = await sendEmail(
      normalizedEmail,
      'Vendor Application Received - Zuba House',
      `Thank you for your vendor application. We've received your application for ${storeName} and will review it within 2-3 business days.`,
      confirmationEmailHtml
    );

    // Send notification email to admin
    const adminEmail = 'info@zubahouse.com';
    const adminResult = await sendEmail(
      adminEmail,
      `New Vendor Application: ${storeName}`,
      `A new vendor application has been submitted:\n\nStore: ${storeName}\nApplicant: ${name}\nEmail: ${normalizedEmail}\nPhone: ${phone}\nLocation: ${city}, ${country}\n\nPlease review and create vendor account if approved.`,
      adminEmailHtml
    );

    if (!confirmationResult.success) {
      console.error('Failed to send confirmation email:', confirmationResult.error);
    }

    if (!adminResult.success) {
      console.error('Failed to send admin notification email:', adminResult.error);
    }

    console.log('✅ Vendor application submitted:', {
      applicationId,
      storeName,
      email: normalizedEmail,
      confirmationEmailSent: confirmationResult.success,
      adminEmailSent: adminResult.success
    });

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Application submitted successfully! You will receive a confirmation email shortly.',
      data: {
        applicationId,
        email: normalizedEmail
      }
    });

  } catch (error) {
    console.error('❌ Vendor application error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to submit application. Please try again.'
    });
  }
};
