import VendorModel from '../models/vendor.model.js';
import UserModel from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import sendEmailFun from '../config/sendEmail.js';
import VerificationEmail from '../utils/verifyEmailTemplate.js';

// In-memory OTP storage for unregistered users
// Key: email, Value: { otp, expires, verified }
const pendingOTPStore = new Map();

// Cleanup expired OTPs every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingOTPStore.entries()) {
    if (now > data.expires) {
      pendingOTPStore.delete(email);
    }
  }
}, 15 * 60 * 1000);

/**
 * POST /api/vendor/send-otp
 * Public endpoint - Send OTP for vendor registration
 * Works for both new users AND existing users who need to verify
 */
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid email format'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    
    if (existingUser) {
      // Check if already has an active vendor account - check BOTH user references AND vendor collection
      let existingVendor = null;
      
      // Method 1: Check via user's vendor/vendorId field
      if (existingUser.vendor || existingUser.vendorId) {
        existingVendor = await VendorModel.findById(existingUser.vendor || existingUser.vendorId);
        if (!existingVendor) {
          // Orphan reference - clear it
          console.log('🧹 Clearing orphan vendor reference for:', normalizedEmail);
          existingUser.vendor = null;
          existingUser.vendorId = null;
          await existingUser.save();
        }
      }
      
      // Method 2: Check vendor collection directly by ownerUser
      if (!existingVendor) {
        existingVendor = await VendorModel.findOne({ ownerUser: existingUser._id });
        if (existingVendor) {
          // Link vendor to user if not linked
          console.log('🔗 Linking found vendor to user:', normalizedEmail);
          existingUser.vendor = existingVendor._id;
          existingUser.vendorId = existingVendor._id;
          await existingUser.save();
        }
      }
      
      // If vendor exists, tell them to login
      if (existingVendor) {
        return res.status(400).json({
          error: true,
          success: false,
          message: `You already have a vendor account "${existingVendor.storeName}". Please login instead.`,
          data: { 
            hasVendorAccount: true,
            vendorStatus: existingVendor.status,
            storeName: existingVendor.storeName
          }
        });
      }
      
      // User exists but NO vendor account - check if email is verified
      if (existingUser.verify_email) {
        // Email already verified, they can proceed to registration
        return res.status(200).json({
          error: false,
          success: true,
          message: 'Email already verified. You can proceed with registration.',
          data: { emailVerified: true }
        });
      }
      
      // Send OTP to existing unverified user
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
      existingUser.otp = verifyCode;
      existingUser.otpExpires = Date.now() + 600000; // 10 minutes
      await existingUser.save();
      
      console.log(`\n🔐 ====== OTP GENERATED FOR EXISTING USER ======`);
      console.log(`📧 Email: ${normalizedEmail}`);
      console.log(`👤 Name: ${existingUser.name || 'Vendor'}`);
      console.log(`🔑 OTP Code: ${verifyCode}`);
      console.log(`⏰ Expires in: 10 minutes`);
      console.log(`================================================\n`);

      // Check SendGrid configuration before attempting to send
      const hasSendGridKey = !!process.env.SENDGRID_API_KEY;
      const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.EMAIL;
      
      console.log(`📧 SendGrid Config: API_KEY=${hasSendGridKey ? 'SET' : 'NOT SET'}, FROM=${senderEmail || 'NOT SET'}`);

      // Try to send email
      let emailSent = false;
      let emailError = null;
      
      if (!hasSendGridKey) {
        console.error('❌ SENDGRID_API_KEY not configured - cannot send email');
        emailError = 'Email service not configured';
      } else {
        try {
          emailSent = await sendOTPEmail(normalizedEmail, existingUser.name || 'Vendor', verifyCode);
        } catch (err) {
          console.error('❌ Email sending failed:', err.message);
          emailError = err.message;
        }
      }
      
      // Return response - include OTP when email fails for local testing
      const isLocal = !process.env.RENDER && !process.env.VERCEL;
      
      return res.status(200).json({
        error: false,
        success: true,
        message: emailSent 
          ? 'Verification code sent to your email. Please check your inbox (and spam folder).'
          : `Verification code generated.${isLocal ? ' Check your server console for the OTP code.' : ' Email delivery issue - please contact support.'}`,
        data: { 
          email: normalizedEmail,
          emailSent: emailSent,
          // Include OTP in response when email fails (for local testing)
          ...(!emailSent ? { otp: verifyCode } : {}),
          ...(emailError ? { emailError: emailError } : {})
        }
      });
    }

    // New user - store OTP in memory
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    pendingOTPStore.set(normalizedEmail, {
      otp: verifyCode,
      expires: Date.now() + 600000, // 10 minutes
      verified: false
    });

    console.log(`\n🔐 ====== OTP GENERATED FOR NEW USER ======`);
    console.log(`📧 Email: ${normalizedEmail}`);
    console.log(`🔑 OTP Code: ${verifyCode}`);
    console.log(`⏰ Expires in: 10 minutes`);
    console.log(`==========================================\n`);

    // Check SendGrid configuration before attempting to send
    const hasSendGridKey = !!process.env.SENDGRID_API_KEY;
    const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.EMAIL;
    
    console.log(`📧 SendGrid Config: API_KEY=${hasSendGridKey ? 'SET' : 'NOT SET'}, FROM=${senderEmail || 'NOT SET'}`);

    // Try to send email
    let emailSent = false;
    let emailError = null;
    
    if (!hasSendGridKey) {
      console.error('❌ SENDGRID_API_KEY not configured - cannot send email');
      emailError = 'Email service not configured';
    } else {
      try {
        emailSent = await sendOTPEmail(normalizedEmail, 'Vendor', verifyCode);
      } catch (err) {
        console.error('❌ Email sending failed:', err.message);
        emailError = err.message;
      }
    }

    // Return response - include OTP when email fails for local testing
    const isLocal = !process.env.RENDER && !process.env.VERCEL;
    
    return res.status(200).json({
      error: false,
      success: true,
      message: emailSent 
        ? 'Verification code sent to your email. Please check your inbox (and spam folder).'
        : `Verification code generated.${isLocal ? ' Check your server console for the OTP code.' : ' Email delivery issue - please contact support.'}`,
      data: { 
        email: normalizedEmail,
        emailSent: emailSent,
        // Include OTP in response when email fails (for local testing)
        ...(!emailSent ? { otp: verifyCode } : {}),
        ...(emailError ? { emailError: emailError } : {})
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
};

/**
 * POST /api/vendor/verify-otp
 * Public endpoint - Verify OTP before registration
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedOTP = otp.trim();

    // Check pending OTP store FIRST (for new users)
    const pendingData = pendingOTPStore.get(normalizedEmail);
    
    if (pendingData) {
      // New user flow - verify OTP from pending store
      if (Date.now() > pendingData.expires) {
        pendingOTPStore.delete(normalizedEmail);
        return res.status(400).json({
          error: true,
          success: false,
          message: 'OTP expired. Please request a new one.'
        });
      }

      if (pendingData.otp !== trimmedOTP) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Invalid OTP code'
        });
      }

      // ✅ CRITICAL: Mark as verified in pending store (DO NOT CREATE USER HERE)
      // User creation happens ONLY in applyToBecomeVendor function after form submission
      pendingOTPStore.set(normalizedEmail, {
        ...pendingData,
        verified: true,
        verifiedAt: Date.now()
      });

      console.log('✅ OTP verified for new user (pending store):', normalizedEmail.substring(0, 10) + '...');
      console.log('📝 User will be created during application submission, not here');

      return res.status(200).json({
        error: false,
        success: true,
        message: 'Email verified successfully! You can proceed with registration.',
        data: { email: normalizedEmail, verified: true }
      });
    }

    // Check if existing user (for backward compatibility with old flow)
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    
    if (existingUser) {
      // Check if they already have a vendor account
      const existingVendor = await VendorModel.findOne({ 
        $or: [
          { ownerUser: existingUser._id },
          { email: normalizedEmail }
        ]
      });

      if (existingVendor) {
        return res.status(400).json({
          error: true,
          success: false,
          message: `You already have a vendor account "${existingVendor.storeName}". Please login instead.`,
          data: { 
            hasVendorAccount: true,
            vendorStatus: existingVendor.status,
            storeName: existingVendor.storeName
          }
        });
      }

      // User exists but no vendor - verify OTP if stored in user record
      const isCodeValid = existingUser.otp === trimmedOTP;
      const isNotExpired = existingUser.otpExpires && existingUser.otpExpires > Date.now();

      if (!isCodeValid) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Invalid OTP code. Please request a new one.'
        });
      }

      if (!isNotExpired) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'OTP expired. Please request a new one.'
        });
      }

      // Mark as verified (for existing user flow)
      existingUser.verify_email = true;
      existingUser.otp = null;
      existingUser.otpExpires = null;
      await existingUser.save();

      console.log('✅ OTP verified for existing user:', normalizedEmail.substring(0, 10) + '...');

      return res.status(200).json({
        error: false,
        success: true,
        message: 'Email verified successfully! You can proceed with registration.',
        data: { email: normalizedEmail, verified: true }
      });
    }

    // No OTP found anywhere
    return res.status(400).json({
      error: true,
      success: false,
      message: 'No OTP found for this email. Please request a new one.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to verify OTP'
    });
  }
};

/**
 * POST /api/vendor/apply
 * Public endpoint - Apply to become a vendor
 * Requires email to be verified first
 */
export const applyToBecomeVendor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      storeName,
      storeSlug,
      description,
      phone,
      whatsapp,
      country,
      city,
      addressLine1,
      addressLine2,
      postalCode,
      categories
    } = req.body;

    console.log('📝 Vendor application received:', {
      email: email?.substring(0, 10) + '...',
      storeName,
      storeSlug,
      hasName: !!name,
      hasPassword: !!password
    });

    // Validate required fields
    if (!storeName || !storeSlug || !email) {
      console.log('❌ Missing required fields:', { storeName: !!storeName, storeSlug: !!storeSlug, email: !!email });
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Store name, store URL slug, and email are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate store slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(storeSlug.toLowerCase())) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Store URL slug can only contain lowercase letters, numbers, and hyphens'
      });
    }

    // Check if slug is already taken
    const existingVendor = await VendorModel.findOne({ 
      storeSlug: storeSlug.toLowerCase().trim() 
    });
    if (existingVendor) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Store URL slug already taken. Please choose another.'
      });
    }

    // ===== CRITICAL: Check OTP verification FIRST (from pending store) =====
    const pendingData = pendingOTPStore.get(normalizedEmail);
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    
    // Check if email is verified
    let isEmailVerified = false;
    
    if (pendingData && pendingData.verified) {
      // New user flow - check pending OTP store
      // Check if verification is still valid (within 30 minutes)
      const verificationAge = Date.now() - (pendingData.verifiedAt || 0);
      if (verificationAge > 30 * 60 * 1000) {
        pendingOTPStore.delete(normalizedEmail);
        console.error('❌ Verification expired for:', normalizedEmail);
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Email verification expired. Please start over and verify your email again.',
          data: { requiresEmailVerification: true }
        });
      }
      
      isEmailVerified = true;
      console.log('✅ Email verified via pending OTP store');
    } else if (existingUser && existingUser.verify_email) {
      // Existing user flow - check user's verify_email flag (backward compatibility)
      isEmailVerified = true;
      console.log('✅ Email verified via existing user record');
    } else {
      // Email not verified - REJECT EARLY
      console.error('❌ Email not verified, rejecting application for:', normalizedEmail);
      
      if (!pendingData) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Please request and verify OTP first. Start from Step 1: Send OTP.',
          data: { requiresEmailVerification: true, hint: 'Start from Step 1: Send OTP' }
        });
      }
      
      if (!pendingData.verified) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Please verify your email with OTP first. Complete Step 2: Verify OTP.',
          data: { requiresEmailVerification: true, hint: 'Complete Step 2: Verify OTP' }
        });
      }
      
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email verification required. Please verify your email with OTP first.',
        data: { requiresEmailVerification: true }
      });
    }

    console.log('✅ Email verification confirmed for:', normalizedEmail.substring(0, 10) + '...');

    // Check if user already exists
    let user = await UserModel.findOne({ email: normalizedEmail });
    
    if (user) {
      console.log('📝 Processing existing user for vendor application:', normalizedEmail);
      
      // Check if already has a vendor account (by ownerUser first)
      let existingVendorAccount = await VendorModel.findOne({ 
        ownerUser: user._id
      });
      
      // If no vendor by ownerUser, check by email
      if (!existingVendorAccount) {
        existingVendorAccount = await VendorModel.findOne({ 
          email: normalizedEmail 
        });
      }
      
      if (existingVendorAccount) {
        // Check if vendor belongs to this user
        const belongsToUser = existingVendorAccount.ownerUser && 
                              existingVendorAccount.ownerUser.toString() === user._id.toString();
        
        // Only reject if vendor is ACTIVE or APPROVED AND belongs to this user
        if (belongsToUser && (existingVendorAccount.status === 'APPROVED' || existingVendorAccount.status === 'ACTIVE')) {
          return res.status(400).json({
            error: true,
            success: false,
            message: `You already have an active vendor account "${existingVendorAccount.storeName}". Please login to access your vendor dashboard.`,
            data: { 
              hasVendorAccount: true,
              vendorStatus: existingVendorAccount.status,
              storeName: existingVendorAccount.storeName
            }
          });
        }
        
        // If vendor belongs to different user, delete it and create new one
        if (!belongsToUser) {
          console.log('⚠️ Vendor exists with different owner, deleting old vendor');
          await VendorModel.findByIdAndDelete(existingVendorAccount._id);
          
          // Clear vendor reference from old user if exists
          if (existingVendorAccount.ownerUser) {
            const oldUser = await UserModel.findById(existingVendorAccount.ownerUser);
            if (oldUser) {
              oldUser.vendor = null;
              oldUser.vendorId = null;
              if (oldUser.role === 'VENDOR' && !oldUser.vendor) {
                oldUser.role = 'USER';
              }
              await oldUser.save();
            }
          }
          
          // Set to null so new vendor will be created below
          existingVendorAccount = null;
        } else {
          // Vendor belongs to this user - update it
          console.log('🔄 Found existing vendor with status:', existingVendorAccount.status, '- updating it');
          
          // Update existing vendor
          existingVendorAccount.storeName = storeName.trim();
          existingVendorAccount.storeSlug = storeSlug.toLowerCase().trim();
          existingVendorAccount.description = description || '';
          existingVendorAccount.email = normalizedEmail;
          existingVendorAccount.phone = phone || '';
          existingVendorAccount.whatsapp = whatsapp || '';
          existingVendorAccount.country = country || '';
          existingVendorAccount.city = city || '';
          existingVendorAccount.addressLine1 = addressLine1 || '';
          existingVendorAccount.addressLine2 = addressLine2 || '';
          existingVendorAccount.postalCode = postalCode || '';
          existingVendorAccount.categories = categories || [];
          existingVendorAccount.status = 'PENDING'; // Reset to pending for re-review
          existingVendorAccount.ownerUser = user._id; // Ensure owner is set
          await existingVendorAccount.save();
          
          // Update user
          user.role = 'VENDOR';
          user.verify_email = true;
          user.status = 'Active';
          if (name) user.name = name;
          if (password && password.length >= 6) {
            const salt = await bcryptjs.genSalt(10);
            user.password = await bcryptjs.hash(password, salt);
          }
          user.vendor = existingVendorAccount._id;
          user.vendorId = existingVendorAccount._id;
          await user.save();
          
          // Clear pending OTP data
          if (pendingData) {
            pendingOTPStore.delete(normalizedEmail);
          }
          
          // Generate tokens
          const generatedAccessToken = (await import('../utils/generatedAccessToken.js')).default;
          const genertedRefreshToken = (await import('../utils/generatedRefreshToken.js')).default;
          const accessToken = await generatedAccessToken(user._id);
          const refreshToken = await genertedRefreshToken(user._id);
          
          console.log('✅ Existing vendor application updated successfully');
          
          return res.status(201).json({
            error: false,
            success: true,
            message: 'Vendor application updated successfully! Your application is under review. You will be notified once approved.',
          data: {
            accesstoken: accessToken,
            refreshToken: refreshToken,
            vendorId: existingVendorAccount._id,
            storeName: existingVendorAccount.storeName,
            storeSlug: existingVendorAccount.storeSlug,
            status: existingVendorAccount.status,
            emailVerified: true,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role
            },
            vendor: {
              id: existingVendorAccount._id,
              storeName: existingVendorAccount.storeName,
              storeSlug: existingVendorAccount.storeSlug,
              status: existingVendorAccount.status
            }
          }
        });
        }
      }
      
      // If we reach here, no existing vendor was found or it was deleted
      // Update existing user to become vendor (if not already)
      if (user.role !== 'VENDOR') {
        user.role = 'VENDOR';
      }
      user.verify_email = true;
      user.status = 'Active';
      
      // Update name if provided
      if (name) {
        user.name = name;
      }
      
      // Update password if provided
      if (password && password.length >= 6) {
        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(password, salt);
        console.log('✅ Password updated for existing user');
      }
      
      await user.save();
      console.log('✅ Existing user updated to VENDOR');
    } else {
      // ===== CREATE NEW USER ACCOUNT (ONLY if OTP was verified) =====
      // Double-check OTP verification before creating user
      if (!isEmailVerified) {
        console.error('❌ Attempted to create user without OTP verification:', normalizedEmail);
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Email verification required. Please verify your email with OTP first.',
          data: { requiresEmailVerification: true }
        });
      }
      
      if (!password || password.length < 6) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Password is required and must be at least 6 characters'
        });
      }

      if (!name) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Full name is required'
        });
      }

      console.log('👤 Creating new user account for vendor application...');
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);

      user = await UserModel.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'VENDOR',
        status: 'Active',
        verify_email: true // Already verified via OTP
      });
      
      console.log('✅ New user created for vendor application:', user._id);
    }

    // Validate user._id exists before creating vendor
    if (!user || !user._id) {
      return res.status(500).json({
        error: true,
        success: false,
        message: 'User account error. Please try again.'
      });
    }

    // Final check: ensure no vendor exists for this user (safety check)
    const finalVendorCheck = await VendorModel.findOne({ ownerUser: user._id });
    if (finalVendorCheck) {
      // Vendor already exists for this user - update it
      console.log('🔄 Final check: Vendor exists for user, updating:', finalVendorCheck.status);
      
      finalVendorCheck.storeName = storeName.trim();
      finalVendorCheck.storeSlug = storeSlug.toLowerCase().trim();
      finalVendorCheck.description = description || '';
      finalVendorCheck.email = normalizedEmail;
      finalVendorCheck.phone = phone || '';
      finalVendorCheck.whatsapp = whatsapp || '';
      finalVendorCheck.country = country || '';
      finalVendorCheck.city = city || '';
      finalVendorCheck.addressLine1 = addressLine1 || '';
      finalVendorCheck.addressLine2 = addressLine2 || '';
      finalVendorCheck.postalCode = postalCode || '';
      finalVendorCheck.categories = categories || [];
      finalVendorCheck.status = 'PENDING'; // Reset to pending for re-review
      await finalVendorCheck.save();
      
      user.vendor = finalVendorCheck._id;
      user.vendorId = finalVendorCheck._id;
      await user.save();
      
      // Clear pending OTP data
      if (pendingData) {
        pendingOTPStore.delete(normalizedEmail);
      }
      
      // Generate tokens
      const generatedAccessToken = (await import('../utils/generatedAccessToken.js')).default;
      const genertedRefreshToken = (await import('../utils/generatedRefreshToken.js')).default;
      const accessToken = await generatedAccessToken(user._id);
      const refreshToken = await genertedRefreshToken(user._id);
      
      return res.status(201).json({
        error: false,
        success: true,
        message: 'Vendor application updated successfully! Your application is under review. You will be notified once approved.',
        data: {
          accesstoken: accessToken,
          refreshToken: refreshToken,
          vendorId: finalVendorCheck._id,
          storeName: finalVendorCheck.storeName,
          storeSlug: finalVendorCheck.storeSlug,
          status: finalVendorCheck.status,
          emailVerified: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          vendor: {
            id: finalVendorCheck._id,
            storeName: finalVendorCheck.storeName,
            storeSlug: finalVendorCheck.storeSlug,
            status: finalVendorCheck.status
          }
        }
      });
    }
    
    // Check if vendor with this email exists but different owner
    const existingVendorByEmail = await VendorModel.findOne({ email: normalizedEmail });
    if (existingVendorByEmail) {
      // Vendor exists with this email but different owner - delete it
      console.log('⚠️ Vendor exists with different owner, deleting old vendor');
      await VendorModel.findByIdAndDelete(existingVendorByEmail._id);
      
      // Clear vendor reference from old user if exists
      if (existingVendorByEmail.ownerUser) {
        const oldUser = await UserModel.findById(existingVendorByEmail.ownerUser);
        if (oldUser) {
          oldUser.vendor = null;
          oldUser.vendorId = null;
          if (oldUser.role === 'VENDOR' && !oldUser.vendor) {
            oldUser.role = 'USER';
          }
          await oldUser.save();
        }
      }
      
      // Continue to create new vendor below
    }
    
    // Check if vendor with this slug exists (and doesn't belong to this user)
    const existingVendorBySlug = await VendorModel.findOne({ 
      storeSlug: storeSlug.toLowerCase().trim() 
    });
    if (existingVendorBySlug && existingVendorBySlug.ownerUser?.toString() !== user._id.toString()) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Store URL slug already taken. Please choose another.',
        data: { 
          slugTaken: true,
          existingStoreName: existingVendorBySlug.storeName
        }
      });
    }
      const accessToken2 = await generatedAccessToken2(user._id);
      const refreshToken2 = await genertedRefreshToken2(user._id);
      
      return res.status(201).json({
        error: false,
        success: true,
        message: 'Vendor application updated successfully! Your application is under review. You will be notified once approved.',
        data: {
          accesstoken: accessToken2,
          refreshToken: refreshToken2,
          vendorId: existingVendorByEmail._id,
          storeName: existingVendorByEmail.storeName,
          storeSlug: existingVendorByEmail.storeSlug,
          status: existingVendorByEmail.status,
          emailVerified: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          vendor: {
            id: existingVendorByEmail._id,
            storeName: existingVendorByEmail.storeName,
            storeSlug: existingVendorByEmail.storeSlug,
            status: existingVendorByEmail.status
          }
        }
      });
    }

    // At this point, we've handled all existing vendor cases above
    // Now create a new vendor account
    console.log('📝 Creating new vendor account for:', normalizedEmail);
    
    try {
      const vendor = await VendorModel.create({
        ownerUser: user._id,
        storeName: storeName.trim(),
        storeSlug: storeSlug.toLowerCase().trim(),
        description: description || '',
        email: normalizedEmail,
        phone: phone || '',
        whatsapp: whatsapp || '',
        country: country || '',
        city: city || '',
        addressLine1: addressLine1 || '',
        addressLine2: addressLine2 || '',
        postalCode: postalCode || '',
        categories: categories || [],
        status: 'PENDING' // Requires admin approval
      });
      
      // Link vendor to user
      user.vendor = vendor._id;
      user.vendorId = vendor._id;
      await user.save();
      
      // Clear pending OTP data
      if (pendingData) {
        pendingOTPStore.delete(normalizedEmail);
      }
      
      // Generate tokens for auto-login
      const generatedAccessToken = (await import('../utils/generatedAccessToken.js')).default;
      const genertedRefreshToken = (await import('../utils/generatedRefreshToken.js')).default;
      const accessToken = await generatedAccessToken(user._id);
      const refreshToken = await genertedRefreshToken(user._id);
      
      console.log('✅ New vendor application created successfully:', vendor._id);
      
      return res.status(201).json({
        error: false,
        success: true,
        message: 'Vendor application submitted successfully! Your application is under review. You will be notified once approved.',
        data: {
          accesstoken: accessToken,
          refreshToken: refreshToken,
          vendorId: vendor._id,
          storeName: vendor.storeName,
          storeSlug: vendor.storeSlug,
          status: vendor.status,
          emailVerified: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          vendor: {
            id: vendor._id,
            storeName: vendor.storeName,
            storeSlug: vendor.storeSlug,
            status: vendor.status
          }
        }
      });
    } catch (createError) {
      console.error('❌ Error creating vendor:', createError);
      
      // Handle duplicate key errors
      if (createError.code === 11000) {
        if (createError.keyPattern?.ownerUser) {
          // Vendor already exists for this user - fetch and return it
          const existingVendor = await VendorModel.findOne({ ownerUser: user._id });
          if (existingVendor) {
            user.vendor = existingVendor._id;
            user.vendorId = existingVendor._id;
            await user.save();
            
            return res.status(400).json({
              error: true,
              success: false,
              message: 'You already have a vendor account. Please login to access your vendor dashboard.',
              data: {
                hasVendorAccount: true,
                vendorStatus: existingVendor.status,
                storeName: existingVendor.storeName
              }
            });
          }
        }
        if (createError.keyPattern?.storeSlug) {
          return res.status(400).json({
            error: true,
            success: false,
            message: 'Store URL slug already taken. Please choose another.'
          });
        }
      }
      
      // Re-throw to be caught by outer catch
      throw createError;
    }
  } catch (error) {
    console.error('❌ Apply to become vendor error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
      body: {
        email: req.body?.email?.substring(0, 10) + '...',
        storeName: req.body?.storeName,
        storeSlug: req.body?.storeSlug
      }
    });
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.storeSlug) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Store URL slug already taken. Please choose another.'
        });
      }
      if (error.keyPattern?.email) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'A vendor with this email already exists. Please login or use a different email.'
        });
      }
      if (error.keyPattern?.ownerUser) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'You already have a vendor account. Please login to access your vendor dashboard.'
        });
      }
    }
    
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to submit vendor application'
    });
  }
};

/**
 * POST /api/vendor/verify-email
 * Public endpoint - Verify vendor email with OTP (alias for verifyOTP for backward compatibility)
 */
export const verifyVendorEmail = verifyOTP;

/**
 * POST /api/vendor/resend-otp
 * Public endpoint - Resend OTP for vendor email verification (alias for sendOTP)
 */
export const resendVendorOTP = sendOTP;

/**
 * GET /api/vendor/application-status/:email
 * Public endpoint - Check vendor application status
 */
export const getApplicationStatus = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email is required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check pending OTP verification
    const pendingData = pendingOTPStore.get(normalizedEmail);
    
    const user = await UserModel.findOne({ 
      email: normalizedEmail 
    }).populate('vendor');

    if (!user || !user.vendor) {
      return res.status(200).json({
        error: false,
        success: true,
        message: 'No vendor application found for this email',
        data: {
          hasApplication: false,
          emailVerified: pendingData?.verified || false
        }
      });
    }

    const vendor = await VendorModel.findById(user.vendor);

    return res.status(200).json({
      error: false,
      success: true,
      data: {
        hasApplication: true,
        storeName: vendor.storeName,
        storeSlug: vendor.storeSlug,
        status: vendor.status,
        emailVerified: user.verify_email,
        createdAt: vendor.createdAt
      }
    });
  } catch (error) {
    console.error('Get application status error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to check application status'
    });
  }
};

/**
 * POST /api/vendor/login
 * Public endpoint - Vendor login
 */
export const vendorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔐 Vendor login attempt:', normalizedEmail);

    // Find user with vendor role
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is a vendor
    if (user.role !== 'VENDOR') {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'No vendor account found for this email. Please register as a vendor first.'
      });
    }

    // Check account status
    if (user.status !== 'Active') {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Your account is inactive. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get vendor profile
    const vendor = await VendorModel.findOne({ ownerUser: user._id });
    if (!vendor) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Vendor profile not found. Please contact support.'
      });
    }

    // Check vendor status
    if (vendor.status === 'SUSPENDED') {
      return res.status(403).json({
        error: true,
        success: false,
        message: 'Your vendor account has been suspended. Please contact support.',
        vendorStatus: 'SUSPENDED'
      });
    }

    // Import token generator
    const generatedAccessToken = (await import('../utils/generatedAccessToken.js')).default;
    const genertedRefreshToken = (await import('../utils/generatedRefreshToken.js')).default;

    const accessToken = await generatedAccessToken(user._id);
    const refreshToken = await genertedRefreshToken(user._id);

    // Update last login
    user.last_login_date = new Date();
    await user.save();

    console.log('✅ Vendor login successful:', normalizedEmail);

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Login successful',
      data: {
        accesstoken: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        vendor: {
          id: vendor._id,
          storeName: vendor.storeName,
          storeSlug: vendor.storeSlug,
          status: vendor.status
        }
      }
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

/**
 * POST /api/vendor/forgot-password
 * Public endpoint - Send password reset OTP
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email is required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('🔐 Forgot password request for:', normalizedEmail);

    // Find user
    const user = await UserModel.findOne({ email: normalizedEmail, role: 'VENDOR' });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        error: false,
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.'
      });
    }

    // Generate OTP
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in user document
    user.otp = resetOTP;
    user.otpExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    console.log(`🔐 Password reset OTP for ${normalizedEmail}: ${resetOTP}`);

    // Send email
    try {
      await sendEmailFun({
        sendTo: normalizedEmail,
        subject: "🔐 Reset Your Password - Zuba House Vendor",
        text: `Your password reset code is: ${resetOTP}. This code expires in 10 minutes.`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #0b2735, #1a3d52); color: white; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; color: #efb291; }
              .content { padding: 30px; text-align: center; }
              .otp-box { background: linear-gradient(135deg, #efb291, #eeb190); border-radius: 10px; padding: 25px; margin: 20px 0; }
              .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0b2735; font-family: monospace; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; text-align: left; font-size: 14px; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Zuba House Vendor Portal</p>
              </div>
              <div class="content">
                <p>Hello ${user.name || 'Vendor'},</p>
                <p>You requested to reset your password. Use the code below:</p>
                <div class="otp-box">
                  <div class="otp-code">${resetOTP}</div>
                </div>
                <div class="warning">
                  <strong>⏰ This code expires in 10 minutes.</strong><br>
                  If you didn't request this, please ignore this email.
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Zuba House. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
      console.log('✅ Password reset email sent to:', normalizedEmail);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: 'If an account exists with this email, you will receive a password reset code.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to process request'
    });
  }
};

/**
 * POST /api/vendor/reset-password
 * Public endpoint - Reset password with OTP
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await UserModel.findOne({ email: normalizedEmail, role: 'VENDOR' });

    if (!user) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid request'
      });
    }

    // Verify OTP
    if (user.otp !== otp.trim()) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid OTP code'
      });
    }

    if (!user.otpExpires || Date.now() > user.otpExpires) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    console.log('✅ Password reset successful for:', normalizedEmail);

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
};

/**
 * GET /api/vendor/me
 * Get vendor profile
 */
export const getMyProfile = async (req, res) => {
  try {
    const vendor = await VendorModel.findById(req.vendorId)
      .populate('ownerUser', 'name email')
      .populate('categories', 'name slug');

    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('getMyProfile error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * PUT /api/vendor/me
 * Update vendor profile
 */
export const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = [
      'storeName',
      'storeSlug',
      'logoUrl',
      'bannerUrl',
      'description',
      'shortDescription',
      'country',
      'city',
      'addressLine1',
      'addressLine2',
      'postalCode',
      'phone',
      'whatsapp',
      'email',
      'shippingPolicy',
      'returnPolicy',
      'handlingTimeDays',
      'seoTitle',
      'seoDescription',
      'seoKeywords',
      'categories',
      'socialLinks'
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    // Validate store slug if provided
    if (updates.storeSlug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(updates.storeSlug.toLowerCase())) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Store slug can only contain lowercase letters, numbers, and hyphens'
        });
      }

      // Check if slug is already taken by another vendor
      const existingVendor = await VendorModel.findOne({
        storeSlug: updates.storeSlug.toLowerCase().trim(),
        _id: { $ne: req.vendorId }
      });

      if (existingVendor) {
        return res.status(400).json({
          error: true,
          success: false,
          message: 'Store slug already taken'
        });
      }

      updates.storeSlug = updates.storeSlug.toLowerCase().trim();
    }

    const vendor = await VendorModel.findOneAndUpdate(
      { _id: req.vendorId },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('ownerUser', 'name email');

    if (!vendor) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Vendor not found'
      });
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: 'Profile updated successfully',
      data: vendor
    });
  } catch (error) {
    console.error('updateMyProfile error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

/**
 * GET /api/vendor/dashboard
 * Get vendor dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    const vendorId = req.vendorId;
    const OrderModel = (await import('../models/order.model.js')).default;
    const ProductModel = (await import('../models/product.model.js')).default;

    // Get orders with vendor items (match by either vendor or vendorId)
    const orders = await OrderModel.find({
      $or: [
        { 'products.vendor': vendorId },
        { 'products.vendorId': vendorId }
      ]
    }).select('products createdAt order_status payment_status');

    let totalOrders = 0;
    let totalRevenue = 0;
    let todayOrders = 0;
    let todayRevenue = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orderStatusCounts = {
      RECEIVED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0
    };

    orders.forEach((order) => {
      const isToday = new Date(order.createdAt) >= today;
      
      order.products.forEach((item) => {
        const itemVendorId = item.vendor || item.vendorId;
        if (itemVendorId && itemVendorId.toString() === String(vendorId)) {
          totalOrders += 1;
          const earning = item.vendorEarning || item.subTotal || 0;
          totalRevenue += earning;

          if (isToday) {
            todayOrders += 1;
            todayRevenue += earning;
          }

          // Count by vendor status
          if (item.vendorStatus && orderStatusCounts[item.vendorStatus] !== undefined) {
            orderStatusCounts[item.vendorStatus]++;
          }
        }
      });
    });

    // Get product counts
    const totalProducts = await ProductModel.countDocuments({ vendor: vendorId });
    const publishedProducts = await ProductModel.countDocuments({
      vendor: vendorId,
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED'
    });

    // Get vendor for balance info
    const vendor = await VendorModel.findById(vendorId).select('totalSales totalEarnings availableBalance pendingBalance');

    return res.status(200).json({
      error: false,
      success: true,
      data: {
        stats: {
          totalOrders,
          totalRevenue,
          todayOrders,
          todayRevenue,
          totalProducts,
          publishedProducts,
          orderStatusCounts
        },
        earnings: {
          totalSales: vendor?.totalSales || 0,
          totalEarnings: vendor?.totalEarnings || 0,
          availableBalance: vendor?.availableBalance || 0,
          pendingBalance: vendor?.pendingBalance || 0
        }
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Helper function to send OTP email
async function sendOTPEmail(email, name, otp) {
  console.log('\n📧 ====== SENDING VENDOR OTP EMAIL ======');
  console.log('📧 Recipient:', email);
  console.log('👤 Name:', name);
  console.log('🔐 OTP:', otp);
  
  // Generate email template
  const emailHtml = VerificationEmail(name, otp);
  const emailText = `Hi ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nZuba House Team`;
  
  console.log('📧 Email template prepared:', {
    hasHtml: !!emailHtml,
    htmlLength: emailHtml?.length || 0,
    hasText: !!emailText,
    textLength: emailText?.length || 0
  });
  
  try {
    const result = await sendEmailFun({
      sendTo: email, // Can be string or array
      subject: "Verify Your Email - Zuba House Vendor Registration", // Removed emoji - might cause SendGrid issues
      text: emailText,
      html: emailHtml
    });
    
    if (result) {
      console.log('✅ Vendor OTP email sent successfully to:', email);
      console.log('====================================\n');
      return true;
    } else {
      console.error('❌ SendEmailFun returned false for:', email);
      console.error('⚠️ Check server logs above for detailed SendGrid error information');
      console.log('====================================\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send vendor OTP email:', {
      to: email,
      error: error.message,
      stack: error.stack
    });
    if (error.response) {
      console.error('❌ SendGrid error response:', {
        statusCode: error.response.statusCode,
        body: error.response.body,
        errors: error.response.body?.errors
      });
    }
    console.log('====================================\n');
    throw error;
  }
}
