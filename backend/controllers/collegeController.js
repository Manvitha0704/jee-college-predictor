const Round = require('../models/Round');

exports.predictCollege = async (req, res) => {
  const { rank, category, gender, round } = req.body;

  const genderOptions = gender.toLowerCase() === 'female'
    ? ['Female-Only', 'Gender-Neutral']
    : ['Gender-Neutral'];

  const roundFormatted = round.toLowerCase().includes('round') ? round : `Round ${round}`;

  try {
    const colleges = await Round.find({
      category: category.toUpperCase(),
      round: roundFormatted,
      gender: { $in: genderOptions },
      closingRank: { $gte: parseInt(rank) }
    }).limit(10);

    res.json({ colleges });
  } catch (err) {
    res.status(500).send({ message: 'Error fetching prediction' });
  }
};
