const apiKey = "AIzaSyChs02VvwUeRB0eoh_bf5auW0HbwH2FMco";
let grade = 0;

const translations = {
    vi: {
        placeholder: "Nhập chủ đề của bạn...",
        generateButton: "Tạo Quiz",
        questionCount: "câu hỏi",
        topic: "Chủ đề",
        timeLeft: "Thời gian còn lại",
        correctAnswer: "Đáp án đúng",
        quizCompleted: "Bạn đã hoàn thành bài Quiz!",
        question: "Câu hỏi"
    },
    en: {
        placeholder: "Enter your topic...",
        generateButton: "Generate Quiz",
        questionCount: "questions",
        topic: "Topic",
        timeLeft: "Time left",
        correctAnswer: "Correct Answer",
        quizCompleted: "Quiz Completed!",
        question: "Question"
    }
};

let currentLanguage = 'vi';

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Display username
    document.getElementById('username').textContent = user.username;

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Language change handler
    document.getElementById('language').addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        updateUILanguage();
    });

    // Initialize UI language
    updateUILanguage();

    // Quiz generation handler
    document.getElementById('generateButton').addEventListener('click', generateQuiz);
});

function updateUILanguage() {
    const lang = translations[currentLanguage];
    document.getElementById('topicInput').placeholder = lang.placeholder;
    document.getElementById('generateButton').textContent = lang.generateButton;
    
    const questionSelect = document.getElementById('questionCount');
    Array.from(questionSelect.options).forEach(option => {
        option.text = `${option.value} ${lang.questionCount}`;
    });
}

function clearGrade() {
    document.getElementById("displayGrade").textContent = "0";
    grade = 0;
}

function countGrade(showAnswer, time) {
    if (showAnswer) {
        grade += time;
        document.getElementById("displayGrade").textContent = grade;
    }
}

async function generateQuiz() {
    clearGrade();
    const topic = document.getElementById("topicInput").value;
    const questionCount = document.getElementById("questionCount").value;
    const lang = translations[currentLanguage];
    
    const quizOutput = document.getElementById("quizOutput");
    const quizQuestions = document.getElementById("quizQuestions");
    
    quizOutput.innerHTML = `<div>${lang.topic}: ${topic}</div>`;
    quizQuestions.innerHTML = '<div>Đang tạo câu hỏi...</div>';

    try {
        const promptText = currentLanguage === 'vi'
            ? `Tạo ${questionCount} câu hỏi trắc nghiệm về chủ đề ${topic}. Mỗi câu hỏi phải có 4 lựa chọn (a, b, c, d). Format câu trả lời như sau:
               Câu 1: [nội dung câu hỏi]
               a) [lựa chọn a]
               b) [lựa chọn b]
               c) [lựa chọn c]
               d) [lựa chọn d]
               Đáp án: [chữ cái đáp án đúng]`
            : `Create ${questionCount} multiple choice questions about ${topic}. Each question must have 4 options (a, b, c, d). Format the answer as follows:
               Question 1: [question content]
               a) [option a]
               b) [option b]
               c) [option c]
               d) [option d]
               Answer: [correct answer letter]`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: promptText }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    },
                }),
            }
        );

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            throw new Error('Invalid API response');
        }

        const quizContent = data.candidates[0].content.parts[0].text;
        console.log('Raw AI Response:', quizContent); // Log raw AI response

        const questions = parseQuizContent(quizContent);

        if (questions.length === 0) {
            throw new Error('No questions parsed');
        }

        // Log formatted questions and answers
        console.log('Parsed Questions and Answers:');
        questions.forEach((q, index) => {
            console.log(`\nQuestion ${index + 1}:`);
            console.log('Question Text:', q.text);
            console.log('Options:');
            q.options.forEach(opt => {
                console.log(`${opt.label}) ${opt.text}`);
            });
            console.log('Correct Answer:', q.correctAnswer);
        });

        displayQuestion(questions, 0);

    } catch (error) {
        console.error('Error:', error);
        quizQuestions.innerHTML = `<div class="error">Có lỗi xảy ra: ${error.message}</div>`;
    }
}

function parseQuizContent(content) {
    try {
        const questions = [];
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        let currentQuestion = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            const questionMatch = line.match(/^(Câu|Question)\s*\d+:(.+)/i);
            if (questionMatch) {
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = {
                    text: questionMatch[2].trim(),
                    options: [],
                    correctAnswer: null
                };
                continue;
            }

            const optionMatch = line.match(/^([a-d])\)(.*)/i);
            if (optionMatch && currentQuestion) {
                currentQuestion.options.push({
                    label: optionMatch[1],
                    text: optionMatch[2].trim()
                });
                continue;
            }

            const answerMatch = line.match(/^(Đáp án|Answer):\s*([a-d])/i);
            if (answerMatch && currentQuestion) {
                currentQuestion.correctAnswer = answerMatch[2].toUpperCase();
                questions.push(currentQuestion);
                currentQuestion = null;
            }
        }

        if (currentQuestion && currentQuestion.options.length > 0) {
            questions.push(currentQuestion);
        }

        return questions;
    } catch (error) {
        console.error('Error parsing content:', error);
        return [];
    }
}

function displayQuestion(questions, index) {
    const lang = translations[currentLanguage];
    const quizQuestionsDiv = document.getElementById("quizQuestions");

    if (!questions || questions.length === 0) {
        quizQuestionsDiv.innerHTML = '<div class="error">Không có câu hỏi nào được tạo</div>';
        return;
    }
    
    if (index >= questions.length) {
        // Save quiz results to localStorage
        const quizResults = {
            score: grade,
            totalQuestions: questions.length,
            correctAnswers: Math.floor(grade / 10), // Since each correct answer can get max 10 points
            timeSpent: questions.length * 10 - grade // Calculate total time spent
        };
        localStorage.setItem('quizResults', JSON.stringify(quizResults));
        
        // Redirect to congratulations page
        window.location.href = 'congratulations.html';
        return;
    }

    const question = questions[index];
    
    quizQuestionsDiv.innerHTML = `
        <div class="question-container">
            <div class="question-header">
                <h3>${lang.question} ${index + 1}/${questions.length}</h3>
                <div class="timer-container">
                    <span>${lang.timeLeft}:</span>
                    <div id="timer" class="timer">10</div>
                </div>
            </div>
            <div class="question-text">${question.text}</div>
            <div class="options-container">
                ${question.options.map(option => `
                    <div class="option" data-value="${option.label}">
                        <span class="option-label">${option.label}</span>
                        <span class="option-text">${option.text}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    let timeLeft = 10;
    const timerElement = document.getElementById('timer');
    const timerInterval = setInterval(() => {
        timeLeft--;
        if (timerElement) {
            timerElement.textContent = timeLeft;
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showAnswer(question, index, questions);
        }
    }, 1000);

    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            clearInterval(timerInterval);
            countGrade(showAnswer(question, index, questions), timeLeft);
            options.forEach(opt => opt.style.pointerEvents = 'none');
        });
    });
}

function showAnswer(question, index, questions) {
    const lang = translations[currentLanguage];
    const quizQuestionsDiv = document.getElementById("quizQuestions");
    
    const selectedOption = document.querySelector('.option.selected');
    const options = document.querySelectorAll('.option');
    
    const userAnswer = selectedOption ? selectedOption.dataset.value.toUpperCase() : null;
    const correctAnswer = question.correctAnswer.toUpperCase();
    
    const answerMessage = currentLanguage === 'vi'
        ? `<div class="answer-reveal ${userAnswer === correctAnswer ? 'correct' : 'incorrect'}">
             <p>Đáp án đúng: ${question.correctAnswer}</p>
             ${userAnswer 
               ? `<p>Bạn đã chọn: ${selectedOption.dataset.value} - ${userAnswer === correctAnswer 
                   ? 'Chính xác!' 
                   : 'Chưa chính xác'}</p>` 
               : '<p>Bạn chưa chọn đáp án</p>'}
           </div>`
        : `<div class="answer-reveal ${userAnswer === correctAnswer ? 'correct' : 'incorrect'}">
             <p>Correct answer: ${question.correctAnswer}</p>
             ${userAnswer 
               ? `<p>Your answer: ${selectedOption.dataset.value} - ${userAnswer === correctAnswer 
                   ? 'Correct!' 
                   : 'Incorrect'}</p>` 
               : '<p>You did not select an answer</p>'}
           </div>`;

    quizQuestionsDiv.insertAdjacentHTML('beforeend', answerMessage);

    setTimeout(() => {
        displayQuestion(questions, index + 1);
    }, 2000);

    if (selectedOption) {
        if (userAnswer === correctAnswer) {
            selectedOption.classList.add('correct-answer');
            return true;
        } else {
            selectedOption.classList.add('wrong-answer');
            options.forEach(option => {
                if (option.dataset.value.toUpperCase() === correctAnswer) {
                    option.classList.add('correct-answer');
                }
            });
            return false;
        }
    }
    return false;
} 