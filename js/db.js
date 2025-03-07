const dbName = "UserDatabase";
const storeName = "Users";

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log("Upgrading database...");
            if (!db.objectStoreNames.contains(storeName)) {
                const objectStore = db.createObjectStore(storeName, { keyPath: "id" });
                objectStore.createIndex("isLoggedIn", "isLoggedIn", { unique: false });
                console.log("Object store and index created.");
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
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
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
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(userData);
        request.onsuccess = () => resolve("User updated successfully!");
        request.onerror = (e) => reject("Error updating user: " + e.target.error);
    });
}

async function getAllUsers() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error fetching users");
    });
}

async function logoutAllUsers() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
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
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(username);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error fetching user.");
    });
}
