import express from 'express';
import { verifyOtp,sendOtp } from '../controllers/otp.controller.js'; 

const router = express.Router();

router.post('/sendotp', sendOtp);
router.post('/verifyotp', verifyOtp);

export default router;