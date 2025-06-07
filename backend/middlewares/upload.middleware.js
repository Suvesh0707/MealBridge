import multer from 'multer';
import { storage } from '../utilities/cloudinary.js';

const upload = multer({ storage });

export default upload;
