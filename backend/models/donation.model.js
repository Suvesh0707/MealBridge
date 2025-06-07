import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  foodItems: { type: [String], required: true },
  phoneNumber: { type: String, required: true },
  description: { type: String },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'received', 'completed'], default: 'pending' },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: { type: String },
  foodPhoto: {
  type: String
}
 // new field to store address
}, {
  timestamps: true,
});

donationSchema.index({ location: '2dsphere' });

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
