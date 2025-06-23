import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
    console.log('Auth Middleware - Request headers:', req.headers);
    console.log('Auth Middleware - Cookies:', req.cookies);
    const token = req.cookies.token;
    console.log('Auth Middleware - Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
        console.log('No token found in cookies');
        return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    try {
        console.log('Verifying token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully, userId:', decoded.userId);
        
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            console.log('User not found for token');
            return res.status(404).json({ error: "User not found" });
        }
        
        console.log('User found:', user.email);
        req.user = user;
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        res.status(401).json({ error: "Invalid token" });
    }
};