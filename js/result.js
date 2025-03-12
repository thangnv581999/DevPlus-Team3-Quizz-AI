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

            // Display quiz info in result box
            displayQuizInfo(quiz);
            
            // Display questions and answers
            displayQuestionsAndAnswers(quiz);
        };

        request.onerror = (event) => {
            console.error('Error fetching quiz:', event.target.error);
        };

    } catch (error) {
        console.error('Error:', error);
    }
});

function displayQuizInfo(quiz) {
    const resultBox = document.querySelector('.result-box');
    resultBox.innerHTML = `
        <div class="result-item">
            <span class="label">Topic</span>
            <span class="value">${quiz.tittle || 'N/A'}</span>
        </div>
        <div class="result-item">
            <span class="label">Grade</span>
            <span class="value"><strong>${quiz.score.toFixed(2)}</strong></span>
        </div>
    `;
}

function displayQuestionsAndAnswers(quiz) {
    const container = document.querySelector('.container');
    container.innerHTML = ''; // Clear existing content

    quiz.questions.forEach((question, index) => {
        const userAnswer = quiz.userSelections[index];
        const correctAnswer = quiz.correctAnswers[index];
        const options = quiz.answers[index];

        // Create question box
        const questionBox = document.createElement('div');
        questionBox.className = 'question-box';
        questionBox.innerHTML = `
            <h2>Question ${index + 1}/${quiz.questions.length}</h2>
            <p class="question-text">${question}</p>
            <div class="options">
                ${options.map((option, optIndex) => {
                    const label = String.fromCharCode(65 + optIndex); // Convert 0,1,2,3 to A,B,C,D
                    const isUserAnswer = userAnswer === label;
                    const isCorrectAnswer = correctAnswer === label;
                    let className = 'option';
                    if (isUserAnswer) {
                        className += isCorrectAnswer ? ' correct' : ' wrong';
                    } else if (isCorrectAnswer) {
                        className += ' correct';
                    }
                    return `
                        <button class="${className}">
                            ${label}. ${option}
                            <span class="icon">
                                <img class="check-icon" src="../img/result/tick.png" alt="Correct">
                                <img class="cross-icon" src="../img/result/x.png" alt="Wrong">
                            </span>
                        </button>
                    `;
                }).join('')}
            </div>
        `;

        // Create answer box
        const answerBox = document.createElement('div');
        answerBox.className = 'answer-box';
        answerBox.innerHTML = `
            <p>The correct answer is: <strong>${correctAnswer}. ${options[correctAnswer.charCodeAt(0) - 65]}</strong></p>
        `;

        // Add to container
        container.appendChild(questionBox);
        container.appendChild(answerBox);
    });
} 