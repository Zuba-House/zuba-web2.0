import { VisitorModel, DailyStatsModel } from '../models/visitor.model.js';

// ========================================
// ANALYTICS CONTROLLER
// ========================================

// Simple in-memory cache (for production, use Redis)
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

const getCached = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    cache.delete(key);
    return null;
};

const setCached = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
    // Clean old cache entries (keep last 100)
    if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
};

// Helper: Get start of day
const getStartOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Helper: Get end of day
const getEndOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

// Helper: Get start of month
const getStartOfMonth = (date = new Date()) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

// ========================================
// GET DASHBOARD OVERVIEW
// ========================================
export const getDashboardStats = async (req, res) => {
    try {
        const today = getStartOfDay();
        const yesterday = getStartOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
        const thisMonth = getStartOfMonth();
        const lastMonth = getStartOfMonth(new Date(today.getFullYear(), today.getMonth() - 1, 1));
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        
        // Check cache first
        const cacheKey = `dashboard-${today.toISOString().split('T')[0]}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        
        // Optimized: Use $count instead of $addToSet for better performance
        const [todayStats, yesterdayStats, monthStats, lastMonthStats] = await Promise.all([
            VisitorModel.aggregate([
                { $match: { createdAt: { $gte: today }, isBot: false } },
                {
                    $group: {
                        _id: null,
                        totalVisits: { $sum: 1 },
                        uniqueVisitors: { $addToSet: '$visitorHash' },
                        newVisitors: { $sum: { $cond: ['$isNewVisitor', 1, 0] } }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalVisits: 1,
                        uniqueVisitors: { $size: '$uniqueVisitors' },
                        newVisitors: 1
                    }
                }
            ]),
            VisitorModel.aggregate([
                { $match: { createdAt: { $gte: yesterday, $lt: today }, isBot: false } },
                {
                    $group: {
                        _id: null,
                        totalVisits: { $sum: 1 },
                        uniqueVisitors: { $addToSet: '$visitorHash' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalVisits: 1,
                        uniqueVisitors: { $size: '$uniqueVisitors' }
                    }
                }
            ]),
            VisitorModel.aggregate([
                { $match: { createdAt: { $gte: thisMonth }, isBot: false } },
                {
                    $group: {
                        _id: null,
                        totalVisits: { $sum: 1 },
                        uniqueVisitors: { $addToSet: '$visitorHash' },
                        newVisitors: { $sum: { $cond: ['$isNewVisitor', 1, 0] } }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalVisits: 1,
                        uniqueVisitors: { $size: '$uniqueVisitors' },
                        newVisitors: 1
                    }
                }
            ]),
            VisitorModel.aggregate([
                { $match: { createdAt: { $gte: lastMonth, $lte: lastMonthEnd }, isBot: false } },
                {
                    $group: {
                        _id: null,
                        totalVisits: { $sum: 1 },
                        uniqueVisitors: { $addToSet: '$visitorHash' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalVisits: 1,
                        uniqueVisitors: { $size: '$uniqueVisitors' }
                    }
                }
            ])
        ]);
        
        // Calculate percentages
        const todayVisits = todayStats[0]?.totalVisits || 0;
        const todayUnique = todayStats[0]?.uniqueVisitors || 0;
        const yesterdayVisits = yesterdayStats[0]?.totalVisits || 0;
        const yesterdayUnique = yesterdayStats[0]?.uniqueVisitors || 0;
        
        const monthVisits = monthStats[0]?.totalVisits || 0;
        const monthUnique = monthStats[0]?.uniqueVisitors || 0;
        const lastMonthVisits = lastMonthStats[0]?.totalVisits || 0;
        const lastMonthUnique = lastMonthStats[0]?.uniqueVisitors || 0;
        
        // Calculate change percentages
        const dailyChange = yesterdayVisits > 0 
            ? Math.round(((todayVisits - yesterdayVisits) / yesterdayVisits) * 100) 
            : 100;
        const monthlyChange = lastMonthVisits > 0 
            ? Math.round(((monthVisits - lastMonthVisits) / lastMonthVisits) * 100) 
            : 100;
        
        const response = {
            success: true,
            data: {
                today: {
                    visits: todayVisits,
                    uniqueVisitors: todayUnique,
                    newVisitors: todayStats[0]?.newVisitors || 0,
                    changePercent: dailyChange
                },
                yesterday: {
                    visits: yesterdayVisits,
                    uniqueVisitors: yesterdayUnique
                },
                thisMonth: {
                    visits: monthVisits,
                    uniqueVisitors: monthUnique,
                    newVisitors: monthStats[0]?.newVisitors || 0,
                    changePercent: monthlyChange
                },
                lastMonth: {
                    visits: lastMonthVisits,
                    uniqueVisitors: lastMonthUnique
                }
            }
        };
        
        // Cache the response
        setCached(cacheKey, response);
        
        return res.json(response);
        
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return res.status(500).json({ error: true, message: error.message });
    }
};

// ========================================
// GET VISITORS BY COUNTRY
// ========================================
export const getVisitorsByCountry = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'today':
                startDate = getStartOfDay();
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        
        // Check cache
        const cacheKey = `countries-${period}-${startDate.toISOString().split('T')[0]}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        
        const countryStats = await VisitorModel.aggregate([
            { $match: { createdAt: { $gte: startDate }, isBot: false } },
            {
                $group: {
                    _id: { country: '$country', countryCode: '$countryCode' },
                    visits: { $sum: 1 },
                    uniqueVisitors: { $addToSet: '$visitorHash' }
                }
            },
            {
                $project: {
                    _id: 0,
                    country: '$_id.country',
                    countryCode: '$_id.countryCode',
                    visits: 1,
                    uniqueVisitors: { $size: '$uniqueVisitors' }
                }
            },
            { $sort: { visits: -1 } },
            { $limit: 20 }
        ]);
        
        // Calculate total for percentages
        const total = countryStats.reduce((sum, c) => sum + c.visits, 0);
        
        const data = countryStats.map(c => ({
            ...c,
            percentage: total > 0 ? Math.round((c.visits / total) * 100) : 0
        }));
        
        const response = {
            success: true,
            period,
            total,
            data
        };
        
        // Cache the response
        setCached(cacheKey, response);
        
        return res.json(response);
        
    } catch (error) {
        console.error('Country stats error:', error);
        return res.status(500).json({ error: true, message: error.message });
    }
};

// ========================================
// GET VISITORS BY DEVICE
// ========================================
export const getVisitorsByDevice = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'today':
                startDate = getStartOfDay();
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        
        // Check cache
        const cacheKey = `devices-${period}-${startDate.toISOString().split('T')[0]}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        
        const deviceStats = await VisitorModel.aggregate([
            { $match: { createdAt: { $gte: startDate }, isBot: false } },
            {
                $group: {
                    _id: '$device',
                    visits: { $sum: 1 },
                    uniqueVisitors: { $addToSet: '$visitorHash' }
                }
            },
            {
                $project: {
                    _id: 0,
                    device: '$_id',
                    visits: 1,
                    uniqueVisitors: { $size: '$uniqueVisitors' }
                }
            },
            { $sort: { visits: -1 } }
        ]);
        
        const total = deviceStats.reduce((sum, d) => sum + d.visits, 0);
        
        const data = deviceStats.map(d => ({
            ...d,
            percentage: total > 0 ? Math.round((d.visits / total) * 100) : 0
        }));
        
        const response = {
            success: true,
            period,
            total,
            data
        };
        
        // Cache the response
        setCached(cacheKey, response);
        
        return res.json(response);
        
    } catch (error) {
        console.error('Device stats error:', error);
        return res.status(500).json({ error: true, message: error.message });
    }
};

// ========================================
// GET TOP PAGES
// ========================================
export const getTopPages = async (req, res) => {
    try {
        const { period = '30d', limit = 10 } = req.query;
        
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'today':
                startDate = getStartOfDay();
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        
        // Check cache
        const cacheKey = `pages-${period}-${limit}-${startDate.toISOString().split('T')[0]}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        
        const pageStats = await VisitorModel.aggregate([
            { $match: { createdAt: { $gte: startDate }, isBot: false } },
            {
                $group: {
                    _id: '$page',
                    visits: { $sum: 1 },
                    uniqueVisitors: { $addToSet: '$visitorHash' }
                }
            },
            {
                $project: {
                    _id: 0,
                    page: '$_id',
                    visits: 1,
                    uniqueVisitors: { $size: '$uniqueVisitors' }
                }
            },
            { $sort: { visits: -1 } },
            { $limit: parseInt(limit) }
        ]);
        
        const response = {
            success: true,
            period,
            data: pageStats
        };
        
        // Cache the response
        setCached(cacheKey, response);
        
        return res.json(response);
        
    } catch (error) {
        console.error('Top pages error:', error);
        return res.status(500).json({ error: true, message: error.message });
    }
};

// ========================================
// GET TOP REFERRERS
// ========================================
export const getTopReferrers = async (req, res) => {
    try {
        const { period = '30d', limit = 10 } = req.query;
        
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'today':
                startDate = getStartOfDay();
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        
        // Check cache
        const cacheKey = `referrers-${period}-${limit}-${startDate.toISOString().split('T')[0]}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        
        const referrerStats = await VisitorModel.aggregate([
            { $match: { createdAt: { $gte: startDate }, isBot: false } },
            {
                $group: {
                    _id: '$referrerDomain',
                    visits: { $sum: 1 },
                    uniqueVisitors: { $addToSet: '$visitorHash' }
                }
            },
            {
                $project: {
                    _id: 0,
                    referrer: '$_id',
                    visits: 1,
                    uniqueVisitors: { $size: '$uniqueVisitors' }
                }
            },
            { $sort: { visits: -1 } },
            { $limit: parseInt(limit) }
        ]);
        
        const total = referrerStats.reduce((sum, r) => sum + r.visits, 0);
        
        const data = referrerStats.map(r => ({
            ...r,
            percentage: total > 0 ? Math.round((r.visits / total) * 100) : 0
        }));
        
        const response = {
            success: true,
            period,
            total,
            data
        };
        
        // Cache the response
        setCached(cacheKey, response);
        
        return res.json(response);
        
    } catch (error) {
        console.error('Referrer stats error:', error);
        return res.status(500).json({ error: true, message: error.message });
    }
};

// ========================================
// GET VISITORS OVER TIME (For Charts)
// ========================================
export const getVisitorsOverTime = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        let startDate;
        let groupBy;
        
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
                break;
            case '90d':
                startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
                break;
            case '12m':
                startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
                break;
            case 'today':
                startDate = getStartOfDay();
                groupBy = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        }
        
        // Check cache
        const cacheKey = `timeline-${period}-${startDate.toISOString().split('T')[0]}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        
        const timeStats = await VisitorModel.aggregate([
            { $match: { createdAt: { $gte: startDate }, isBot: false } },
            {
                $group: {
                    _id: groupBy,
                    visits: { $sum: 1 },
                    uniqueVisitors: { $addToSet: '$visitorHash' },
                    newVisitors: { $sum: { $cond: ['$isNewVisitor', 1, 0] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    visits: 1,
                    uniqueVisitors: { $size: '$uniqueVisitors' },
                    newVisitors: 1
                }
            },
            { $sort: { date: 1 } }
        ]);
        
        const response = {
            success: true,
            period,
            data: timeStats
        };
        
        // Cache the response
        setCached(cacheKey, response);
        
        return res.json(response);
        
    } catch (error) {
        console.error('Time stats error:', error);
        return res.status(500).json({ error: true, message: error.message });
    }
};

// ========================================
// GET BROWSER STATS
// ========================================
export const getBrowserStats = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        
        // Check cache
        const cacheKey = `browsers-${period}-${startDate.toISOString().split('T')[0]}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        
        const browserStats = await VisitorModel.aggregate([
            { $match: { createdAt: { $gte: startDate }, isBot: false } },
            {
                $group: {
                    _id: '$browser',
                    visits: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    browser: '$_id',
                    visits: 1
                }
            },
            { $sort: { visits: -1 } },
            { $limit: 10 }
        ]);
        
        const total = browserStats.reduce((sum, b) => sum + b.visits, 0);
        
        const data = browserStats.map(b => ({
            ...b,
            percentage: total > 0 ? Math.round((b.visits / total) * 100) : 0
        }));
        
        const response = {
            success: true,
            period,
            total,
            data
        };
        
        // Cache the response
        setCached(cacheKey, response);
        
        return res.json(response);
        
    } catch (error) {
        console.error('Browser stats error:', error);
        return res.status(500).json({ error: true, message: error.message });
    }
};

// ========================================
// GET REAL-TIME VISITORS (Last 2 minutes - actual active users)
// ========================================
export const getRealTimeVisitors = async (req, res) => {
    try {
        // Use 2 minutes for "active now" - more accurate than 5 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        
        // Get unique active visitors (by visitorHash, not sessionId)
        // This gives real people, not sessions
        const [activeVisitorsData, pageViewsData, recentPages] = await Promise.all([
            VisitorModel.aggregate([
                { $match: { createdAt: { $gte: twoMinutesAgo }, isBot: false } },
                {
                    $group: {
                        _id: '$visitorHash',
                        lastActivity: { $max: '$createdAt' }
                    }
                },
                {
                    $count: 'activeVisitors'
                }
            ]),
            VisitorModel.countDocuments({
                createdAt: { $gte: twoMinutesAgo },
                isBot: false
            }),
            VisitorModel.find({
                createdAt: { $gte: twoMinutesAgo },
                isBot: false
            })
            .select('page country device createdAt visitorHash')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
        ]);
        
        const activeVisitors = activeVisitorsData[0]?.activeVisitors || 0;
        
        return res.json({
            success: true,
            data: {
                activeVisitors, // Real unique people online
                pageViews: pageViewsData || 0,
                recentActivity: recentPages
            }
        });
        
    } catch (error) {
        console.error('Real-time stats error:', error);
        return res.status(500).json({ error: true, message: error.message });
    }
};

// ========================================
// GET PRODUCT VIEWS
// ========================================
export const getProductViews = async (req, res) => {
    try {
        const { period = '30d', limit = 10 } = req.query;
        
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        
        const productStats = await VisitorModel.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: startDate }, 
                    isBot: false,
                    productId: { $ne: null }
                } 
            },
            {
                $group: {
                    _id: '$productId',
                    views: { $sum: 1 },
                    uniqueViewers: { $addToSet: '$visitorHash' }
                }
            },
            {
                $project: {
                    _id: 0,
                    productId: '$_id',
                    views: 1,
                    uniqueViewers: { $size: '$uniqueViewers' }
                }
            },
            { $sort: { views: -1 } },
            { $limit: parseInt(limit) }
        ]);
        
        return res.json({
            success: true,
            period,
            data: productStats
        });
        
    } catch (error) {
        console.error('Product views error:', error);
        return res.status(500).json({ error: true, message: error.message });
    }
};

// ========================================
// GET SEARCH QUERIES
// ========================================
export const getSearchQueries = async (req, res) => {
    try {
        const { period = '30d', limit = 20 } = req.query;
        
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        
        const searchStats = await VisitorModel.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: startDate }, 
                    isBot: false,
                    searchQuery: { $ne: null }
                } 
            },
            {
                $group: {
                    _id: { $toLower: '$searchQuery' },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    query: '$_id',
                    count: 1
                }
            },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) }
        ]);
        
        return res.json({
            success: true,
            period,
            data: searchStats
        });
        
    } catch (error) {
        console.error('Search queries error:', error);
        return res.status(500).json({ error: true, message: error.message });
    }
};

