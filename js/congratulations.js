document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get logged in user
        const user = await getLoggedInUserManual();
        if (!user) {
            console.error('No logged in user found');
            window.location.href = 'login.html';
            return;
        }

        // Get current quiz ID from localStorage
        const currentQuizId = parseInt(localStorage.getItem('quizId'));
        if (!currentQuizId) {
            console.error('No current quiz ID found');
            return;
        }

        // Get quiz by ID
        const db = await openDatabase();
        const transaction = db.transaction(['Quizzes'], 'readonly');
        const quizStore = transaction.objectStore('Quizzes');
        const request = quizStore.get(currentQuizId);

        request.onsuccess = () => {
            const quiz = request.result;
            if (!quiz) {
                console.error('Quiz not found');
                return;
            }

            // Display results
            document.getElementById('finalScore').textContent = quiz.score.toFixed(2);
            
            // Calculate number of correct answers
            const correctAnswers = Math.round((quiz.score / 10) * quiz.questions.length);
            document.getElementById('correctAnswers').textContent = 
                `${correctAnswers}/${quiz.questions.length}`;
            
            // Display time taken
            const minutes = Math.floor(quiz.timeSpent / 60);
            const seconds = quiz.timeSpent % 60;
            document.getElementById('timeTaken').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Add performance message
            let message = '';
            if (quiz.score >= 9) message = 'Excellent! 🎉';
            else if (quiz.score >= 7) message = 'Very good! 👏';
            else if (quiz.score >= 5) message = 'Pretty good! 👍';
            else message = 'Keep trying! 💪';

            document.querySelector('.score-display').insertAdjacentHTML('afterend', 
                `<div class="performance-message">${message}</div>`);

            // Start continuous confetti effect
            const confettiInterval = launchConfettiLoop();

            // Cleanup confetti when leaving page
            window.addEventListener('beforeunload', () => {
                clearInterval(confettiInterval);
            });
        };

        request.onerror = (event) => {
            console.error('Error fetching quiz:', event.target.error);
        };

    } catch (error) {
        console.error('Error:', error);
    }

    // Button handlers
    document.getElementById('returnHomeBtn').addEventListener('click', () => {
        window.location.href = 'home.html';
    });

    document.getElementById('viewAnswersBtn').addEventListener('click', () => {
        window.location.href = 'result.html';
    });
});

/*  Confetti effect- hiệu ứng pháo hoa giấy*/  
function launchConfettiLoop() {
    return setInterval(() => {
        confetti({
            particleCount: 15,
            angle: 70,
            spread: 55,
            origin: { x: 0, y: 0.5 }
        });

        confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });
    }, 1000); // Bắn mỗi giây
}
