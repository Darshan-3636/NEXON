// Selectors
const sideMenu = document.querySelector('aside');
const menuBtn = document.getElementById('menu-btn');
const closeBtn = document.getElementById('close-btn');
const darkMode = document.querySelector('.dark-mode');

// Handle side menu open
menuBtn.addEventListener('click', () => {
    sideMenu.style.display = 'block';
});

// Handle side menu close
closeBtn.addEventListener('click', () => {
    sideMenu.style.display = 'none';
});

// Handle dark mode toggle
darkMode.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode-variables');
    darkMode.querySelector('span:nth-child(1)').classList.toggle('active');
    darkMode.querySelector('span:nth-child(2)').classList.toggle('active');

    // Save theme preference in localStorage
    const isDarkMode = document.body.classList.contains('dark-mode-variables');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

// Apply saved theme on page load
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode-variables');
    darkMode.querySelector('span:nth-child(1)').classList.add('active');
    darkMode.querySelector('span:nth-child(2)').classList.remove('active');
} else {
    document.body.classList.remove('dark-mode-variables');
    darkMode.querySelector('span:nth-child(1)').classList.remove('active');
    darkMode.querySelector('span:nth-child(2)').classList.add('active');
}


// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Select all flash messages
    var flashMessages = document.querySelectorAll('.flash-message');

    // Iterate through each flash message
    flashMessages.forEach(function(message) {
      // Set a timeout to remove the message after 5 seconds (5000 milliseconds)
      setTimeout(function() {
        message.style.display = 'none';
      }, 5000);
    });
  });





