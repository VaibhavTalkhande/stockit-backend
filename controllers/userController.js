import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


const registerUser = async (req, res) => {
    console.log('user is registering');
    const {name,email,password,storeName} = req.body;
    console.log('user data:', req.body);
    console.log('user data:', name,email,password,storeName);
    try{
        console.log('user looking to register');
        if (!name || !email || !password || !storeName) return res.status(400).json({message:'Please fill all fields'});
        if (password.length < 6) return res.status(400).json({message:'Password must be at least 6 characters'});
        const existingUser = await User.findOne({email});
        if (existingUser) return res.status(400).json({message:'User already exists'});
        const username= name.replace(/\s+/g, '').toLowerCase();
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password:hashedPassword,
            storeName
        });
        console.log('user created:', user);
        const userWithoutPassword = await User.findById(user._id).select('-password');
        res.status(201).json({user: userWithoutPassword, message: 'User registered successfully'});
    }catch (error) {
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
            secure: false, // true for HTTPS in production
            sameSite: 'lax',
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

export {registerUser,loginUser,getUserProfile}