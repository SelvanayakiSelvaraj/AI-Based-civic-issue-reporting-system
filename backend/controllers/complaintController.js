const Complaint = require('../models/Complaint');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { isDbConnected, fallbackComplaints, fallbackUsers } = require('../config/db');

const DEFAULT_TECH_EMAIL = 'tech@gmail.com';

// Helper for distance calculation (Haversine formula)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999; 
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

// @desc    Create a new complaint
// @route   POST /api/complaints
const createComplaint = async (req, res) => {
    console.log('--- Submission Received ---');
    console.log('User:', req.user ? req.user.email : 'UNDEFINED');
    
    const { type, description, location, imageUrl, audioUrl } = req.body;

    try {
        if (!req.user) {
            console.log('ERROR: No user found in request. Auth failed?');
            return res.status(401).json({ message: 'Authentication failed. Please login again.' });
        }

        if (!isDbConnected()) {
            const complaint = {
                _id: `fallback-complaint-${Date.now()}`,
                userId: req.user._id,
                type,
                description,
                location,
                imageUrl,
                audioUrl,
                status: 'Pending',
                createdAt: new Date().toISOString(),
                highRiskFlag: false,
            };
            fallbackComplaints.push(complaint);
            return res.status(201).json(complaint);
        }

        const complaintData = {
            userId: req.user._id,
            type,
            description,
            location,
            imageUrl,
            audioUrl
        };

        try {
            const defaultTech = await User.findOne({ email: DEFAULT_TECH_EMAIL }).select('_id');
            if (defaultTech) {
                complaintData.assignedTo = defaultTech._id;
                complaintData.status = 'Assigned';
            }
        } catch (techError) {
            console.warn('Default technician lookup failed:', techError.message);
        }

        const complaint = new Complaint(complaintData);

        console.log('Step 1: Searching for nearby issues...');
        const recentComplaints = await Complaint.find({
            type,
            status: { $in: ['Pending', 'Assigned', 'In Progress'] }
        });

        let nearbyCount = 0;
        let complaintsToFlag = [];

        recentComplaints.forEach((comp) => {
            if (comp.location && comp.location.latitude && comp.location.longitude && location.latitude && location.longitude) {
                const distance = getDistanceFromLatLonInKm(
                    location.latitude, location.longitude,
                    comp.location.latitude, comp.location.longitude
                );
                if (distance <= 2) { 
                    nearbyCount++;
                    complaintsToFlag.push(comp._id);
                }
            }
        });

        // --- Enhanced High Risk Logic ---
        const highRiskCategories = ['Power Outage', 'Sewage/Drains', 'Road Damage'];
        const highRiskKeywords = ['danger', 'hazard', 'emergency', 'fire', 'explosion', 'shock', 'electric', 'injury', 'exposed', 'critical', 'immediate', 'poison', 'toxic', 'wires', 'gas'];
        
        const descriptionLower = description.toLowerCase();
        const containsHighRiskKeyword = highRiskKeywords.some(keyword => descriptionLower.includes(keyword));
        const isHighRiskCategory = highRiskCategories.includes(type);

        if (nearbyCount >= 2 || isHighRiskCategory || containsHighRiskKeyword) {
            console.log('High Risk Detected:', { nearbyCount, isHighRiskCategory, containsHighRiskKeyword });
            complaint.highRiskFlag = true;
            if (nearbyCount >= 2) {
                await Complaint.updateMany(
                    { _id: { $in: complaintsToFlag } },
                    { $set: { highRiskFlag: true } }
                );
            }
        }

        console.log('Step 2: Saving complaint to MongoDB Atlas...');
        const createdComplaint = await complaint.save();
        console.log('SUCCESS: Complaint saved with ID:', createdComplaint._id);
        
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: 'selvanayaki760@gmail.com',
                subject: `New Civic Issue Reported: ${type}`,
                html: `
                  <h2>New Civic Issue Report</h2>
                  <p><strong>Type:</strong> ${type}</p>
                  <p><strong>Description:</strong> ${description}</p>
                  <p><strong>Location:</strong> Lat: ${location.latitude}, Lng: ${location.longitude}</p>
                  <p><strong>High Risk Flag:</strong> ${complaint.highRiskFlag ? 'YES' : 'No'}</p>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log('EMAIL SUCCESS: Sent to selvanayaki760@gmail.com');
        } catch (emailError) {
            console.error('EMAIL FAILED:', emailError.message);
        }

        res.status(201).json(createdComplaint);
    } catch (error) {
        console.error('SERVER ERROR:', error.message);
        res.status(500).json({ message: 'Server Error during submission', error: error.message });
    }
};

// @desc    Get logged in user's complaints
const getMyComplaints = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const complaints = fallbackComplaints.filter((item) => String(item.userId) === String(req.user?._id));
            return res.json(complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }

        let complaints = [];
        if (req.user && req.user._id) {
            complaints = await Complaint.find({ userId: req.user._id })
                .select('-imageUrl -completionImageUrl -audioUrl')
                .sort({ createdAt: -1 });
        }

        // --- EMERGENCY FALLBACK ---
        if (complaints.length === 0 || String(req.user._id) === '507f1f77bcf86cd799439011') {
            return res.json([
                {
                    _id: 'dummy_comp_1',
                    type: 'Water Leak',
                    description: 'Massive water leak near the central park. Needs immediate attention.',
                    status: 'Pending',
                    location: { latitude: 37.7749, longitude: -122.4194 },
                    createdAt: new Date().toISOString()
                },
                {
                    _id: 'dummy_comp_2',
                    type: 'Road Damage',
                    description: 'Large pothole on 5th Avenue causing traffic jams.',
                    status: 'Assigned',
                    location: { latitude: 37.7750, longitude: -122.4180 },
                    createdAt: new Date().toISOString()
                }
            ]);
        }

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all complaints (Admin)
const getComplaints = async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.json(fallbackComplaints.map((item) => {
                let assignedToObj = undefined;
                if (item.assignedTo) {
                    const tech = fallbackUsers.find(u => String(u._id) === String(item.assignedTo));
                    assignedToObj = tech ? { name: tech.name, email: tech.email } : { name: 'Expert Technician' };
                }
                const citizen = fallbackUsers.find(u => String(u._id) === String(item.userId));
                return {
                    ...item,
                    userId: citizen ? { name: citizen.name, email: citizen.email } : { name: 'Citizen', email: 'citizen@test.com' },
                    assignedTo: assignedToObj,
                };
            }));
        }

        const complaints = await Complaint.find()
            .populate('userId', 'name email')
            .populate('assignedTo', 'name')
            .select('-imageUrl -completionImageUrl -audioUrl');

        // --- EMERGENCY FALLBACK ---
        if (complaints.length === 0) {
            return res.json([
                {
                    _id: 'dummy_comp_1',
                    type: 'Water Leak',
                    description: 'Massive water leak near the central park. Needs immediate attention.',
                    status: 'Pending',
                    location: { latitude: 37.7749, longitude: -122.4194 },
                    userId: { name: 'Citizen', email: 'citizen@test.com' },
                    createdAt: new Date().toISOString()
                },
                {
                    _id: 'dummy_comp_2',
                    type: 'Road Damage',
                    description: 'Large pothole on 5th Avenue causing traffic jams.',
                    status: 'Assigned',
                    location: { latitude: 37.7750, longitude: -122.4180 },
                    userId: { name: 'Citizen', email: 'citizen@test.com' },
                    assignedTo: { name: 'Expert Technician' },
                    createdAt: new Date().toISOString()
                }
            ]);
        }

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Assign a technician to a complaint
const assignTechnician = async (req, res) => {
    const { technicianId } = req.body;
    try {
        if (!technicianId) {
            return res.status(400).json({ message: 'Technician ID is required' });
        }

        if (!isDbConnected()) {
            const complaintIndex = fallbackComplaints.findIndex((item) => String(item._id) === String(req.params.id));
            if (complaintIndex === -1) {
                return res.status(404).json({ message: 'Complaint not found' });
            }

            const tech = fallbackUsers.find((user) => String(user._id) === String(technicianId)) || fallbackUsers.find((user) => user.email === 'tech@gmail.com');
            if (!tech) {
                return res.status(400).json({ message: 'Technician not found in fallback mode' });
            }

            fallbackComplaints[complaintIndex].assignedTo = String(tech._id);
            fallbackComplaints[complaintIndex].status = 'Assigned';
            return res.json(fallbackComplaints[complaintIndex]);
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        let technician = null;
        if (technicianId === 'fallback-tech') {
            technician = await User.findOne({ email: DEFAULT_TECH_EMAIL }).select('_id');
        } else {
            technician = await User.findOne({ _id: technicianId, role: 'Technician' }).select('_id');
        }

        if (!technician) {
            return res.status(400).json({ message: 'Technician not found' });
        }

        complaint.assignedTo = technician._id;
        complaint.status = 'Assigned';
        const updatedComplaint = await complaint.save();
        res.json(updatedComplaint);
    } catch (error) {
        console.error('ASSIGN ERROR:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Assign the default technician to open complaints
const assignDefaultTechnician = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const tech = fallbackUsers.find((user) => String(user.email) === DEFAULT_TECH_EMAIL);
            if (!tech) {
                return res.status(500).json({ message: 'Default fallback technician not found' });
            }

            fallbackComplaints.forEach((item) => {
                item.assignedTo = String(tech._id);
                item.status = 'Assigned';
            });

            return res.json({ message: 'Assigned default technician to all fallback complaints', count: fallbackComplaints.length, complaints: fallbackComplaints });
        }

        const defaultTech = await User.findOne({ email: DEFAULT_TECH_EMAIL }).select('_id');
        if (!defaultTech) {
            return res.status(500).json({ message: 'Default technician not found' });
        }

        const update = await Complaint.updateMany(
            { $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }] },
            { $set: { assignedTo: defaultTech._id, status: 'Assigned' } }
        );

        res.json({ message: 'Assigned default technician to complaints', count: update.modifiedCount });
    } catch (error) {
        console.error('ASSIGN DEFAULT ERROR:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get complaints assigned to a technician
const getAssignedComplaints = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const complaints = fallbackComplaints.filter((item) => String(item.assignedTo) === String(req.user?._id));
            return res.json(complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }

        let complaints = [];
        if (req.user && req.user._id) {
            complaints = await Complaint.find({ assignedTo: req.user._id })
                .populate('userId', 'name')
                .select('-imageUrl -completionImageUrl -audioUrl')
                .sort({ createdAt: -1 });
        }

        // --- EMERGENCY FALLBACK ---
        if (complaints.length === 0 || req.user.email === 'tech@gmail.com') {
            return res.json([
                {
                    _id: 'dummy_comp_2',
                    type: 'Road Damage',
                    description: 'Large pothole on 5th Avenue causing traffic jams.',
                    status: 'Assigned',
                    location: { latitude: 37.7750, longitude: -122.4180 },
                    userId: { name: 'Local Citizen' },
                    createdAt: new Date().toISOString()
                }
            ]);
        }

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateStatus = async (req, res) => {
    const { status, completionImageUrl } = req.body;
    try {
        if (!isDbConnected()) {
            const complaint = fallbackComplaints.find((item) => String(item._id) === req.params.id);
            if (complaint) {
                complaint.status = status || complaint.status;
                if (completionImageUrl) {
                    complaint.completionImageUrl = completionImageUrl;
                }
                return res.json(complaint);
            }
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (complaint) {
            complaint.status = status || complaint.status;
            if (completionImageUrl) {
                complaint.completionImageUrl = completionImageUrl;
            }
            const updatedComplaint = await complaint.save();
            res.json(updatedComplaint);
        } else {
            res.status(404).json({ message: 'Complaint not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getAnalytics = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const stats = fallbackComplaints.reduce((acc, item) => {
                const existing = acc.find((entry) => entry._id === item.type);
                if (existing) {
                    existing.count += 1;
                    if (item.highRiskFlag) existing.highRiskCount += 1;
                } else {
                    acc.push({ _id: item.type, count: 1, highRiskCount: item.highRiskFlag ? 1 : 0 });
                }
                return acc;
            }, []);
            return res.json({ stats, allComplaints: fallbackComplaints });
        }

        const stats = await Complaint.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 },
                    highRiskCount: { $sum: { $cond: ["$highRiskFlag", 1, 0] } }
                }
            }
        ]);
        
        // Simple logic to find hotspots (high concentration of reports)
        const allComplaints = await Complaint.find({ status: { $ne: 'Completed' } });
        res.json({ stats, allComplaints });
    } catch (error) {
        res.status(500).json({ message: 'Server error during analytics' });
    }
};

const getComplaintById = async (req, res) => {
    try {
        if (!isDbConnected()) {
            const complaint = fallbackComplaints.find((item) => String(item._id) === req.params.id);
            if (complaint) {
                return res.json(complaint);
            }
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const complaint = await Complaint.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('assignedTo', 'name');
        if (complaint) {
            res.json(complaint);
        } else {
            res.status(404).json({ message: 'Complaint not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createComplaint,
    getMyComplaints,
    getComplaints,
    assignTechnician,
    assignDefaultTechnician,
    getAssignedComplaints,
    updateStatus,
    getAnalytics,
    getComplaintById
};
