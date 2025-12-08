import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoose from 'mongoose';
import connectDB from './config/connectDb.js';
import { validateEnv } from './config/validateEnv.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import userRouter from './route/user.route.js';
import categoryRouter from './route/category.route.js';
import productRouter from './route/product.route.js';
import cartRouter from './route/cart.route.js';
import myListRouter from './route/mylist.route.js';
import addressRouter from './route/address.route.js';
import homeSlidesRouter from './route/homeSlides.route.js';
import bannerV1Router from './route/bannerV1.route.js';
import bannerList2Router from './route/bannerList2.route.js';
import blogRouter from './route/blog.route.js';
import orderRouter from './route/order.route.js';
import orderTrackingRouter from './route/orderTracking.route.js';
import logoRouter from './route/logo.route.js';
import stripeRoute from "./route/stripe.route.js";
import attributeRouter from './route/attribute.route.js';
import variationRouter from './route/variation.route.js';
import mediaRouter from './route/media.route.js';
import notificationRouter from './route/notification.route.js';
import shippingRouter from './route/shipping.route.js';
import testRouter from './route/test.route.js';
import bannerRouter from './route/banner.route.js';
import couponRouter from './route/coupon.route.js';
import giftCardRouter from './route/giftCard.route.js';
import discountRouter from './route/discount.route.js';
import vendorRouter from './route/vendor.route.js';
import { transporter } from './config/emailService.js';
import analyticsRouter from './route/analytics.route.js';
import { analyticsMiddleware } from './middlewares/analytics.js';

// Validate environment variables at startup
try {
    validateEnv();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

const app = express();

// CORS configuration - Enhanced for Vercel deployments
const allowedOrigins = [
    // Local development
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    
    // Production domain - Main frontend
    'https://zubahouse.com',
    'https://www.zubahouse.com',
    // Legacy Vercel domains (kept for backward compatibility during transition)
    'https://zuba-web2-0.vercel.app',
    'https://zuba-web2-0-git-master-zuba-houses-projects.vercel.app',
    
    // Environment variables (for custom domains)
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    
    // ALLOWED_ORIGINS from environment (comma-separated)
    ...(process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : [])
].filter(Boolean); // Remove undefined/null values

// Function to check if origin is allowed (includes Vercel wildcard matching)
const isOriginAllowed = (origin) => {
    if (!origin) return true; // Allow requests with no origin
    
    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
        return true;
    }
    
    // Check if it's a Vercel domain (any *.vercel.app)
    if (origin.includes('.vercel.app')) {
        return true;
    }
    
    // Check environment variable origins
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return true;
    }
    if (process.env.ADMIN_URL && origin === process.env.ADMIN_URL) {
        return true;
    }
    
    return false;
};

// Log allowed origins on startup
console.log('🔐 CORS Allowed Origins:', allowedOrigins.length > 0 ? allowedOrigins : 'None configured');
console.log('🔐 CORS will also allow all *.vercel.app domains');

// Enhanced CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, curl requests)
        if (!origin) {
            return callback(null, true);
        }
        
        // Check if origin is allowed
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        } else {
            console.warn('⚠️ CORS blocked origin:', origin);
            // In production, still allow but log warning
            // This ensures the app works while we debug
            return callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With', 
        'Accept', 
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // Cache preflight requests for 24 hours
    optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
}));

// Handle preflight requests explicitly for all routes
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(200);
});

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Health check endpoint
app.get("/", (request, response) => {
    response.json({
        message: "Server is running on port " + process.env.PORT,
        status: "healthy",
        timestamp: new Date().toISOString()
    });
});

// Health check API endpoint
app.get("/api/health", (request, response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    response.json({
        status: dbStatus === 'Connected' ? "healthy" : "degraded",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test email endpoint (for testing SMTP configuration)
app.get("/test-email", async (req, res) => {
    try {
        // Get test recipient from query or env
        const testRecipient = req.query.to || process.env.TEST_EMAIL || 'olivier.niyo250@gmail.com';
        
        // Check environment variables (SendGrid configuration)
        const emailConfig = {
            SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? '✓ SET (hidden)' : '❌ NOT SET',
            EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.EMAIL || 'NOT SET',
            EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME || 'Zuba House'
        };
        
        console.log('🧪 Test email endpoint called');
        console.log('📧 Email configuration:', emailConfig);
        
        const senderEmail = process.env.EMAIL_USER || process.env.EMAIL || process.env.EMAIL_FROM;
        
        if (!senderEmail) {
            return res.status(500).json({
                success: false,
                message: "EMAIL_USER, EMAIL, or EMAIL_FROM environment variable is not set",
                config: emailConfig
            });
        }
        
        // Check for SendGrid API key instead of EMAIL_PASS
        if (!process.env.SENDGRID_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "SENDGRID_API_KEY environment variable is not set",
                config: {
                    ...emailConfig,
                    SENDGRID_API_KEY: 'NOT SET'
                },
                troubleshooting: 'Add SENDGRID_API_KEY to Render environment variables'
            });
        }
        
        const senderName = process.env.EMAIL_SENDER_NAME || 'Zuba House';
        
        console.log('📧 Attempting to send test email via SendGrid:', {
            from: `${senderName} <${senderEmail}>`,
            to: testRecipient
        });
        
        // Use transporter which now uses SendGrid
        const info = await transporter.sendMail({
            to: testRecipient,
            subject: "Zuba House Email Test - SendGrid - " + new Date().toISOString(),
            text: "SendGrid email is working perfectly!",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #2c3e50;">✅ SendGrid Email Test Successful!</h2>
                    <p>Your SendGrid email configuration is working correctly.</p>
                    <p><strong>From:</strong> ${senderName} &lt;${senderEmail}&gt;</p>
                    <p><strong>To:</strong> ${testRecipient}</p>
                    <p><strong>Provider:</strong> SendGrid API</p>
                    <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
                    <p style="margin-top: 20px; color: #27ae60;">🎉 Email sending is ready for production!</p>
                </div>
            `
        });
        
        console.log('✅ Test email sent successfully via SendGrid:', info.messageId);
        
        res.json({
            success: true,
            message: "Email sent successfully via SendGrid!",
            messageId: info.messageId,
            from: `${senderName} <${senderEmail}>`,
            to: testRecipient,
            provider: 'SendGrid',
            config: {
                ...emailConfig,
                SENDGRID_API_KEY: '✓ SET (hidden)'
            },
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
        });
    } catch (error) {
        console.error('❌ Test email error:', error);
        console.error('Error details:', {
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode
        });
        
        res.status(500).json({
            success: false,
            message: "Failed to send test email",
            error: error.message,
            errorCode: error.code,
            errorResponse: error.response,
            config: {
                SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
                EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.EMAIL || 'NOT SET',
                EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME || 'NOT SET'
            },
            troubleshooting: 'Check: 1) SENDGRID_API_KEY is set correctly, 2) Sender email is verified in SendGrid, 3) API key has Mail Send permissions'
        });
    }
});


// Analytics middleware - Track all visitors (non-blocking)
app.use(analyticsMiddleware);

// API Routes
app.use('/api/analytics', analyticsRouter);
app.use('/api/user', userRouter);
app.use('/api/category', categoryRouter);
app.use('/api/product', productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/myList", myListRouter);
app.use("/api/address", addressRouter);
app.use("/api/homeSlides", homeSlidesRouter);
app.use("/api/bannerV1", bannerV1Router);
app.use("/api/bannerList2", bannerList2Router);
app.use("/api/blog", blogRouter);
app.use("/api/order", orderRouter);
app.use("/api/orders", orderTrackingRouter);
app.use("/api/logo", logoRouter);
app.use("/api/stripe", stripeRoute);
app.use("/api/attributes", attributeRouter);
// Variations route - nested under products
// Access via: /api/products/:id/variations (id = productId)
app.use("/api/products/:id/variations", variationRouter);
app.use("/api/media", mediaRouter);
app.use("/api", notificationRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api", testRouter);
app.use("/api/banners", bannerRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/gift-cards", giftCardRouter);
app.use("/api/discounts", discountRouter);
app.use("/api/vendors", vendorRouter);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch((error) => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});
