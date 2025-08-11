const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const SeatMatrix = require('../models/SeatMatrix'); // Make sure this model exists
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    importAllSeatMatrix();
  })
  .catch(err => console.error('❌ Connection Error:', err));

async function importAllSeatMatrix() {
  try {
    const dataDir = path.join(__dirname, '../data');
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('seatmatrix') && f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      const roundNumber = parseInt(file.match(/\d+/)[0], 10); // extract round number

      const seatMatrixData = data.map(item => ({
        ...item,
        round: item.round || roundNumber,
        general: parseInt(item.general, 10) || 0,
        obc: parseInt(item.obc, 10) || 0,
        sc: parseInt(item.sc, 10) || 0,
        st: parseInt(item.st, 10) || 0,
        ews: parseInt(item.ews, 10) || 0,
      }));

      await SeatMatrix.insertMany(seatMatrixData);
      console.log(`✅ Imported ${file}`);
    }

    console.log('🎉 All seat matrix data imported');
    process.exit();
  } catch (err) {
    console.error('❌ Error importing:', err);
    process.exit(1);
  }
}
