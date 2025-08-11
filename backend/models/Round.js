const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  institute: {
    type: String,
    required: true,
  },
  branch: {  // changed from academicProgramName
    type: String,
    required: true,
  },
  category: {  // replaced quota
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  closing_rank: {  // match your JSON exactly
    type: Number,
    required: true,
  },
  round: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model('Round', roundSchema);
