import express from 'express';
import { getBusinessSuggestions } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect the route with authMiddleware
router.get('/suggestions', authMiddleware, getBusinessSuggestions);

export default router; 