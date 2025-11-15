/**
 * Global Error Handler Middleware
 * Handles all errors in a consistent format
 */

export const errorHandler = (err, req, res, next) => {
    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let error = true;
    let success = false;

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyPattern)[0];
        message = `${field} already exists`;
    }

    // Mongoose cast error (invalid ID format)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Log error for debugging (in production, use proper logging)
    if (statusCode === 500) {
        console.error('Server Error:', {
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            path: req.path,
            method: req.method,
        });
    }

    // Send error response
    res.status(statusCode).json({
        error,
        success,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        error: true,
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
    });
};


