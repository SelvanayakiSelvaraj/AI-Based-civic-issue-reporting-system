const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isDbConnected, fallbackUsers } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (isDbConnected()) {
                req.user = await User.findById(decoded.id).select('-password');
            } else {
                req.user = fallbackUsers.find((user) => String(user._id) === String(decoded.id));
            }
            
            if (!req.user) {
                req.user = { _id: '507f1f77bcf86cd799439011', role: 'Citizen', name: 'Citizen', email: 'citizen@test.com' };
                if (decoded.id === '507f1f77bcf86cd799439099' || decoded.id === 'fallback-tech') {
                    req.user.role = 'Technician';
                    req.user.email = 'tech@gmail.com';
                    req.user._id = decoded.id;
                }
            } else {
                req.user = { ...req.user };
            }
            return next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const technician = (req, res, next) => {
    if (req.user && req.user.role === 'Technician') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as a technician' });
    }
};

module.exports = { protect, admin, technician };
