import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['user', 'ngo'], default: 'user' },
  profilePhoto: String,

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], 
    }
  },
  address: String,
},
{
  timestamps: true,
});
userSchema.index({ location: '2dsphere' });
const User = mongoose.model('User', userSchema);
export default User;