const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Round = require('../models/Round');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    importAllRounds();
  })
  .catch(err => console.error('❌ Connection Error:', err));

async function importAllRounds() {
  try {
    const dataDir = path.join(__dirname, '../data');
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('round') && f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      const roundNumber = parseInt(file.match(/\d+/)[0], 10); // extract number from filename like "round5.json"
const roundData = data.map(item => ({
  ...item,
  round: item.round || roundNumber,
  closing_rank: parseInt(item.closing_rank, 10)  // ensure it's a number
}));

      await Round.insertMany(roundData);
      console.log(`✅ Imported ${file}`);
    }

    console.log('🎉 All round data imported');
    process.exit();
  } catch (err) {
    console.error('❌ Error importing:', err);
    process.exit(1);
  }
}
