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

        request.userId = decode.id
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

export default auth