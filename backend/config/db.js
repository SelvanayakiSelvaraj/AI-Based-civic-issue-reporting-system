const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');

let isDbConnected = false;
let fallbackUsers = [];
let fallbackComplaints = [];

const dataFile = path.join(__dirname, 'fallback_data.json');
if (fs.existsSync(dataFile)) {
    try {
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        fallbackUsers = data.users || [];
        fallbackComplaints = data.complaints || [];
    } catch (e) {
        console.error('Error reading fallback data:', e.message);
    }
}

const ensureFallbackSeed = () => {
    if (!fallbackUsers.some((user) => user.email === 'tech@gmail.com')) {
        fallbackUsers.push({
            _id: 'fallback-tech',
            name: 'Expert Technician',
            email: 'tech@gmail.com',
            password: '1234',
            role: 'Technician',
        });
    }
};
ensureFallbackSeed();

setInterval(() => {
    if (!isDbConnected) {
        try {
            fs.writeFileSync(dataFile, JSON.stringify({ users: fallbackUsers, complaints: fallbackComplaints }, null, 2));
        } catch (e) {
            console.error('Failed to save fallback data:', e.message);
        }
    }
}, 2000);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isDbConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        isDbConnected = false;
        console.warn(`MongoDB unavailable: ${error.message}`);
        console.warn('Starting backend in fallback mode without MongoDB.');
    }
};

connectDB();

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.isDbConnected = () => isDbConnected;
module.exports.fallbackUsers = fallbackUsers;
module.exports.fallbackComplaints = fallbackComplaints;
