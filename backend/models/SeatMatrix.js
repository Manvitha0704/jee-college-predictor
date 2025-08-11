const mongoose = require('mongoose');

const seatMatrixSchema = new mongoose.Schema({
  institute: String,
  branch: String,
  general: Number,
  obc: Number,
  sc: Number,
  st: Number,
  ews: Number,
  round: Number
}); // force collection name to 'seatmatrix'

module.exports = mongoose.model('SeatMatrix', seatMatrixSchema,'seatmatrixes');
