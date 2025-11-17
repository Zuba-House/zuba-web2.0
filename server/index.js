import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
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
import { transporter } from './config/emailService.js';

// Validate environment variables at startup
try {
    validateEnv();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

const app = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow all origins for easier testing
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // In production, only allow specified origins
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    response.json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Test email endpoint (for testing SMTP configuration)
app.get("/test-email", async (req, res) => {
    try {
        const senderEmail = process.env.EMAIL || 'orders@zubahouse.com';
        const senderName = process.env.EMAIL_SENDER_NAME || 'Zuba House';
        const fromAddress = `${senderName} <${senderEmail}>`;
        const testRecipient = process.env.TEST_EMAIL || 'olivier.niyo250@gmail.com';
        
        const info = await transporter.sendMail({
            from: fromAddress,
            to: testRecipient,
            subject: "Zuba House SMTP Test",
            text: "Hostinger SMTP is working perfectly!",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #2c3e50;">✅ SMTP Test Successful!</h2>
                    <p>Your Hostinger email configuration is working correctly.</p>
                    <p><strong>From:</strong> ${fromAddress}</p>
                    <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || 'smtp.hostinger.com'}</p>
                    <p><strong>Port:</strong> ${process.env.SMTP_PORT || '465'}</p>
                    <p style="margin-top: 20px; color: #27ae60;">🎉 Email sending is ready for production!</p>
                </div>
            `
        });
        
        res.json({
            success: true,
            message: "Email sent successfully!",
            messageId: info.messageId,
            from: fromAddress,
            to: testRecipient
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to send test email",
            error: error.message
        });
    }
});


// API Routes
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
app.use("/api/products/:id/variations", variationRouter);
app.use("/api/media", mediaRouter);
app.use("/api", notificationRouter);
app.use("/api/shipping", shippingRouter);

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
