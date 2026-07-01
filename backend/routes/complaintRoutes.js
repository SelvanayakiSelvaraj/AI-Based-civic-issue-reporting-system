const express = require('express');
const router = express.Router();
const { 
    createComplaint, 
    getMyComplaints, 
    getComplaints, 
    assignTechnician, 
    assignDefaultTechnician,
    getAssignedComplaints, 
    updateStatus,
    getAnalytics,
    getComplaintById
} = require('../controllers/complaintController');
const { protect, admin, technician } = require('../middlewares/authMiddleware');

// Citizen Routes
router.route('/').post(protect, createComplaint).get(protect, admin, getComplaints);
router.route('/analytics').get(protect, admin, getAnalytics);
router.route('/my').get(protect, getMyComplaints);

// Admin Routes
router.route('/assign-default').put(protect, admin, assignDefaultTechnician);
router.route('/:id/assign').put(protect, admin, assignTechnician);

// Technician Routes
router.route('/assigned').get(protect, technician, getAssignedComplaints);
router.route('/:id/status').put(protect, technician, updateStatus);

// Common Routes (Must be at the bottom to avoid catching specific routes like /my or /assigned)
router.route('/:id').get(protect, getComplaintById);

module.exports = router;
