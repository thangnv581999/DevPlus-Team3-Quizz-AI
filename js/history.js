// Hàm để lấy tất cả quiz từ IndexedDB
async function getAllQuizzes() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("Quizzes", "readonly");
        const store = transaction.objectStore("Quizzes");
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error fetching quizzes");
    });
}

// Hàm để xóa quiz theo ID
async function deleteQuizHistory(quizId) {
    try {
        await deleteQuiz(quizId);
        displayQuizHistory(); // Refresh the display after deletion
    } catch (error) {
        console.error("Error deleting quiz:", error);
    }
}

// Hàm format thời gian
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Hàm format ngày tháng
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        // Kiểm tra xem ngày có hợp lệ không
        if (date.toString() === 'Invalid Date' || date.getTime() === 0) {
            return '-';
        }
        
        // Format ngày giờ theo định dạng dd/MM/yyyy HH:mm:ss
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
}

// Hàm hiển thị lịch sử quiz
async function displayQuizHistory() {
    try {
        // Lấy user đang đăng nhập
        const user = await getLoggedInUserManual();
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        
        // Hiển thị tên người dùng
        document.getElementById("username").textContent = user.username;
        
        // Lấy tất cả quiz
        const quizzes = await getAllQuizzes();
        const userQuizzes = quizzes.filter(quiz => quiz.username === user.username);
        
        // Phân loại quiz thành complete và incomplete
        const completeQuizzes = userQuizzes.filter(quiz => quiz.isSubmit);
        const incompleteQuizzes = userQuizzes.filter(quiz => !quiz.isSubmit);
        
        // Hiển thị quiz chưa hoàn thành
        const incompleteContainer = document.getElementById("incomplete-container");
        incompleteContainer.innerHTML = incompleteQuizzes.map(quiz => `
            <ul class="w-full flex flex-wrap text-[6px] sm:text-[8px] lg:text-xs xl:text-sm 2xl:text-base">
                <li class="w-1/4 break-all line-clamp-1 my-2 px-2" title="${quiz.questions[0]}">${quiz.questions[0]}</li>
                <li class="w-[11%] text-center break-all line-clamp-1 my-2 px-2">-</li>
                <li class="w-[9%] text-center break-all line-clamp-1 my-2 px-2">-</li>
                <li class="w-[9%] text-center break-all line-clamp-1 my-2 px-2">-</li>
                <li class="w-[9%] text-center break-all line-clamp-1 my-2 px-2">${quiz.questions.length}</li>
                <li class="w-1/5 break-all line-clamp-1 my-2 px-2 text-center">
                    <span class="text-gray-500">Not completed</span>
                </li>
                <li class="w-[12.5%] text-center break-all line-clamp-1 my-2 px-2">${formatDate(quiz.startTime)}</li>
                <li class="my-2 px-2">
                    <a href="#" onclick="deleteQuizHistory(${quiz.id}); return false;">
                        <img src="../img/history/trash.png" alt="" title="Delete" class="w-[1.5em] h-[1.5em]">
                    </a>
                </li>
                <li class="my-2 px-2">
                    <a href="home.html?quizId=${quiz.id}">
                        <img src="../img/history/continue.png" alt="" title="Continue" class="w-[1.5em] h-[1.5em]">
                    </a>
                </li>
            </ul>
        `).join('');
        
        // Hiển thị quiz đã hoàn thành
        const completeContainer = document.getElementById("complete-container");
        completeContainer.innerHTML = completeQuizzes.map(quiz => `
            <ul class="w-full flex flex-wrap text-[6px] sm:text-[8px] lg:text-xs xl:text-sm 2xl:text-base">
                <li class="w-1/4 break-all line-clamp-1 my-2 px-2" title="${quiz.questions[0]}">${quiz.questions[0]}</li>
                <li class="w-[11%] text-center break-all line-clamp-1 my-2 px-2">${formatTime(quiz.timeSpent)}</li>
                <li class="w-[9%] text-center break-all line-clamp-1 my-2 px-2">${Math.round(quiz.score * quiz.questions.length / 10)}</li>
                <li class="w-[9%] text-center break-all line-clamp-1 my-2 px-2">${quiz.score.toFixed(1)}</li>
                <li class="w-[9%] text-center break-all line-clamp-1 my-2 px-2">${quiz.questions.length}</li>
                <li class="w-1/5 break-all line-clamp-1 my-2 px-2 text-center">
                    <a href="result.html" onclick="localStorage.setItem('currentQuizId', ${quiz.id})" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
                        View Results
                    </a>
                </li>
                <li class="w-[12.5%] text-center break-all line-clamp-1 my-2 px-2">
                    ${quiz.submitTime ? formatDate(quiz.submitTime) : formatDate(quiz.startTime)}
                </li>
                <li class="my-2 px-2">
                    <a href="#" onclick="deleteQuizHistory(${quiz.id}); return false;">
                        <img src="../img/history/trash.png" alt="" title="Delete" class="w-[1.5em] h-[1.5em]">
                    </a>
                </li>
                <li class="my-2 px-2">
                    <a href="review.html?quizId=${quiz.id}">
                        <img src="../img/history/review.png" alt="" title="Review" class="w-[1.5em] h-[1.5em]">
                    </a>
                </li>
            </ul>
        `).join('');

    } catch (error) {
        console.error("Error displaying quiz history:", error);
    }
}

// Xử lý đăng xuất
document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
        await logoutAllUsers();
        window.location.href = "login.html";
    } catch (error) {
        console.error("Error logging out:", error);
    }
});

// Khởi tạo khi trang được load
document.addEventListener("DOMContentLoaded", () => {
    displayQuizHistory();
}); 