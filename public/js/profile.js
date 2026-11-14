// Load profile
async function loadProfile() {
    try {
        const response = await fetch("/auth/currentUser");
        const data = await response.json();

        if (!data.loggedIn) {
            window.location.href = "login.html";
            return;
        }

        document.getElementById("username").textContent = data.username;
        document.getElementById("bigUsername").textContent = data.username;

        document.getElementById("email").textContent = data.email;
        document.getElementById("bigEmail").textContent = data.email;

        document.getElementById("favouriteCount").textContent = data.favouriteCount;
        document.getElementById("routeCount").textContent = data.routeCount;
        document.getElementById("reviewCount").textContent = data.reviewCount;


        // =========================
        // Load saved profile picture
        // =========================

        if (data.profileImage) {

            profileImage.src = data.profileImage;
            profileImage.style.display = "block";
            defaultAvatar.style.display = "none";

        } else {

            profileImage.style.display = "none";
            defaultAvatar.style.display = "block";

        }

    } catch (err) {
        console.error("Profile load error:", err);
    }
}

loadProfile();

// Profile Picture Upload

const profilePicture = document.getElementById("profilePicture");
const profileImage = document.getElementById("profileImage");
const defaultAvatar = document.getElementById("defaultAvatar");
const uploadAvatar = document.getElementById("uploadAvatar");

profilePicture.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    // Make sure it is an image
    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {

        profileImage.src = e.target.result;

        profileImage.style.display = "block";
        defaultAvatar.style.display = "none";
    };

    reader.readAsDataURL(file);
});


// Edit profile
const editBtn = document.querySelector(".edit-btn");

let isEditing = false;

editBtn.addEventListener("click", async () => {

    const usernameSpan = document.getElementById("username");

    const bigUsername = document.getElementById("bigUsername");

    // Edit mode
    if (!isEditing) {

        const currentUsername = usernameSpan.innerText;

        // Show camera button
        uploadAvatar.style.display = "flex";

        usernameSpan.innerHTML = `
            <input type="text"
                   id="editUsername"
                   value="${currentUsername}"
                   class="edit-input">
        `;

        editBtn.innerText = "Save";

        isEditing = true;
    }

    // Save mode
    else {

        const newUsername =
            document.getElementById("editUsername").value;


        try {

            // =========================
            // Prepare FormData
            // =========================

            const formData = new FormData();

            formData.append("username", newUsername);


            // Add profile picture if user selected one
            if (profilePicture.files[0]) {
                formData.append(
                    "profileImage",
                    profilePicture.files[0]
                );
            }

            // =========================
            // Update profile
            // =========================
            const response = await fetch("/profile/updateProfile", {
                method: "PUT",
                body: formData
            });

            const data = await response.json();

            // =========================
            // Success
            // =========================
            if (data.success) {

                usernameSpan.textContent = newUsername;

                bigUsername.textContent = newUsername;

                // Hide camera button
                uploadAvatar.style.display = "none";

                editBtn.innerText = "Edit Profile";

                isEditing = false;

                setTimeout(() => {
                    alert("Profile updated!");
                }, 50);

                // Refresh automatically
                window.dispatchEvent(new Event("userUpdated"));

            } else {

                alert(data.message);

            }

        } catch (err) {

            console.error(err);
            alert("Update failed");

        }

    }

});