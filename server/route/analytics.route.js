import { Router } from "express";
import auth from "../middlewares/auth.js";
import requireAdminEmail from "../middlewares/adminEmailCheck.js";
import {
    getDashboardStats,
    getVisitorsByCountry,
    getVisitorsByDevice,
    getTopPages,
    getTopReferrers,
    getVisitorsOverTime,
    getBrowserStats,
    getRealTimeVisitors,
    getProductViews,
    getSearchQueries
} from "../controllers/analytics.controller.js";
import { trackPageView } from "../middlewares/analytics.js";

const analyticsRouter = Router();

// ========================================
// PUBLIC ROUTES (for tracking)
// ========================================

// Track page view (called from client-side)
analyticsRouter.post('/track', trackPageView);

// ========================================
// PROTECTED ROUTES (Admin only - requires admin email)
// ========================================

// Dashboard overview
analyticsRouter.get('/dashboard', auth, requireAdminEmail, getDashboardStats);

// Visitors by country
analyticsRouter.get('/countries', auth, requireAdminEmail, getVisitorsByCountry);

// Visitors by device
analyticsRouter.get('/devices', auth, requireAdminEmail, getVisitorsByDevice);

// Top pages
analyticsRouter.get('/pages', auth, requireAdminEmail, getTopPages);

// Top referrers
analyticsRouter.get('/referrers', auth, requireAdminEmail, getTopReferrers);

// Visitors over time (for charts)
analyticsRouter.get('/timeline', auth, requireAdminEmail, getVisitorsOverTime);

// Browser stats
analyticsRouter.get('/browsers', auth, requireAdminEmail, getBrowserStats);

// Real-time visitors
analyticsRouter.get('/realtime', auth, requireAdminEmail, getRealTimeVisitors);

// Product views
analyticsRouter.get('/products', auth, requireAdminEmail, getProductViews);

// Search queries
analyticsRouter.get('/searches', auth, requireAdminEmail, getSearchQueries);

export default analyticsRouter;

