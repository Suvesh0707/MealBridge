import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'; 
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = '1d';

import axios from 'axios';

async function getAddressFromCoordinates(lat, lon) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon,
        format: 'json',
      },
      headers: {
        'User-Agent': 'YourAppName/1.0',
      },
    });
    return response.data.display_name || '';
  } catch (error) {
    console.error('Reverse geocoding failed:', error.message);
    return '';
  }
}

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, latitude, longitude } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    let address = '';
    if (latitude !== undefined && longitude !== undefined) {
      address = await getAddressFromCoordinates(latitude, longitude);
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      profilePhoto: req.file?.path || '',
      address,
      location: (latitude !== undefined && longitude !== undefined)
        ? {
            type: 'Point',
            coordinates: [longitude, latitude],
          }
        : undefined,
    });
    await user.save();

    res.status(201).json({ message: 'otp sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    // Send token explicitly for Expo clients
    res.json({
      message: `${user.role} logged in successfully`,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get all normal users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all ngos
export const getAllngos = async (req, res) => {
  try {
    const ngos = await User.find({ role: 'ngo' }).select('-password');
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


