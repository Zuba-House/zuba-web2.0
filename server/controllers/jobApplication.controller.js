import { sendEmail } from '../config/emailService.js';
import fs from 'fs';
import path from 'path';

/**
 * Submit job application
 * Sends application via SendGrid with PDF attachment
 */
export const submitJobApplication = async (req, res) => {
    try {
        let {
            name,
            email,
            location,
            phone,
            portfolio,
            education,
            fieldOfStudy,
            currentStatus,
            yearsOfExperience,
            designTools,
            videoExperience,
            workAvailability,
            contractConfirmation,
            technicalReadiness,
            whyInterested,
            additionalInfo,
            position
        } = req.body;

        // Parse designTools if it's a JSON string
        if (typeof designTools === 'string') {
            try {
                designTools = JSON.parse(designTools);
            } catch (e) {
                designTools = [designTools];
            }
        }
        if (!Array.isArray(designTools)) {
            designTools = designTools ? [designTools] : [];
        }

        const resumeFile = req.file;

        // Validation
        if (!name || !email || !location || !phone || !portfolio || !resumeFile) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Validate portfolio URL
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(portfolio)) {
            return res.status(400).json({
                success: false,
                error: 'Portfolio must be a valid URL starting with http:// or https://'
            });
        }

        // Build email HTML content
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0b2735 0%, #0f3547 100%); color: #efb291; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #0b2735; }
        .value { margin-left: 10px; color: #555; }
        .footer { background: #0b2735; color: #e5e2db; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .divider { border-top: 2px solid #efb291; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">🎨 Job Application - ${position || 'Position Application'}</h2>
        </div>
        <div class="content">
            <div class="section">
                <h3 style="color: #0b2735; border-bottom: 2px solid #efb291; padding-bottom: 10px;">Applicant Information</h3>
                <p><span class="label">Name:</span><span class="value">${name}</span></p>
                <p><span class="label">Email:</span><span class="value">${email}</span></p>
                <p><span class="label">Location:</span><span class="value">${location}</span></p>
                <p><span class="label">Phone/WhatsApp:</span><span class="value">${phone}</span></p>
                <p><span class="label">Portfolio:</span><span class="value"><a href="${portfolio}" target="_blank">${portfolio}</a></span></p>
            </div>

            <div class="divider"></div>

            <div class="section">
                <h3 style="color: #0b2735; border-bottom: 2px solid #efb291; padding-bottom: 10px;">Education & Background</h3>
                <p><span class="label">Highest Education:</span><span class="value">${education || 'Not specified'}</span></p>
                ${fieldOfStudy ? `<p><span class="label">Field of Study:</span><span class="value">${fieldOfStudy}</span></p>` : ''}
                <p><span class="label">Current Status:</span><span class="value">${currentStatus || 'Not specified'}</span></p>
                <p><span class="label">Years of Experience:</span><span class="value">${yearsOfExperience || 'Not specified'}</span></p>
            </div>

            <div class="divider"></div>

            <div class="section">
                <h3 style="color: #0b2735; border-bottom: 2px solid #efb291; padding-bottom: 10px;">Skills & Tools</h3>
                <p><span class="label">Design Tools:</span><span class="value">${designTools ? (Array.isArray(designTools) ? designTools.join(', ') : designTools) : 'Not specified'}</span></p>
                <p><span class="label">Video Design Experience:</span><span class="value">${videoExperience || 'Not specified'}</span></p>
            </div>

            <div class="divider"></div>

            <div class="section">
                <h3 style="color: #0b2735; border-bottom: 2px solid #efb291; padding-bottom: 10px;">Availability & Requirements</h3>
                <p><span class="label">Work Availability (Mon-Fri, 9AM-5PM Kigali time):</span><span class="value">${workAvailability || 'Not specified'}</span></p>
                <p><span class="label">Can Sign Contract in Kigali:</span><span class="value">${contractConfirmation || 'Not specified'}</span></p>
                <p><span class="label">Technical Readiness:</span><span class="value">${technicalReadiness || 'Not specified'}</span></p>
            </div>

            <div class="divider"></div>

            <div class="section">
                <h3 style="color: #0b2735; border-bottom: 2px solid #efb291; padding-bottom: 10px;">Motivation</h3>
                <p style="background: #fff; padding: 15px; border-left: 4px solid #efb291; margin: 0;">${whyInterested || 'Not provided'}</p>
            </div>

            ${additionalInfo ? `
            <div class="divider"></div>
            <div class="section">
                <h3 style="color: #0b2735; border-bottom: 2px solid #efb291; padding-bottom: 10px;">Additional Information</h3>
                <p style="background: #fff; padding: 15px; border-left: 4px solid #efb291; margin: 0;">${additionalInfo}</p>
            </div>
            ` : ''}

            <div class="divider"></div>

            <div class="section">
                <p style="font-size: 12px; color: #777;">
                    <strong>Application Date:</strong> ${new Date().toLocaleString()}<br>
                    <strong>Application ID:</strong> APP-${Date.now()}<br>
                    <strong>Resume:</strong> Attached as PDF
                </p>
            </div>
        </div>
        <div class="footer">
            <p style="margin: 0;">This is an automated application submission from Zuba House Careers Portal</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        // Build plain text version
        const emailText = `
Job Application - ${position || 'Position Application'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPLICANT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${name}
Email: ${email}
Location: ${location}
Phone/WhatsApp: ${phone}
Portfolio: ${portfolio}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EDUCATION & BACKGROUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Highest Education: ${education || 'Not specified'}
${fieldOfStudy ? `Field of Study: ${fieldOfStudy}\n` : ''}Current Status: ${currentStatus || 'Not specified'}
Years of Experience: ${yearsOfExperience || 'Not specified'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILLS & TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Design Tools: ${designTools ? (Array.isArray(designTools) ? designTools.join(', ') : designTools) : 'Not specified'}
Video Design Experience: ${videoExperience || 'Not specified'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABILITY & REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Work Availability (Mon-Fri, 9AM-5PM Kigali time): ${workAvailability || 'Not specified'}
Can Sign Contract in Kigali: ${contractConfirmation || 'Not specified'}
Technical Readiness: ${technicalReadiness || 'Not specified'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHY INTERESTED IN ZUBA HOUSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${whyInterested || 'Not provided'}

${additionalInfo ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIONAL INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${additionalInfo}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Application Date: ${new Date().toLocaleString()}
Application ID: APP-${Date.now()}
Resume: Attached as PDF
        `.trim();

        // Read resume file
        const resumePath = resumeFile.path;
        const resumeContent = fs.readFileSync(resumePath);
        const resumeBase64 = resumeContent.toString('base64');

        // Send email with attachment using SendGrid
        const sgMail = (await import('@sendgrid/mail')).default;
        const sendGridApiKey = process.env.SENDGRID_API_KEY;
        
        if (!sendGridApiKey) {
            // Clean up file
            fs.unlinkSync(resumePath);
            return res.status(500).json({
                success: false,
                error: 'Email service not configured'
            });
        }

        sgMail.setApiKey(sendGridApiKey);
        
        const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.EMAIL || 'orders@zubahouse.com';
        const senderName = process.env.EMAIL_SENDER_NAME || 'Zuba House';

        const msg = {
            to: ['info@zubahouse.com'],
            cc: ['it.deboss019@gmail.com'],
            from: {
                email: senderEmail,
                name: senderName
            },
            replyTo: email,
            subject: `Job Application: ${position || 'Position'} - ${name}`,
            html: emailHtml,
            text: emailText,
            attachments: [
                {
                    content: resumeBase64,
                    filename: resumeFile.originalname || `resume_${name.replace(/\s+/g, '_')}.pdf`,
                    type: 'application/pdf',
                    disposition: 'attachment'
                }
            ]
        };

        try {
            await sgMail.send(msg);
            
            // Clean up uploaded file after sending
            try {
                fs.unlinkSync(resumePath);
            } catch (unlinkError) {
                console.error('Error deleting resume file:', unlinkError);
            }

            return res.status(200).json({
                success: true,
                message: 'Application submitted successfully',
                applicationId: `APP-${Date.now()}`
            });
        } catch (emailError) {
            console.error('SendGrid error:', emailError);
            
            // Clean up file on error
            try {
                fs.unlinkSync(resumePath);
            } catch (unlinkError) {
                console.error('Error deleting resume file:', unlinkError);
            }

            return res.status(500).json({
                success: false,
                error: 'Failed to send application email',
                details: emailError.message
            });
        }
    } catch (error) {
        console.error('Job application error:', error);
        
        // Clean up file on error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting resume file:', unlinkError);
            }
        }

        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
};

