const apiKey = "AIzaSyChs02VvwUeRB0eoh_bf5auW0HbwH2FMco";
const generateButton = document.getElementById("generateButton");
const topicInput = document.getElementById("topicInput");
const quizOutput = document.getElementById("quizOutput");

generateButton.addEventListener("click", async () => {
  const topic = topicInput.value;
  const questionCount = document.getElementById("questionCount").value;
  quizOutput.innerHTML = `<div>Chủ đề: ${topic}</div>`;

  // Gửi yêu cầu đến API Gemini
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
            parts: [
              {
                text: `Generate a multiple-choice quiz on the topic: ${topic} with ${questionCount} questions.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "text/plain",
        },
      }),
    }
  );

  const data = await response.json();
  console.log(data); // In ra toàn bộ phản hồi

  // Trích xuất nội dung từ phản hồi
  const quizContent = data.candidates[0]?.content?.parts[0]?.text || 'No response';
  quizOutput.innerHTML += `<div>Quiz: ${quizContent}</div>`;

  // Parse and display questions
  const questions = parseQuizContent(quizContent);
  displayQuestions(questions);
});

// Function to parse quiz content into questions and options
function parseQuizContent(content) {
  // Implement parsing logic based on API response structure
  return []; // Return an array of question objects
}

// Function to display questions
function displayQuestions(questions) {
  const quizQuestionsDiv = document.getElementById("quizQuestions");
  quizQuestionsDiv.innerHTML = ""; // Clear previous questions
  questions.forEach((question, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.innerHTML = `<strong>Question ${index + 1}:</strong> ${question.text}`;
    // Add options
    question.options.forEach((option, i) => {
      const optionDiv = document.createElement("div");
      optionDiv.innerHTML = `<input type="radio" name="question${index}" value="${option}"> ${option}`;
      questionDiv.appendChild(optionDiv);
    });
    quizQuestionsDiv.appendChild(questionDiv);
  });
} 