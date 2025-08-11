const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  bookingId: {
    type: String,
  
  },
  jobId: {
    type: String,
  
  },
  applicantId: {
    type: String,
 
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Application', applicationSchema);