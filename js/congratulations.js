document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get logged in user
        const user = await getLoggedInUserManual();
        if (!user) {
            console.error('No logged in user found');
            window.location.href = 'login.html';
            return;
        }

        // Get latest quiz for the user
        const db = await openDatabase();
        const transaction = db.transaction(['Quizzes'], 'readonly');
        const quizStore = transaction.objectStore('Quizzes');
        const index = quizStore.index('username');
        const request = index.getAll(user.username);

        request.onsuccess = () => {
            const quizzes = request.result;
            // Get the most recent submitted quiz
            const latestQuiz = quizzes
                .filter(quiz => quiz.isSubmit)
                .sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))[0];

            if (!latestQuiz) {
                console.error('No submitted quiz found');
                return;
            }

            // Display results
            document.getElementById('finalScore').textContent = latestQuiz.score.toFixed(2);
            
            // Calculate number of correct answers
            const correctAnswers = Math.round((latestQuiz.score / 10) * latestQuiz.questions.length);
            document.getElementById('correctAnswers').textContent = 
                `${correctAnswers}/${latestQuiz.questions.length}`;
            
            // Display time taken
            const minutes = Math.floor(latestQuiz.timeSpent / 60);
            const seconds = latestQuiz.timeSpent % 60;
            document.getElementById('timeTaken').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Add performance message
            let message = '';
            if (latestQuiz.score >= 9) message = 'Xuất sắc! 🎉';
            else if (latestQuiz.score >= 7) message = 'Rất tốt! 👏';
            else if (latestQuiz.score >= 5) message = 'Khá tốt! 👍';
            else message = 'Hãy cố gắng hơn! 💪';

            document.querySelector('.score-display').insertAdjacentHTML('afterend', 
                `<div class="performance-message">${message}</div>`);

            // Start confetti effect
            launchConfetti();
        };

        request.onerror = (event) => {
            console.error('Error fetching quiz data:', event.target.error);
        };

    } catch (error) {
        console.error('Error:', error);
    }

    // Button handlers
    document.getElementById('returnHomeBtn').addEventListener('click', () => {
        window.location.href = 'home.html';
    });

    document.getElementById('viewAnswersBtn').addEventListener('click', () => {
        alert('Tính năng xem lại đáp án sẽ được cập nhật trong thời gian tới!');
    });
});

// Confetti effect
function launchConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}
