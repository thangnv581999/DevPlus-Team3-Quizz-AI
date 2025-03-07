document.addEventListener("DOMContentLoaded", async () => {
    // Đảm bảo tất cả user được logout trước khi đăng nhập


    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value.trim();

        if (!username) {
            alert("Vui lòng nhập Username");
            return;
        }

        try {
            let existingUser = await getUser(username);
            if (!existingUser) {
                // Nếu user chưa tồn tại, tạo mới với isLoggedIn = true
                await addUser(username);
                console.log("User added with isLoggedIn = true");
            } else {
                // Nếu user đã tồn tại, cập nhật isLoggedIn = true
                existingUser.isLoggedIn = true;
                existingUser.loginTime = new Date().toISOString();
                await updateUser(existingUser);
                console.log("User updated: set isLoggedIn = true");
            }
            // Chuyển hướng sang trang home
            window.location.href = "home.html";
        } catch (error) {
            console.error("Error during login:", error);
        }
    });
});
