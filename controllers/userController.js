import User from '../models/User.js';
import Store from '../models/Store.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../lib/mailhandler.js';

const registerUser = async (req, res) => {
    console.log('user is registering');
    const { name, email, password, storeName } = req.body;
    console.log('user data:', req.body);
    try {
        if (!name || !email || !password || !storeName) return res.status(400).json({message:'Please fill all fields'});
        if (password.length < 6) return res.status(400).json({message:'Password must be at least 6 characters'});
        const existingUser = await User.findOne({email});
        if (existingUser) return res.status(400).json({message:'User already exists'});
        // Create the store
        const store = await Store.create({ name: storeName });
        const username = name.replace(/\s+/g, '').toLowerCase();
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            store: store._id
        });
        store.owner = user._id;
        await store.save();
        const userWithoutPassword = await User.findById(user._id).select('-password').populate('store', 'name');
        res.status(201).json({user: userWithoutPassword, message: 'User registered successfully'});
    } catch (error) {
        console.error("Error while registering user:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const loginUser = async(req,res)=>{
    console.log('user is logging in');
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email})
        if (!user) return res.status(400).json({message: 'User not found'});
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({message: 'Invalid credentials'});
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const token = jwt.sign(
            {userId: user._id}, 
            process.env.JWT_SECRET, 
            {expiresIn: '30d'}
        );
        res.cookie("token", token, {
            httpOnly: true,
            secure: true, // true for HTTPS in production
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        const userWithoutPassword = await User.findById(user._id).select('-password');
        res.status(200).json({user: userWithoutPassword, message:"user successfully login"})
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({message: 'Server error', error: error.message});
    }
}

const getUserProfile = async(req,res)=>{
    try{
        const user = await User.findById(req.user.id).select('-password');
        if(user){
            res.json(user);
        }else{
            res.status(404).json
        }
    }
    catch(error){
        res.status(500).json({message:'Server error'});
    }

}

const logoutUser = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true, 
        sameSite: 'none',
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();
        // Construct reset link
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        await sendPasswordResetEmail(email, resetLink);
        res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const resetPassword = async (req, res) => {
    const { token, email, password } = req.body;
    if (!token || !email || !password) return res.status(400).json({ message: 'Token, email, and new password are required' });
    try {
        const user = await User.findOne({ email, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
        if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export { registerUser, loginUser, getUserProfile, logoutUser, forgotPassword, resetPassword };