import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './db/index.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());


import userRoutes from './routes/user.routes.js';
import otpRoutes from './routes/otp.routes.js';
app.use('/api/v1', userRoutes);
app.use('/api/v1', otpRoutes );


connectDB();


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
