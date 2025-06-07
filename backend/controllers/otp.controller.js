import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { sendVerificationEmail } from "../utilities/mailer.js";

const otpStorage = {};

export const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStorage[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // expires in 5 minutes
  };

  try {
    await sendVerificationEmail(email, otp);
    res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
};
 export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const storedOtpData = otpStorage[email];

  if (!storedOtpData || storedOtpData.otp !== parseInt(otp) || storedOtpData.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  try {
    // Mark user as verified
    await User.updateOne({ email }, { isVerified: true });

    // Remove OTP from storage
    delete otpStorage[email];

    res.status(200).json({ message: 'Email verified successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
