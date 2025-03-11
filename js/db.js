
const dbName = "UserDatabase";
const userStore = "Users";
const quizStore = "Quizzes";

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 2);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log("Upgrading database...");

            if (!db.objectStoreNames.contains(userStore)) {
                const objectStore = db.createObjectStore(userStore, { keyPath: "id" });
                objectStore.createIndex("isLoggedIn", "isLoggedIn", { unique: false });
            }

            if (!db.objectStoreNames.contains(quizStore)) {
                const quizObjectStore = db.createObjectStore(quizStore, { keyPath: "id", autoIncrement: true });
                quizObjectStore.createIndex("username", "username", { unique: false });
                quizObjectStore.createIndex("isSubmit", "isSubmit", { unique: false });
                quizObjectStore.createIndex("score", "score", { unique: false });
            }
        };

        request.onsuccess = (event) => {
            console.log("Database opened successfully.");
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            console.error("Database error:", event.target.error);
            reject("Database error: " + event.target.error);
        };
    });
}


async function getLoggedInUserManual() {
    const users = await getAllUsers();
    console.log("All users:", users);
    return users.find(u => u.isLoggedIn === true);
}


async function addUser(username) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(userStore, "readwrite");
        const store = transaction.objectStore(userStore);
        // Thêm thuộc tính isLoggedIn: true để đánh dấu user đang đăng nhập
        const userData = {
            id: username,
            username: username,
            isLoggedIn: true,
            loginTime: new Date().toISOString()
        };
        const request = store.add(userData);
        request.onsuccess = () => resolve("User added successfully!");
        request.onerror = (e) => reject("Error adding user: " + e.target.error);
    });
}

async function updateUser(userData) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(userStore, "readwrite");
        const store = transaction.objectStore(userStore);
        const request = store.put(userData);
        request.onsuccess = () => resolve("User updated successfully!");
        request.onerror = (e) => reject("Error updating user: " + e.target.error);
    });
}

async function getAllUsers() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(userStore, "readonly");
        const store = transaction.objectStore(userStore);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error fetching users");
    });
}

async function logoutAllUsers() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(userStore, "readwrite");
        const store = transaction.objectStore(userStore);
        const request = store.getAll();

        request.onsuccess = () => {
            const users = request.result;
            users.forEach(user => {
                if (user.isLoggedIn) {
                    user.isLoggedIn = false;
                    store.put(user);
                }
            });
            transaction.oncomplete = () => resolve("All users logged out");
        };

        request.onerror = () => reject("Error logging out users");
    });
}


async function getUser(username) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(userStore, "readonly");
        const store = transaction.objectStore(userStore);
        const request = store.get(username);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error fetching user.");
    });
}

// Quizz Functions

function addQuiz(quizData) {
    return new Promise((resolve, reject) => {
        openDatabase().then(db => {
            const transaction = db.transaction([quizStore], "readwrite");
            const quizObjectStore = transaction.objectStore(quizStore);

            const request = quizObjectStore.add(quizData); // Hoặc .put nếu bạn muốn cập nhật dữ liệu quiz khi cần

            request.onsuccess = () => {
                console.log("Quiz data added successfully!");
                resolve(request.result); // Trả về ID của quiz vừa thêm vào
            };

            request.onerror = (event) => {
                console.error("Error adding quiz:", event.target.error);
                reject("Error adding quiz: " + event.target.error);
            };

            transaction.oncomplete = () => {
                console.log("Transaction completed!");
            };

            transaction.onerror = (event) => {
                console.error("Transaction error:", event.target.error);
                reject("Transaction error: " + event.target.error);
            };
        }).catch(err => {
            console.error("Database error:", err);
            reject(err);
        });
    });
}

function formatQuizData(tittle, username, questions, answers, correctAnswers) {
    // Kiểm tra các tham số đầu vào
    if (!username || !Array.isArray(questions) || !Array.isArray(answers) || !Array.isArray(correctAnswers)) {
        throw new Error("Invalid input data");
    }

    // Tạo đối tượng quiz theo định dạng yêu cầu
    const quizData = {
        username: username,  // Người dùng đăng nhập
        tittle: tittle,
        questions: questions, // Mảng câu hỏi
        answers: answers,     // Mảng đáp án (các mảng con cho mỗi câu hỏi)
        correctAnswers: correctAnswers,   // Mảng đáp án đúng, sẽ cập nhật sau
        userSelections: [],   // Mảng lựa chọn của người dùng, sẽ cập nhật sau
        score: null,
        time: null,           // Điểm, sẽ được tính sau
        startTime: new Date().toISOString(),  // Thời gian bắt đầu
        submitTime: null,      // Thời gian submit, sẽ cập nhật khi người dùng nộp bài
        isSubmit: false        // Đánh dấu trạng thái submit
    };

    // Lặp qua mỗi câu hỏi để chuẩn bị dữ liệu cho correctAnswers và userSelections
    for (let i = 0; i < questions.length; i++) {
        // Đảm bảo mảng đáp án cho mỗi câu hỏi có đủ 4 lựa chọn
        if (Array.isArray(answers[i]) && answers[i].length === 4) {
            quizData.correctAnswers.push(""); // Bạn có thể thêm logic để xác định đáp án đúng
            quizData.userSelections.push(""); // Để trống, người dùng sẽ chọn
        } else {
            throw new Error("Each question must have exactly 4 answer choices.");
        }
    }

    return quizData;
}

function deleteQuiz(quizId) {
    return new Promise((resolve, reject) => {
        openDatabase().then(db => {
            const transaction = db.transaction([quizStore], "readwrite");
            const quizObjectStore = transaction.objectStore(quizStore);

            const request = quizObjectStore.delete(quizId); // Xóa quiz theo ID

            request.onsuccess = () => {
                console.log(`Quiz with ID ${quizId} deleted successfully!`);
                resolve(`Quiz with ID ${quizId} deleted successfully.`);
            };

            request.onerror = (event) => {
                console.error("Error deleting quiz:", event.target.error);
                reject("Error deleting quiz: " + event.target.error);
            };

            transaction.oncomplete = () => {
                console.log("Transaction completed!");
            };

            transaction.onerror = (event) => {
                console.error("Transaction error:", event.target.error);
                reject("Transaction error: " + event.target.error);
            };
        }).catch(err => {
            console.error("Database error:", err);
            reject(err);
        });
    });
}

function replaceUserSelections(quizId, newSelections) {
    return new Promise((resolve, reject) => {
        openDatabase().then(db => {
            const transaction = db.transaction([quizStore], "readwrite");
            const quizObjectStore = transaction.objectStore(quizStore);

            // Lấy quiz theo ID
            const request = quizObjectStore.get(quizId);

            request.onsuccess = (event) => {
                const quiz = event.target.result;
                
                if (!quiz) {
                    reject("Quiz not found.");
                    return;
                }

                // Kiểm tra và thay thế toàn bộ mảng userSelections
                if (Array.isArray(newSelections)) {
                    quiz.userSelections = newSelections;

                    // Cập nhật quiz vào cơ sở dữ liệu
                    const updateRequest = quizObjectStore.put(quiz);

                    updateRequest.onsuccess = () => {
                        console.log("User selections updated.");
                        resolve("User selections updated.");
                    };

                    updateRequest.onerror = (event) => {
                        console.error("Error updating quiz:", event.target.error);
                        reject("Error updating quiz: " + event.target.error);
                    };
                } else {
                    reject("Invalid selections array.");
                }
            };

            request.onerror = (event) => {
                console.error("Error retrieving quiz:", event.target.error);
                reject("Error retrieving quiz: " + event.target.error);
            };

            transaction.oncomplete = () => {
                console.log("Transaction completed!");
            };

            transaction.onerror = (event) => {
                console.error("Transaction error:", event.target.error);
                reject("Transaction error: " + event.target.error);
            };
        }).catch(err => {
            console.error("Database error:", err);
            reject(err);
        });
    });
}

function submitQuizResult(quizId, score, timeSubmit, timeSpent) {
    return new Promise((resolve, reject) => {
        openDatabase().then(db => {
            const transaction = db.transaction([quizStore], "readwrite");
            const quizObjectStore = transaction.objectStore(quizStore);

            // Lấy quiz theo ID
            const request = quizObjectStore.get(quizId);

            request.onsuccess = (event) => {
                const quiz = event.target.result;
                
                if (!quiz) {
                    reject("Quiz not found.");
                    return;
                }

                // Cập nhật điểm (score), thời gian submit (timeSubmit), thời gian làm bài (timeSpent) và set isSubmit = true
                quiz.score = score;
                quiz.timeSubmit = timeSubmit;
                quiz.timeSpent = timeSpent;
                quiz.isSubmit = true; // Set isSubmit = true

                // Cập nhật quiz vào cơ sở dữ liệu mà không thay thế các dữ liệu khác
                const updateRequest = quizObjectStore.put(quiz);

                updateRequest.onsuccess = () => {
                    console.log("Quiz progress updated with isSubmit set to true.");
                    resolve("Quiz progress updated with isSubmit set to true.");
                };

                updateRequest.onerror = (event) => {
                    console.error("Error updating quiz:", event.target.error);
                    reject("Error updating quiz: " + event.target.error);
                };
            };

            request.onerror = (event) => {
                console.error("Error retrieving quiz:", event.target.error);
                reject("Error retrieving quiz: " + event.target.error);
            };

            transaction.oncomplete = () => {
                console.log("Transaction completed!");
            };

            transaction.onerror = (event) => {
                console.error("Transaction error:", event.target.error);
                reject("Transaction error: " + event.target.error);
            };
        }).catch(err => {
            console.error("Database error:", err);
            reject(err);
        });
    });
}

async function getQuizById(quizId) {
    return new Promise((resolve, reject) => {
        openDatabase()
            .then((db) => {
                const transaction = db.transaction(quizStore, "readonly");
                const store = transaction.objectStore(quizStore);
                const request = store.get(Number(quizId)); // Đảm bảo quizId là số

                request.onsuccess = () => {
                    if (request.result) {
                        console.log("✅ Tìm thấy quiz:", request.result);
                        resolve(request.result);
                    } else {
                        console.error("❌ Không tìm thấy quiz với ID:", quizId);
                        reject(new Error(`Không tìm thấy quiz với ID: ${quizId}`));
                    }
                };

                request.onerror = () => {
                    console.error("❌ Lỗi truy vấn IndexedDB:", request.error);
                    reject(request.error);
                };
            })
            .catch((error) => {
                console.error("❌ Lỗi mở database:", error);
                reject(error);
            });
    });
}

async function updateQuizTime(quizId, time) {
    return new Promise((resolve, reject) => {
        openDatabase().then((db) => {
            const transaction = db.transaction(quizStore, "readwrite");
            const store = transaction.objectStore(quizStore);

            // Lấy dữ liệu quiz hiện tại
            const request = store.get(Number(quizId));

            request.onsuccess = () => {
                if (!request.result) {
                    return reject(new Error(`❌ Không tìm thấy quiz với ID: ${quizId}`));
                }

                const quizData = request.result;
                quizData.time = time; // Cập nhật thời gian mới

                // Lưu lại dữ liệu đã cập nhật
                const updateRequest = store.put(quizData);

                updateRequest.onsuccess = () => {
                    resolve(`✅ Đã cập nhật thời gian cho quiz ${quizId}: ${time}`);
                };

                updateRequest.onerror = () => {
                    reject(new Error("❌ Lỗi khi cập nhật thời gian vào IndexedDB"));
                };
            };

            request.onerror = () => {
                reject(new Error("❌ Lỗi khi lấy dữ liệu quiz"));
            };
        }).catch(reject);
    });
}





