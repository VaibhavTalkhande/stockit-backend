import express from "express";
import { registerUser,logoutUser,loginUser,getUserProfile,updateUserProfile,forgotPassword,resetPassword } from "../controllers/userController.js";
import jwt from "jsonwebtoken"
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router= express.Router();


router.post('/register',registerUser);

router.post('/login',loginUser);

router.get('/profile',getUserProfile);
router.post('update-profile',updateUserProfile);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, async(req,res)=>{
    try {

        const user = await User.findById(req.user._id).select('-password').populate('store', 'name');
        if (!user) return res.status(404).json({ error: "User not found" });
        res.status(200).json({ data: { user } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
})

export default router;