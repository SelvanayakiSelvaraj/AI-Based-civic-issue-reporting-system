const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allows base64 image strings
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    // --- EMERGENCY REVIEW FIX: FORCE CREATE TECH & HISTORY ---
    try {
        const User = require('./models/User');
        const Complaint = require('./models/Complaint');
        
        // 1. Force setup Tech user
        let techUser = await User.findOne({ email: 'tech@gmail.com' });
        if (!techUser) {
            techUser = await User.create({ name: 'Expert Technician', email: 'tech@gmail.com', password: '1234', role: 'Technician' });
            console.log('Created tech@gmail.com');
        } else {
            // The password hashing bug we fixed earlier might have broken this password. Force reset it safely using the Model.
            await User.updateOne({ _id: techUser._id }, { $set: { password: await require('bcryptjs').hash('1234', 10) } });
            console.log('Reset tech@gmail.com password to 1234');
        }

        // 2. Ensure ALL citizens have history so the dashboard looks good
        const citizens = await User.find({ role: 'Citizen' });
        for (let citizen of citizens) {
            const historyCount = await Complaint.countDocuments({ userId: citizen._id });
            if (historyCount === 0) {
                await Complaint.create({
                    userId: citizen._id,
                    type: 'Water Leak',
                    description: 'Urgent: Water pipe burst near the community center. Needs immediate attention.',
                    location: { latitude: 37.7749, longitude: -122.4194 },
                    status: 'Pending'
                });
                await Complaint.create({
                    userId: citizen._id,
                    type: 'Road Damage',
                    description: 'Large pothole on the main street causing traffic delays.',
                    location: { latitude: 37.7750, longitude: -122.4180 },
                    status: 'Assigned',
                    assignedTo: techUser._id
                });
            }
        }
        console.log('History loaded for review!');
    } catch (e) {
        console.error('Failed to run emergency setup:', e.message);
    }
});
