import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
export const protect = (req, res, next) => {
  try {
    console.log('Cookies:', req.cookies); // see all cookies
    const token = req.cookies.token;
    console.log('Token from cookie:', token);

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);

    req.user = {
      id: decoded.userId,
      role: decoded.role || 'user'
    };

    next();
  } catch (err) {
    console.error('Protect middleware error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
