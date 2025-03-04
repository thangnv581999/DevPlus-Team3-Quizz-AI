const apiKey = "AIzaSyChs02VvwUeRB0eoh_bf5auW0HbwH2FMco";
const generateButton = document.getElementById("generateButton");
const topicInput = document.getElementById("topicInput");
const quizOutput = document.getElementById("quizOutput");
const quizQuestions = document.getElementById("quizQuestions");

// Thêm đối tượng để lưu trữ các chuỗi văn bản theo ngôn ngữ
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

// Thêm biến để lưu ngôn ngữ hiện tại
let currentLanguage = 'vi';

// Lắng nghe sự kiện thay đổi ngôn ngữ
document.getElementById('language').addEventListener('change', (e) => {
  currentLanguage = e.target.value;
  updateUILanguage();
});

// Hàm cập nhật ngôn ngữ giao diện
function updateUILanguage() {
  const lang = translations[currentLanguage];
  document.getElementById('topicInput').placeholder = lang.placeholder;
  document.getElementById('generateButton').textContent = lang.generateButton;
  
  // Cập nhật các option của select số câu hỏi
  const questionSelect = document.getElementById('questionCount');
  Array.from(questionSelect.options).forEach(option => {
    option.text = `${option.value} ${lang.questionCount}`;
  });
}

generateButton.addEventListener("click", async () => {
  const topic = topicInput.value;
  const questionCount = document.getElementById("questionCount").value;
  const selectedLanguage = document.getElementById("language").value;
  const lang = translations[selectedLanguage];
  
  // Hiển thị loading state
  quizOutput.innerHTML = `<div>${lang.topic}: ${topic}</div>`;
  quizQuestions.innerHTML = '<div>Đang tạo câu hỏi...</div>';

  try {
    // Tạo prompt cho API
    const promptText = selectedLanguage === 'vi' 
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
    console.log('API Response:', data); // Debug log

    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      throw new Error('Invalid API response');
    }

    const quizContent = data.candidates[0].content.parts[0].text;
    console.log('Quiz Content:', quizContent); // Debug log

    // Parse câu hỏi
    const questions = parseQuizContent(quizContent);
    console.log('Parsed Questions:', questions); // Debug log

    if (questions.length === 0) {
      throw new Error('No questions parsed');
    }

    // Bắt đầu hiển thị câu hỏi
    displayQuestion(questions, 0);

  } catch (error) {
    console.error('Error:', error);
    quizQuestions.innerHTML = `<div class="error">Có lỗi xảy ra: ${error.message}</div>`;
  }
});

function parseQuizContent(content) {
  try {
    const questions = [];
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    let currentQuestion = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match question
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

      // Match options
      const optionMatch = line.match(/^([a-d])\)(.*)/i);
      if (optionMatch && currentQuestion) {
        currentQuestion.options.push({
          label: optionMatch[1],
          text: optionMatch[2].trim()
        });
        continue;
      }

      // Match answer
      const answerMatch = line.match(/^(Đáp án|Answer):\s*([a-d])/i);
      if (answerMatch && currentQuestion) {
        currentQuestion.correctAnswer = answerMatch[2].toUpperCase();
        questions.push(currentQuestion);
        currentQuestion = null;
      }
    }

    // Add last question if exists
    if (currentQuestion && currentQuestion.options.length > 0) {
      questions.push(currentQuestion);
    }

    console.log('Parsed Questions:', questions);
    return questions;
  } catch (error) {
    console.error('Error parsing content:', error);
    return [];
  }
}

function displayQuestion(questions, index) {
  const selectedLanguage = document.getElementById("language").value;
  const lang = translations[selectedLanguage];
  const quizQuestionsDiv = document.getElementById("quizQuestions");

  if (!questions || questions.length === 0) {
    quizQuestionsDiv.innerHTML = '<div class="error">Không có câu hỏi nào được tạo</div>';
    return;
  }
  
  if (index >= questions.length) {
    quizQuestionsDiv.innerHTML = `
      <div class="quiz-completed">
        <h2>${lang.quizCompleted}</h2>
      </div>
    `;
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

  // Xử lý click vào option
  const options = document.querySelectorAll('.option');
  options.forEach(option => {
    option.addEventListener('click', () => {
      // Xóa class selected từ tất cả options
      options.forEach(opt => opt.classList.remove('selected'));
      // Thêm class selected vào option được chọn
      option.classList.add('selected');
      // Dừng timer và hiển thị đáp án
      clearInterval(timerInterval);
      showAnswer(question, index, questions);
    });
  });
}

function showAnswer(question, index, questions) {
  const selectedLanguage = document.getElementById("language").value;
  const lang = translations[selectedLanguage];
  const quizQuestionsDiv = document.getElementById("quizQuestions");
  
  // Lấy option được chọn và tất cả options
  const selectedOption = document.querySelector('.option.selected');
  const options = document.querySelectorAll('.option');
  
  // Xác định đáp án người dùng chọn
  const userAnswer = selectedOption ? selectedOption.dataset.value.toUpperCase() : null;
  const correctAnswer = question.correctAnswer.toUpperCase();
  
  // Tạo thông báo đáp án
  const answerMessage = selectedLanguage === 'vi' 
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

  // Thêm thông báo đáp án vào cuối câu hỏi
  quizQuestionsDiv.insertAdjacentHTML('beforeend', answerMessage);

  // Đánh dấu màu cho option được chọn
  if (selectedOption) {
    if (userAnswer === correctAnswer) {
      selectedOption.classList.add('correct-answer');
    } else {
      selectedOption.classList.add('wrong-answer');
      // Tìm và đánh dấu đáp án đúng
      options.forEach(option => {
        if (option.dataset.value.toUpperCase() === correctAnswer) {
          option.classList.add('correct-answer');
        }
      });
    }
  }

  // Chuyển câu hỏi sau 2 giây
  setTimeout(() => {
    displayQuestion(questions, index + 1);
  }, 2000);
} 