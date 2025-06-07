import Donation from '../models/donation.model.js';
import User from '../models/user.model.js';
import axios from 'axios';

async function getAddressFromCoordinates(latitude, longitude) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
      },
      headers: {
        'User-Agent': 'YourAppName/1.0',
      },
    });
    return response.data.display_name || '';
  } catch (error) {
    console.error('Failed to get address from coordinates:', error.message);
    return ''; // fallback to empty string
  }
}

export const createDonation = async (req, res) => {
  try {
    const {
      donorName,
      foodItems,
      phoneNumber,
      description,
      latitude,
      longitude,
    } = req.body;

    const ngoId = req.params.ngoId;
    const userId = req.user.id;

    if (!ngoId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'NGO ID and location (latitude, longitude) are required' });
    }

    const address = await getAddressFromCoordinates(latitude, longitude);

    const foodPhotoUrl = req.file?.path || null; // Cloudinary image URL

    const donation = new Donation({
      donorName,
      foodItems,
      phoneNumber,
      description,
      ngo: ngoId,
      user: userId,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      address,
      foodPhoto: foodPhotoUrl, // Save Cloudinary URL
    });

    await donation.save();

    res.status(201).json({
      message: 'Donation request sent successfully',
      donation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const autoAssignDonation = async (req, res) => {
  console.log('autoAssignDonation called');
  console.log('req.user:', req.user);
  console.log('req.body:', req.body);
  console.log('req.file:', req.file); // Uploaded photo

  try {
    const { donorName, foodItems, phoneNumber, description, latitude, longitude } = req.body;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Step 1: Find nearest NGO within 20km
    const nearestNgo = await User.findOne({
      role: 'ngo',
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: 20000, // 20 km
        },
      },
    });

    if (!nearestNgo) {
      return res.status(404).json({ message: 'No NGO found within 20km' });
    }

    // Step 2: Create donation
    const donation = new Donation({
      donorName,
      foodItems: Array.isArray(foodItems) ? foodItems : foodItems.split(','),
      phoneNumber,
      description,
      ngo: nearestNgo._id,
      user: userId,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      foodPhoto: req.file?.path || null, // Cloudinary URL via multer
    });

    await donation.save();

    res.status(201).json({
      message: 'Donation request sent successfully to nearest NGO',
      ngo: {
        id: nearestNgo._id,
        name: nearestNgo.name,
        email: nearestNgo.email,
      },
      donation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// NGO fetches all donation requests to them
export const getDonationsForNgo = async (req, res) => {
  try {
    const ngoId = req.user.id;

    if (req.user.role !== 'ngo') {
      return res.status(403).json({ message: 'Access denied: only NGO can view requests' });
    }

    const donations = await Donation.find({ ngo: ngoId })
      .populate('user', 'name email') 
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateDonationStatus = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { status } = req.body;

    if (!['received', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (req.user.role !== 'ngo') {
      return res.status(403).json({ message: 'Access denied: only NGO can update status' });
    }

    const donation = await Donation.findOneAndUpdate(
      { _id: donationId, ngo: req.user.id, status: 'pending' },
      { status },
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ message: 'Donation request not found or already processed' });
    }

    res.json({ message: `Donation status updated to ${status}`, donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
