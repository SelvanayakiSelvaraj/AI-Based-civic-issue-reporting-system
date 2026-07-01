const mongoose = require('mongoose');

const complaintSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    status: { type: String, enum: ['Pending', 'Assigned', 'In Progress', 'Completed'], default: 'Pending' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    imageUrl: { type: String }, // Store local path or base64
    completionImageUrl: { type: String }, // Store completion proof
    audioUrl: { type: String },
    highRiskFlag: { type: Boolean, default: false } // Set by AI logic
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
