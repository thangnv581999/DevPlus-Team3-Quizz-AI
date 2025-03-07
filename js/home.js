const apiKey = "AIzaSyChs02VvwUeRB0eoh_bf5auW0HbwH2FMco";
let grade = 0;

// Object chứa các bản dịch cho tiếng Việt và tiếng Anh
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

// Biến lưu ngôn ngữ hiện tại, mặc định là tiếng Việt
let currentLanguage = 'vi';

// Event listener khi DOM được load hoàn tất
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await getLoggedInUserManual();
        console.log("getLoggedInUser returned:", user);
        if (!user) {
            console.error("Không tìm thấy user đã đăng nhập. Chuyển hướng về trang login.");
            window.location.href = 'login.html';
            return;
        }
        // Hiển thị tên người dùng
        document.getElementById('username').textContent = user.username;

        // Xử lý đăng xuất: cập nhật isLoggedIn thành false trong IndexedDB
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            try {
                console.log("Before logout, user object:", user);
                user.isLoggedIn = false;
                await updateUser(user);
                console.log("Update logout done. User object:", user);
                // Đọc lại từ DB để kiểm tra:
                const updatedUser = await getUser(user.id);
                console.log("Updated user from DB:", updatedUser);
            } catch (error) {
                console.error("Lỗi khi đăng xuất:", error);
            }
            window.location.href = 'login.html';
        });
    } catch (error) {
        console.error("Lỗi khi truy xuất user:", error);
        window.location.href = 'login.html';
        return;
    }

    // Các xử lý khác (ngôn ngữ, tạo quiz, ...)
    document.getElementById('language').addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        updateUILanguage();
    });
    updateUILanguage();
    document.getElementById('generateButton').addEventListener('click', generateQuiz);
});





/** 
 * Cập nhật ngôn ngữ hiển thị trên giao diện
 * - Cập nhật placeholder cho input chủ đề
 * - Cập nhật text cho nút tạo quiz
 * - Cập nhật text cho dropdown số câu hỏi
 */
function updateUILanguage() {
    const lang = translations[currentLanguage];
    document.getElementById('topicInput').placeholder = lang.placeholder;
    document.getElementById('generateButton').textContent = lang.generateButton;

    const questionSelect = document.getElementById('questionCount');
    Array.from(questionSelect.options).forEach(option => {
        option.text = `${option.value} ${lang.questionCount}`;
    });
}

/**
 * Reset điểm số về 0
 * - Reset biến grade
 * - Cập nhật hiển thị điểm trên giao diện
 */
function clearGrade() {
    document.getElementById("displayGrade").textContent = "0";
    grade = 0;
}

/**
 * Tính và cập nhật điểm số
 * @param {boolean} showAnswer - Kết quả trả lời (đúng/sai)
 * @param {number} time - Thời gian còn lại khi trả lời
 */
function countGrade(showAnswer, time) {
    if (showAnswer) {
        grade += time;
        document.getElementById("displayGrade").textContent = grade;
    }
}

/**
 * Hàm chính để tạo quiz
 * - Lấy input từ người dùng (chủ đề, số câu hỏi)
 * - Gọi API Gemini để sinh câu hỏi
 * - Xử lý và hiển thị câu hỏi
 */
async function generateQuiz() {
    clearGrade();
    const topic = document.getElementById("topicInput").value;
    const questionCount = document.getElementById("questionCount").value;
    const lang = translations[currentLanguage];

    const quizOutput = document.getElementById("quizOutput");
    const quizQuestions = document.getElementById("quizQuestions");

    quizOutput.innerHTML = `<div>${lang.topic}: ${topic}</div>`;
    quizQuestions.innerHTML = currentLanguage === 'vi' ? '<div>Đang tạo câu hỏi...</div>' : '<div>Generating questions...</div>';

    try {
        const promptText = currentLanguage === 'vi'
            ? `Tạo ${questionCount} câu hỏi trắc nghiệm bằng tiếng Việt về chủ đề ${topic}. Trả về dữ liệu theo định dạng JSON với cấu trúc sau:
               {
                 "questions": [
                   {
                     "id": 1,
                     "text": "nội dung câu hỏi bằng tiếng Việt",
                     "options": [
                       {"label": "a", "text": "lựa chọn a bằng tiếng Việt"},
                       {"label": "b", "text": "lựa chọn b bằng tiếng Việt"},
                       {"label": "c", "text": "lựa chọn c bằng tiếng Việt"},
                       {"label": "d", "text": "lựa chọn d bằng tiếng Việt"}
                     ],
                     "correctAnswer": "a"
                   }
                 ]
               }

               Lưu ý:
               - Tất cả nội dung phải được viết bằng tiếng Việt
               - Trả về đúng định dạng JSON như trên
               - Mỗi câu hỏi phải có đủ 4 lựa chọn a, b, c, d`
            : `Create ${questionCount} multiple choice questions in English about ${topic}. Return data in JSON format with the following structure:
               {
                 "questions": [
                   {
                     "id": 1,
                     "text": "question content in English",
                     "options": [
                       {"label": "a", "text": "option a in English"},
                       {"label": "b", "text": "option b in English"},
                       {"label": "c", "text": "option c in English"},
                       {"label": "d", "text": "option d in English"}
                     ],
                     "correctAnswer": "a"
                   }
                 ]
               }

               Note:
               - All content must be in English
               - Return exact JSON format as above
               - Each question must have all 4 options a, b, c, d`;

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
        const questions = parseQuizContent(quizContent);

        if (questions.length === 0) {
            throw new Error('No questions parsed');
        }

        // Log questions and answers in a cleaner format
        console.log('Quiz Content:');
        questions.forEach((q, index) => {
            console.log(`\nQuestion ${index + 1}:`);
            console.log(`${q.text}`);
            q.options.forEach(opt => {
                console.log(`${opt.label}) ${opt.text}`);
            });
            console.log(`Answer: ${q.correctAnswer}`);
            console.log('------------------------');
        });
zzzzzazczz
        displayQuestion(questions, 0);

    } catch (error) {
        console.error('Error:', error);
        quizQuestions.innerHTML = `<div class="error">Có lỗi xảy ra: ${error.message}</div>`;
    }
}

/**
 * Phân tích nội dung JSON từ AI thành mảng câu hỏi
 * @param {string} content - Nội dung JSON trả về từ AI
 * @returns {Array} Mảng các object câu hỏi đã được format
 */
function parseQuizContent(content) {
    try {
        // Xử lý response có thể chứa markdown format
        let jsonStr = content;

        // Loại bỏ markdown code block nếu có
        if (content.includes('```json')) {
            jsonStr = content.replace(/```json\n|\n```/g, '');
        } else if (content.includes('```')) {
            jsonStr = content.replace(/```\n|\n```/g, '');
        }

        // Loại bỏ khoảng trắng và xuống dòng thừa
        jsonStr = jsonStr.trim();

        // Cố gắng parse JSON từ response
        const jsonData = JSON.parse(jsonStr);

        // Kiểm tra cấu trúc JSON
        if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
            throw new Error('Invalid JSON structure');
        }

        // Validate và format từng câu hỏi
        const questions = jsonData.questions.map(q => {
            // Kiểm tra các trường bắt buộc
            if (!q.text || !q.options || !Array.isArray(q.options) || !q.correctAnswer) {
                throw new Error('Invalid question format');
            }

            // Kiểm tra đủ 4 options
            if (q.options.length !== 4) {
                throw new Error('Each question must have exactly 4 options');
            }

            // Kiểm tra mỗi option có đủ label và text
            q.options.forEach(opt => {
                if (!opt.label || !opt.text) {
                    throw new Error('Invalid option format');
                }
            });

            return {
                text: q.text.trim(),
                options: q.options.map(opt => ({
                    label: opt.label.toLowerCase(),
                    text: opt.text.trim()
                })),
                correctAnswer: q.correctAnswer.toUpperCase()
            };
        });

        // Log để debug
        console.log('Parsed questions:', questions);

        return questions;
    } catch (error) {
        console.error('Error parsing JSON content:', error);
        console.log('Raw content:', content); // Log nội dung gốc để debug
        return [];
    }
}

/**
 * Hiển thị câu hỏi lên giao diện
 * @param {Array} questions - Mảng các câu hỏi
 * @param {number} index - Vị trí câu hỏi hiện tại
 * Chức năng:
 * - Hiển thị nội dung câu hỏi
 * - Tạo timer đếm ngược
 * - Xử lý sự kiện chọn đáp án
 * - Chuyển trang khi hoàn thành quiz
 */
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

/**
 * Hiển thị kết quả sau khi trả lời
 * @param {Object} question - Câu hỏi hiện tại
 * @param {number} index - Vị trí câu hỏi
 * @param {Array} questions - Mảng các câu hỏi
 * @returns {boolean} Kết quả trả lời (đúng/sai)
 * Chức năng:
 * - Hiển thị đáp án đúng
 * - Đánh dấu đáp án người dùng
 * - Hiển thị thông báo kết quả
 * - Chuyển sang câu hỏi tiếp theo
 */
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