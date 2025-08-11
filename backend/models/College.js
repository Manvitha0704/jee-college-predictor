const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  institute: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  closing_rank: {
    type: Number,
    required: true,
  },
  round: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('College', collegeSchema);
