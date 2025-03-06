document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Check if user is already logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        window.location.href = 'home.html';
        return;
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simple validation
        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }

        // For demo purposes, we'll accept any username/password combination
        // Store user info in localStorage
        const userData = {
            username: username,
            isLoggedIn: true,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect to home page (since we're in the pages directory)
        window.location.href = 'home.html';
    });
}); 