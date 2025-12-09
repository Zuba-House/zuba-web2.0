import jwt from 'jsonwebtoken'

const auth = async(request, response, next) => {
    try {
        const token = request.cookies.accessToken || request?.headers?.authorization?.split(" ")[1];

        if(!token){
            return response.status(401).json({
                error: true,
                success: false,
                message: "Authentication token required"
            })
        }

        const decode = await jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);

        if(!decode){
            return response.status(401).json({
                error: true,
                success: false,
                message: "Invalid token"
            })
        }

        // Get user details to include role and vendorId
        const UserModel = (await import('../models/user.model.js')).default;
        const user = await UserModel.findById(decode.id).select('role vendorId');
        
        request.userId = decode.id;
        request.userRole = user?.role || 'USER';
        request.vendorId = user?.vendorId || null;
        next()

    } catch (error) {
        // Handle JWT specific errors
        if (error.name === 'JsonWebTokenError') {
            return response.status(401).json({
                error: true,
                success: false,
                message: "Invalid token"
            })
        }
        
        if (error.name === 'TokenExpiredError') {
            return response.status(401).json({
                error: true,
                success: false,
                message: "Token expired"
            })
        }

        // Other errors (server errors)
        return response.status(500).json({
            error: true,
            success: false,
            message: "Authentication failed"
        })
    }
}

// Optional auth - attaches user if token exists, but doesn't require it
export const optionalAuth = async (request, response, next) => {
    try {
        const token = request.cookies.accessToken || request?.headers?.authorization?.split(" ")[1];

        if (token) {
            try {
                const decode = await jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
                if (decode) {
                    request.userId = decode.id;
                }
            } catch (error) {
                // If token is invalid, just continue without user
                // Don't throw error for optional auth
            }
        }
        
        // Continue regardless of auth status
        next();
    } catch (error) {
        // If any error occurs, just continue without user
        next();
    }
}

export default auth