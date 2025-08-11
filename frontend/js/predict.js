document.getElementById('predictForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const rank = document.getElementById('rank').value;
  const category = document.getElementById('category').value;
  const round = document.getElementById('round').value;
  const gender = document.getElementById('gender').value;

  const resultsDiv = document.getElementById('results');
  const loader = document.getElementById('loader');

  resultsDiv.innerHTML = '';
  loader.style.display = 'block';

  try {
    const response = await fetch('/api/college/predict', {  // ✅ Fixed route
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rank, category, round, gender })
    });

    const data = await response.json();
    loader.style.display = 'none';
    displayResults(data.colleges);
  } catch (error) {
    console.error('Fetch error:', error);
    loader.style.display = 'none';
    resultsDiv.innerHTML = '<p class="text-danger">Error fetching data. Please try again later.</p>';
  }
});
