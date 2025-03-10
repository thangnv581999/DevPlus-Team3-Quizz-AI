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
            
            const minutes = Math.floor(latestQuiz.timeSpent / 60);
            const seconds = latestQuiz.timeSpent % 60;
            document.getElementById('timeTaken').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Add performance message based on 10-point scale
            let performanceMessage = '';
            if (latestQuiz.score >= 9) {
                performanceMessage = 'Xuất sắc! 🎉';
            } else if (latestQuiz.score >= 7) {
                performanceMessage = 'Rất tốt! 👏';
            } else if (latestQuiz.score >= 5) {
                performanceMessage = 'Khá tốt! 👍';
            } else {
                performanceMessage = 'Hãy cố gắng hơn! 💪';
            }

            // Add performance message to the page
            document.querySelector('.score-display').insertAdjacentHTML('afterend', 
                `<div class="performance-message">${performanceMessage}</div>`);
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

/*  Confetti effect- hiệu ứng pháo hoa giấy*/  
function launchConfettiLoop() {
    setInterval(() => {
        confetti({
            particleCount: 15,
            angle: 70,
            spread: 55,
            origin: { x: 0, y:0.5 }
        });

        confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });
    }, 1000); // Bắn mỗi giây
}

// Gọi hàm lặp vô hạn
launchConfettiLoop();
