document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const entryInput = document.getElementById('entry-input');
  const addEntryBtn = document.getElementById('add-entry-btn');
  const entriesList = document.getElementById('entries');
  const spinBtn = document.getElementById('spin-btn');
  const resultPopup = document.getElementById('result-popup');
  const resultText = document.getElementById('result-text');
  const closePopupBtn = document.getElementById('close-popup');
  const canvas = document.getElementById('wheel');
  const ctx = canvas.getContext('2d');

  // Wheel properties
  let spinning = false;
  let currentRotation = 0;
  let targetRotation = 0;
  let spinStartTime = 0;
  let spinDuration = 0;

  // Colors for new entries
  const colors = [
    '#FF5252', '#4CAF50', '#2196F3', '#FFC107',
    '#9C27B0', '#FF9800', '#795548', '#607D8B',
    '#E91E63', '#009688', '#673AB7', '#FFEB3B'
  ];

  // Initialize the wheel
  drawWheel();

  // Event Listeners
  addEntryBtn.addEventListener('click', addEntry);
  spinBtn.addEventListener('click', spinWheel);
  closePopupBtn.addEventListener('click', closePopup);

  // Add delete buttons to existing entries
  addDeleteButtonsToEntries();

  // Functions
  function addEntry() {
    const entryText = entryInput.value.trim();
    if (entryText === '') return;

    const entries = getEntries();
    if (entries.length >= 12) {
      alert('Maximum 12 entries allowed!');
      return;
    }

    const color = colors[entries.length % colors.length];
    const li = document.createElement('li');
    li.textContent = entryText;
    li.dataset.color = color;
    li.style.backgroundColor = color;

    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', function() {
      li.remove();
      drawWheel();
    });

    li.appendChild(deleteBtn);
    entriesList.appendChild(li);

    // Clear input
    entryInput.value = '';

    // Redraw wheel
    drawWheel();
  }

  function addDeleteButtonsToEntries() {
    const items = entriesList.querySelectorAll('li');
    items.forEach(item => {
      if (!item.querySelector('.delete-btn')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', function() {
          item.remove();
          drawWheel();
        });
        item.appendChild(deleteBtn);
      }
    });
  }

  function getEntries() {
    return Array.from(entriesList.querySelectorAll('li')).map(li => ({
      text: li.textContent.replace('×', '').trim(),
      color: li.dataset.color
    }));
  }

  function drawWheel() {
    const entries = getEntries();
    if (entries.length === 0) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wheel segments
    const segmentAngle = (2 * Math.PI) / entries.length;

    for (let i = 0; i < entries.length; i++) {
      const startAngle = i * segmentAngle + currentRotation;
      const endAngle = (i + 1) * segmentAngle + currentRotation;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Fill segment
      ctx.fillStyle = entries[i].color;
      ctx.fill();

      // Draw segment border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(entries[i].text, radius - 20, 5);
      ctx.restore();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 10, centerY);
    ctx.lineTo(centerX + radius - 10, centerY - 15);
    ctx.lineTo(centerX + radius - 10, centerY + 15);
    ctx.closePath();
    ctx.fillStyle = '#f44336';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function spinWheel() {
    if (spinning) return;

    const entries = getEntries();
    if (entries.length < 2) {
      alert('Add at least 2 entries to spin the wheel!');
      return;
    }

    spinning = true;
    spinStartTime = Date.now();
    spinDuration = 3000 + Math.random() * 2000; // 3-5 seconds

    // Calculate target rotation (at least 5 full rotations + random position on the circle)
    const segmentAngle = (2 * Math.PI) / entries.length;
    const randomSegment = Math.floor(Math.random() * entries.length);
    // Use Math.random() to generate a random position within the segment
    // This allows the wheel to stop anywhere on the circle, not just at specific points
    const randomAngle = Math.random() * segmentAngle;
    targetRotation = currentRotation + (5 * 2 * Math.PI) + (randomSegment * segmentAngle) + randomAngle;

    // Start animation
    requestAnimationFrame(updateSpin);
  }

  function updateSpin() {
    const elapsed = Date.now() - spinStartTime;
    const progress = Math.min(elapsed / spinDuration, 1);

    // Easing function for smooth deceleration
    const easeOut = function(t) {
      return 1 - Math.pow(1 - t, 3);
    };

    // Calculate current rotation
    currentRotation = currentRotation + (targetRotation - currentRotation) * easeOut(progress);

    // Normalize rotation to keep it within reasonable bounds
    while (currentRotation > 2 * Math.PI) {
      currentRotation -= 2 * Math.PI;
    }

    // Redraw wheel
    drawWheel();

    if (progress < 1) {
      // Continue animation
      requestAnimationFrame(updateSpin);
    } else {
      // Animation complete
      spinning = false;

      // Determine winner
      const entries = getEntries();
      const segmentAngle = (2 * Math.PI) / entries.length;

      // The pointer is at 0 degrees (right side), so we need to find which segment is there
      // We need to account for the current rotation
      let winnerIndex = Math.floor(((2 * Math.PI) - (currentRotation % (2 * Math.PI))) / segmentAngle) % entries.length;

      // Show result
      showResult(entries[winnerIndex]);
    }
  }

  function showResult(winner) {
    resultText.textContent = winner.text;
    resultText.style.backgroundColor = winner.color;
    resultPopup.classList.remove('hidden');
  }

  function closePopup() {
    resultPopup.classList.add('hidden');
  }
});
