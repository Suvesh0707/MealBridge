import dotenv from 'dotenv';  
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const adminLogin = (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    return res.json({
      message: 'Admin logged in successfully',
      user: {
        name: 'Admin',
        email,
        role: 'admin',
      }
    });
  }

  return res.status(401).json({ message: 'Invalid admin credentials' });
};
