document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Display username
    document.getElementById('username').textContent = user.username;

    // Handle back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'home.html';
    });

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
}); 