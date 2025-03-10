document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and has quiz results
    

    // Display username
    const username = user.username;

    // Calculate percentage score
    const percentageScore = Math.round((quizResults.correctAnswers / quizResults.totalQuestions) * 100);
    
    // Display results
    document.getElementById('finalScore').textContent = quizResults.score;
    document.getElementById('correctAnswers').textContent = 
        `${quizResults.correctAnswers}/${quizResults.totalQuestions}`;
    
    const minutes = Math.floor(quizResults.timeSpent / 60);
    const seconds = quizResults.timeSpent % 60;
    document.getElementById('timeTaken').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Add performance message based on score
    let performanceMessage = '';
    if (percentageScore >= 90) {
        performanceMessage = 'Xuất sắc! 🎉';
    } else if (percentageScore >= 70) {
        performanceMessage = 'Rất tốt! 👏';
    } else if (percentageScore >= 50) {
        performanceMessage = 'Khá tốt! 👍';
    } else {
        performanceMessage = 'Hãy cố gắng hơn! 💪';
    }

    // Add performance message to the page
    document.querySelector('.score-display').insertAdjacentHTML('afterend', 
        `<div class="performance-message">${performanceMessage}</div>`);

    // Button handlers
    document.getElementById('returnHomeBtn').addEventListener('click', () => {
        window.location.href = 'home.html';
    });

    document.getElementById('tryAgainBtn').addEventListener('click', () => {
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
