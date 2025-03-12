const apiKey = "AIzaSyChs02VvwUeRB0eoh_bf5auW0HbwH2FMco";
let grade = 0;

// Object chứa các bản dịch cho nhiều ngôn ngữ
const translations = {
  vi: {
    placeholder: "Nhập chủ đề của bạn...",
    generateButton: "Tạo Quiz",
    questionCount: "câu hỏi",
    topic: "Chủ đề",
    timeLeft: "Thời gian còn lại",
    correctAnswer: "Đáp án đúng",
    quizCompleted: "Bạn đã hoàn thành bài Quiz!",
    question: "Câu hỏi",
    yourAnswer: "Câu trả lời của bạn",
    correct: "Chính xác!",
    incorrect: "Chưa chính xác",
    noAnswer: "Bạn chưa chọn đáp án",
  },
  en: {
    placeholder: "Enter your topic...",
    generateButton: "Generate Quiz",
    questionCount: "questions",
    topic: "Topic",
    timeLeft: "Time left",
    correctAnswer: "Correct Answer",
    quizCompleted: "Quiz Completed!",
    question: "Question",
    yourAnswer: "Your Answer",
    correct: "Correct!",
    incorrect: "Incorrect",
    noAnswer: "You did not select an answer",
  },
  fr: {
    placeholder: "Entrez votre sujet...",
    generateButton: "Générer le Quiz",
    questionCount: "questions",
    topic: "Sujet",
    timeLeft: "Temps restant",
    correctAnswer: "Bonne réponse",
    quizCompleted: "Quiz terminé !",
    question: "Question",
    yourAnswer: "Votre réponse",
    correct: "Correct !",
    incorrect: "Incorrect",
    noAnswer: "Vous n'avez pas sélectionné de réponse",
  },
  es: {
    placeholder: "Ingrese su tema...",
    generateButton: "Generar Quiz",
    questionCount: "preguntas",
    topic: "Tema",
    timeLeft: "Tiempo restante",
    correctAnswer: "Respuesta correcta",
    quizCompleted: "¡Quiz completado!",
    question: "Pregunta",
    yourAnswer: "Tu respuesta",
    correct: "¡Correcto!",
    incorrect: "Incorrecto",
    noAnswer: "No seleccionaste una respuesta",
  },
  de: {
    placeholder: "Geben Sie Ihr Thema ein...",
    generateButton: "Quiz generieren",
    questionCount: "Fragen",
    topic: "Thema",
    timeLeft: "Verbleibende Zeit",
    correctAnswer: "Richtige Antwort",
    quizCompleted: "Quiz abgeschlossen!",
    question: "Frage",
    yourAnswer: "Deine Antwort",
    correct: "Richtig!",
    incorrect: "Falsch",
    noAnswer: "Sie haben keine Antwort ausgewählt",
  },
};

// Biến lưu ngôn ngữ hiện tại, mặc định là tiếng Việt
let isLoggingOut = false;
let quizStarted = false;
// Lấy tham số từ URL
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get("quizId");
console.log(quizId);
let data;
let currentLanguage = "vi";
let topic;
let username;
let id;
let currentQuestionIndex = 0;
let userAnswers = [];
let totalTime = 0;
let timer = null;
let currentTopic = "";
let formattedQuiz;
let questions = null; // Thêm biến để lưu trữ câu hỏi

// Event listener khi DOM được load hoàn tất
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await getLoggedInUserManual();
    console.log("getLoggedInUser returned:", user);
    if (!user) {
      console.error(
        "Không tìm thấy user đã đăng nhập. Chuyển hướng về trang login."
      );
      window.location.href = "login.html";
      return;
    }
    // Hiển thị tên người dùng
    document.getElementById("username").textContent = user.username;
    username = document.getElementById("username").textContent;

    // Xử lý đăng xuất: cập nhật isLoggedIn thành false trong IndexedDB
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      isLoggingOut = true;
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
      window.location.href = "login.html";
    });
  } catch (error) {
    console.error("Lỗi khi truy xuất user:", error);
    window.location.href = "login.html";
    return;
  }

  // Cập nhật ngôn ngữ ngay khi trang tải
  updateUILanguage();

  if (quizId != null) {
    generateQuiz(quizId);
  }
  // Các xử lý khác (ngôn ngữ, tạo quiz, ...)
  document.getElementById("language").addEventListener("change", (e) => {
    currentLanguage = e.target.value;
    updateUILanguage();
    });
    
    document.getElementById("generateButton").addEventListener("click", generateQuiz);

});


/**
 * Cập nhật ngôn ngữ hiển thị trên giao diện
 * - Cập nhật placeholder cho input chủ đề
 * - Cập nhật text cho nút tạo quiz
 * - Cập nhật text cho dropdown số câu hỏi
 */
function updateUILanguage() {
  const lang = translations[currentLanguage];
  document.getElementById("topicInput").placeholder = lang.placeholder;
  document.getElementById("generateButton").textContent = lang.generateButton;

  const questionSelect = document.getElementById("questionCount");
  Array.from(questionSelect.options).forEach((option) => {
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
 * Hiển thị modal xác nhận
 * @param {string} title - Tiêu đề modal
 * @param {string} message - Nội dung thông báo
 * @returns {Promise} Promise resolve khi người dùng chọn
 */
function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const titleEl = document.getElementById("confirmTitle");
    const messageEl = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    // Cập nhật nội dung
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Hiển thị modal
    modal.style.display = "block";

    // Xử lý sự kiện nút
    function handleYes() {
      modal.style.display = "none";
      cleanup();
      resolve(true);
    }

    function handleNo() {
      modal.style.display = "none";
      cleanup();
      resolve(false);
    }

    function cleanup() {
      yesBtn.removeEventListener("click", handleYes);
      noBtn.removeEventListener("click", handleNo);
    }

    yesBtn.addEventListener("click", handleYes);
    noBtn.addEventListener("click", handleNo);
  });
}

/**
 * Hàm chính để tạo quiz
 */
async function generateQuiz() {

  topic = document.getElementById("topicInput").value;
  console.log(topic);
  const questionCount = document.getElementById("questionCount").value;
  const level = document.getElementById("level").value;
  const language = document.getElementById("language").value;

  if(quizId != null){
    // Ẩn phần tạo quiz
    const quizGenerator = document.querySelector(".quiz-generator");
    quizGenerator.style.display = "none";

    const q = await getQuizById(quizId);
    totalTime = q.time;
    quizStarted = true;
    if (!q || !q.questions || !q.answers || !q.correctAnswers) {
        throw new Error("❌ Dữ liệu quiz không hợp lệ!");
    }

    userAnswers = q.userSelections || new Array(q.questions.length).fill(null);
    console.log(userAnswers);
    
    // Tạo quizArray theo format mong muốn
    const quizz = q.questions.map((question, index) => ({
      id: index + 1, // Đánh số câu hỏi
      text: question, // Nội dung câu hỏi
      options: q.answers[index].map((answer, idx) => ({
          label: String.fromCharCode(97 + idx), // Chuyển index thành "a", "b", "c", "d"
          text: answer
      })),
      correctAnswer: q.correctAnswers[index] // Đáp án đúng
    }));
    console.log("🔹 Dữ liệu quizz đã được nạp:", quizz);
    rentData(quizz);
  }else{
    // Kiểm tra các trường input
    if (!topic || !questionCount || !level || !language) {
      alert(
        currentLanguage === "vi"
          ? "Vui lòng điền đầy đủ thông tin!"
          : "Please fill in all fields!"
      );
      return;
    }

    currentTopic = topic; // Lưu chủ đề hiện tại

    const confirmTitle =
      currentLanguage === "vi" ? "Xác nhận tạo Quiz?" : "Confirm Quiz Creation?";
    const confirmMessage =
      currentLanguage === "vi"
        ? `Bạn có chắc chắn muốn tạo Quiz về "${topic}" với ${questionCount} câu hỏi không?`
        : `Are you sure you want to create a Quiz about "${topic}" with ${questionCount} questions?`;

    const confirmed = await showConfirmModal(confirmTitle, confirmMessage);

    if (!confirmed) {
      return;
    }

    // Ẩn phần tạo quiz
    const quizGenerator = document.querySelector(".quiz-generator");
    quizGenerator.style.display = "none";
    
    quizStarted = true;

    clearGrade();
    const lang = translations[currentLanguage];

    // Tạo container mới cho quiz
    const mainContent = document.querySelector(".main-content");
    const quizContainer = document.createElement("div");
    quizContainer.id = "quizContainer";
    quizContainer.innerHTML = `
          <div id="quizOutput">
              <div>${lang.topic}: ${topic}</div>
          </div>
          <div id="quizQuestions">
              ${
                currentLanguage === "vi"
                  ? "<div>Đang tạo câu hỏi...</div>"
                  : "<div>Generating questions...</div>"
              }
          </div>
      `;
    mainContent.appendChild(quizContainer);

    try {
      const promptText =
        currentLanguage === "vi"
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

      data = await response.json();

      if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
        throw new Error("Invalid API response");
      }

      const quizContent = data.candidates[0].content.parts[0].text;
      const questions = parseQuizContent(quizContent);
      console.log(questions);
      rentData(questions);
      
    } catch (error) {
      console.error("Error:", error);
      quizQuestions.innerHTML = `<div class="error">Có lỗi xảy ra: ${error.message}</div>`;
    }
  }

  

  // Xử lý sự kiện trước khi thoát trang
  window.addEventListener("beforeunload", (event) => {
    if (quizStarted && !isLoggingOut) {
      const message = currentLanguage === "vi" 
        ? "Bạn có chắc chắn muốn rời khỏi trang không? Tiến trình làm bài của bạn sẽ bị mất!"
        : "Are you sure you want to leave? Your quiz progress will be lost!";

      event.preventDefault();
      event.returnValue = message;
    }
  });
}

function rentData(questions){
  if (questions.length === 0) {
    throw new Error("No questions parsed");
  }

  // Log questions and answers in a cleaner format
  console.log("Quiz Content:");
  questions.forEach((q, index) => {
    console.log(`\nQuestion ${index + 1}:`);
    console.log(`${q.text}`);
    q.options.forEach((opt) => {
      console.log(`${opt.label}) ${opt.text}`);
    });
    console.log(`Answer: ${q.correctAnswer}`);
    console.log("------------------------");
  });
  if(quizId == null){
    let quest = questions.map(q => q.text);
    let answers = questions.map(q => q.options.map(opt => opt.text));
    let correctAnswers = questions.map(q => q.correctAnswer);
    formattedQuiz = formatQuizData(topic,username, quest, answers, correctAnswers);

    // Lưu vào cơ sở dữ liệu
    addQuiz(formattedQuiz).then(result => {
        id = result;
        console.log("Quiz added with ID:", result);
    }).catch(err => {
        console.error("Error adding quiz:", err);
    });
  }
  

  displayQuestion(questions, 0);
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
    if (content.includes("```json")) {
      jsonStr = content.replace(/```json\n|\n```/g, "");
    } else if (content.includes("```")) {
      jsonStr = content.replace(/```\n|\n```/g, "");
    }

    // Loại bỏ khoảng trắng và xuống dòng thừa
    jsonStr = jsonStr.trim();

    // Cố gắng parse JSON từ response
    const jsonData = JSON.parse(jsonStr);

    // Kiểm tra cấu trúc JSON
    if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
      throw new Error("Invalid JSON structure");
    }

    // Validate và format từng câu hỏi
    const questions = jsonData.questions.map((q) => {
      // Kiểm tra các trường bắt buộc
      if (
        !q.text ||
        !q.options ||
        !Array.isArray(q.options) ||
        !q.correctAnswer
      ) {
        throw new Error("Invalid question format");
      }

      // Kiểm tra đủ 4 options
      if (q.options.length !== 4) {
        throw new Error("Each question must have exactly 4 options");
      }

      // Kiểm tra mỗi option có đủ label và text
      q.options.forEach((opt) => {
        if (!opt.label || !opt.text) {
          throw new Error("Invalid option format");
        }
      });

      return {
        text: q.text.trim(),
        options: q.options.map((opt) => ({
          label: opt.label.toLowerCase(),
          text: opt.text.trim(),
        })),
        correctAnswer: q.correctAnswer.toUpperCase(),
      };
    });

    // Log để debug
    console.log("Parsed questions:", questions);

    return questions;
  } catch (error) {
    console.error("Error parsing JSON content:", error);
    console.log("Raw content:", content); // Log nội dung gốc để debug
    return [];
  }
}

/**
 * Hiển thị modal xác nhận submit
 * @returns {Promise} Promise resolve khi người dùng chọn
 */
function showSubmitModal() {
  const lang = translations[currentLanguage];
  const title =
    currentLanguage === "vi" ? "Xác nhận nộp bài?" : "Confirm Submission?";
  const message =
    currentLanguage === "vi"
      ? "Bạn có chắc chắn muốn nộp bài không? Sau khi nộp bài bạn sẽ không thể quay lại để sửa."
      : "Are you sure you want to submit? You cannot return to edit after submission.";
  return showConfirmModal(title, message);
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
  const mainContent = document.querySelector('.main-content');

  if (!questions || questions.length === 0) {
    mainContent.innerHTML = '<div class="error">Không có câu hỏi nào được tạo</div>';
    return;
  }

  // Khởi tạo mảng câu trả lời và timer nếu chưa có
  if (userAnswers.length === 0) {
    userAnswers = new Array(questions.length).fill(null);
    if(quizId == null){
      totalTime = questions.length * 60; // 1 phút cho mỗi câu hỏi
    }
    startTimer();
  }else{
    startTimer();
  }

  // Lấy template và clone nó
  const template = document.getElementById('quiz-template');
  const quizElement = template.content.cloneNode(true);
  
  // Lấy các phần tử cần cập nhật
  const topicInfo = quizElement.querySelector('.topic-info');
  const questionCounter = quizElement.querySelector('.question-counter');
  const timerLabel = quizElement.querySelector('.timer-label');
  const timerDisplay = quizElement.querySelector('.timer-display');
  const questionText = quizElement.querySelector('.question-text');
  const optionsGrid = quizElement.querySelector('.options-grid');
  const prevBtn = quizElement.querySelector('.prev-btn');
  const nextBtn = quizElement.querySelector('.next-btn');
  
  // Cập nhật nội dung
  const question = questions[index];
  topicInfo.textContent = `${lang.topic}: ${currentTopic}`;
  questionCounter.textContent = `${lang.question} ${index + 1}/${questions.length}`;
  timerLabel.textContent = lang.timeLeft;
  questionText.textContent = question.text;

  // Xóa event listeners cũ nếu có
  const oldPrevBtn = document.querySelector('.prev-btn');
  const oldNextBtn = document.querySelector('.next-btn');
  
  if (oldPrevBtn) oldPrevBtn.replaceWith(oldPrevBtn.cloneNode(true));
  if (oldNextBtn) oldNextBtn.replaceWith(oldNextBtn.cloneNode(true));

  // Tạo các option
  question.options.forEach(option => {
    const optionElement = document.createElement('div');
    const isSelected = userAnswers[index] === option.label.toUpperCase();

    optionElement.className = `option-item ${isSelected ? 'selected' : ''}`;
    optionElement.dataset.value = option.label;
    optionElement.innerHTML = `
        <span class="option-label">${option.label.toUpperCase()}</span>
        <span class="option-text">${option.text}</span>
    `;

    optionElement.addEventListener('click', () => {
        // Bỏ chọn tất cả option trước đó
        const options = optionsGrid.querySelectorAll('.option-item');
        options.forEach(opt => opt.classList.remove('selected'));

        // Đánh dấu option được chọn
        optionElement.classList.add('selected');
        userAnswers[index] = option.label.toUpperCase();
        console.log(userAnswers);

        // Lưu lựa chọn vào database hoặc biến id
        const currentQuizId = quizId ? parseInt(quizId, 10) : id;
        replaceUserSelections(currentQuizId, userAnswers);
    });

    optionsGrid.appendChild(optionElement);
  });

  

  // Cập nhật nút điều hướng
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === questions.length - 1 ? 'Submit' : 'Next';
  
  prevBtn.addEventListener('click', () => {
    if (index > 0) {
      currentQuestionIndex--;
      displayQuestion(questions, currentQuestionIndex);
    }
  });

  nextBtn.addEventListener('click', async () => {
    if (index < questions.length - 1) {
      currentQuestionIndex++;
      displayQuestion(questions, currentQuestionIndex);
    } else {
      const shouldSubmit = await showSubmitModal();
      if (shouldSubmit) {
        const score = calculateScore(questions);
        const timeSubmit = new Date().toISOString();
        const timeSpent = questions.length * 60 - totalTime;
        await submitQuiz(score, timeSubmit, timeSpent);
      }
    }
  });

  // Xóa nội dung cũ và thêm câu hỏi mới
  mainContent.innerHTML = '';
  mainContent.appendChild(quizElement);

  // Cập nhật hiển thị thời gian
  updateTimerDisplay(timerDisplay);
}

/**
 * Bắt đầu đếm ngược thời gian
 */
function startTimer() {
  timer = setInterval(async () => {
    totalTime--;
    if(quizId != null){
      id = quizId;
    }

    try {
        // Lấy dữ liệu quiz từ IndexedDB
        const q = await getQuizById(id);

        // Cập nhật trường time vào IndexedDB
        await updateQuizTime(id, totalTime);

        console.log("⏳ Đã cập nhật thời gian:", totalTime);
    } catch (error) {
        console.error("❌ Lỗi khi cập nhật thời gian:", error);
    }

    // Cập nhật giao diện hiển thị thời gian
    const timerDisplay = document.querySelector(".timer-display");
    if (timerDisplay) {
        updateTimerDisplay(timerDisplay);
    }

    // Hết thời gian thì dừng timer và nộp bài
    if (totalTime <= 0) {
        clearInterval(timer);
        submitQuiz(questions);
    }
}, 1000);

}

/**
 * Cập nhật hiển thị thời gian
 * @param {HTMLElement} timerDisplay - Element hiển thị thời gian
 */
function updateTimerDisplay(timerDisplay) {
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  timerDisplay.textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

async function submitQuiz(score, timeSubmit, timeSpent) {
  clearInterval(timer);
  timer = null;
  if(quizId != null){
    await submitQuizResult(parseInt(quizId, 10), score, timeSubmit, timeSpent);
    localStorage.setItem("quizId", quizId);
  }else{
    await submitQuizResult(id, score, timeSubmit, timeSpent);
    localStorage.setItem("quizId", id);
  }
  
  window.location.href = 'congratulations.html';
}

function calculateScore(questions) {
    let correctCount = 0;
    userAnswers.forEach((answer, index) => {
        if (answer && answer.toUpperCase() === questions[index].correctAnswer.toUpperCase()) {
            correctCount++;
        }
    });
    // Convert to 10-point scale
    const score = (correctCount / questions.length) * 10;
    // Round to 2 decimal places
    return Math.round(score * 100) / 100;
}
