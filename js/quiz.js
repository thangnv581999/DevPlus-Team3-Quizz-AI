document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and quiz is selected
    const user = JSON.parse(localStorage.getItem('user'));
    const selectedQuiz = JSON.parse(localStorage.getItem('selectedQuiz'));
    
    if (!user || !selectedQuiz) {
        window.location.href = 'home.html';
        return;
    }

    // Sample questions data (in real app, this would come from an API)
    const questions = [
        {
            question: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 1
        },
        {
            question: "What is the capital of France?",
            options: ["London", "Berlin", "Paris", "Madrid"],
            correctAnswer: 2
        }
        // Add more questions as needed
    ];

    let currentQuestion = 0;
    let userAnswers = new Array(questions.length).fill(null);
    let timeLeft = 900; // 15 minutes in seconds

    // Initialize UI
    document.getElementById('quizTitle').textContent = selectedQuiz.title;
    updateQuestion();
    startTimer();

    // Navigation buttons
    document.getElementById('previousBtn').addEventListener('click', () => {
        if (currentQuestion > 0) {
            currentQuestion--;
            updateQuestion();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            updateQuestion();
        } else {
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('submitBtn').style.display = 'block';
        }
    });

    document.getElementById('submitBtn').addEventListener('click', () => {
        // Calculate score
        const score = calculateScore();
        const timeSpent = 900 - timeLeft;
        
        // Store results
        localStorage.setItem('quizResults', JSON.stringify({
            score,
            timeSpent,
            totalQuestions: questions.length,
            correctAnswers: score
        }));

        // Redirect to congratulations page
        window.location.href = 'congratulations.html';
    });

    function updateQuestion() {
        const question = questions[currentQuestion];
        document.getElementById('questionText').textContent = question.question;
        
        const optionsContainer = document.getElementById('options');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = `option ${userAnswers[currentQuestion] === index ? 'selected' : ''}`;
            optionElement.textContent = option;
            
            optionElement.addEventListener('click', () => {
                userAnswers[currentQuestion] = index;
                updateQuestion();
            });
            
            optionsContainer.appendChild(optionElement);
        });

        // Update navigation buttons
        document.getElementById('previousBtn').disabled = currentQuestion === 0;
        document.getElementById('nextBtn').style.display = currentQuestion === questions.length - 1 ? 'none' : 'block';
        document.getElementById('submitBtn').style.display = currentQuestion === questions.length - 1 ? 'block' : 'none';
        
        // Update progress
        document.getElementById('progress').textContent = `Question: ${currentQuestion + 1}/${questions.length}`;
    }

    function startTimer() {
        const timerElement = document.getElementById('timer');
        
        const timer = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timer);
                alert('Time is up!');
                document.getElementById('submitBtn').click();
                return;
            }

            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            timeLeft--;
        }, 1000);
    }

    function calculateScore() {
        return userAnswers.reduce((score, answer, index) => {
            return score + (answer === questions[index].correctAnswer ? 1 : 0);
        }, 0);
    }
}); 