document.addEventListener("DOMContentLoaded", () => {

    // =======================
    // REGISTER
    // =======================
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            if (!registerForm.checkValidity()) {
                registerForm.reportValidity();
                return;
            }

            const username =
                document.getElementById("username").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;

            const confirmPassword =
                document.getElementById("confirm-password").value;

            const role =
                document.getElementById("role").value;

            const restaurantName =
                document.getElementById("restaurantName")
                ?.value.trim() || "";


            // =======================
            // VALIDATION
            // =======================

            if (password !== confirmPassword) {

                alert("Passwords do not match.");
                return;

            }


            if (role === "restaurant" && !restaurantName) {

                alert("Please enter your restaurant name.");
                return;

            }


            // =======================
            // REGISTER BUTTON
            // =======================

            const registerButton =
                registerForm.querySelector(
                    "button[type='submit']"
                );


            try {

                // Show loading state
                registerButton.disabled = true;
                registerButton.textContent = "Registering...";


                let bodyData;
                const headers = {};


                // =======================
                // RESTAURANT
                // =======================

                if (role === "restaurant") {

                    bodyData = new FormData();

                    bodyData.append("username", "");
                    bodyData.append("email", email);
                    bodyData.append("password", password);
                    bodyData.append("role", role);
                    bodyData.append(
                        "restaurantName",
                        restaurantName
                    );


                    const branch =
                        document.getElementById("branch")
                        ?.value.trim() || "";

                    const address =
                        document.getElementById("address")
                        ?.value.trim() || "";

                    const ssmNumber =
                        document.getElementById("ssmNumber")
                        ?.value.trim() || "";


                    bodyData.append(
                        "branch",
                        branch
                    );

                    bodyData.append(
                        "address",
                        address
                    );

                    bodyData.append(
                        "ssmNumber",
                        ssmNumber
                    );


                    // SSM FILE
                    const ssmFile =
                        document.getElementById("ssmFile");


                    if (
                        ssmFile &&
                        ssmFile.files.length > 0
                    ) {

                        bodyData.append(
                            "ssmFile",
                            ssmFile.files[0]
                        );

                    }

                }


                // =======================
                // NORMAL USER
                // =======================

                else {

                    headers["Content-Type"] =
                        "application/json";


                    bodyData = JSON.stringify({

                        username,
                        email,
                        password,
                        role

                    });

                }


                // =======================
                // SEND REGISTER REQUEST
                // =======================

                const response = await fetch(
                    "/auth/register",
                    {
                        method: "POST",
                        headers: headers,
                        body: bodyData
                    }
                );


                const data =
                    await response.json();


                // =======================
                // SUCCESS
                // =======================

                if (data.success) {

                    alert(
                        data.message ||
                        "Registered successfully."
                    );

                    window.location.href =
                        "login.html";

                }


                // =======================
                // FAILED
                // =======================

                else {

                    alert(
                        data.message ||
                        "Registration failed."
                    );

                }


            }
            catch (err) {

                console.error(
                    "Registration error:",
                    err
                );

                alert(
                    "Registration failed. Please try again."
                );

            }


            // =======================
            // RESET BUTTON
            // =======================

            finally {

                registerButton.disabled = false;

                registerButton.textContent =
                    "Register";

            }

        });

    }

    // =======================
    // LOGIN
    // =======================
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = loginForm.querySelector("#email").value;
            const password = loginForm.querySelector("#password").value;

            const res = await fetch("/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.success) {

                if (data.role === "restaurant") {

                    if (data.restaurantStatus === "pending") {
                        alert("Your account is pending approval. Your application will be reviewed within 3 working days. Thank you for your patience.");
                        return;
                    }

                    if (data.restaurantStatus === "rejected") {
                        alert("Your application was rejected.");
                        return;
                    }

                    window.location.href = "restaurant.html";
                }

                else if (data.role === "admin") {
                    window.location.href = "admin.html";
                }

                else {
                    window.location.href = "index.html";
                }

            } else {
                alert(data.message);
            }
        });
    }

    // =======================
    // BRANCH TOGGLE (COMBINED HERE)
    // =======================
    const yes = document.getElementById("branchYes");
    const no = document.getElementById("branchNo");
    const branchField = document.getElementById("branchField");
    const branchInput = document.getElementById("branch");

    if (yes && no && branchField) {

        function toggleBranch() {
            if (yes.checked) {
                branchField.style.display = "block";
            } else {
                branchField.style.display = "none";
                if (branchInput) branchInput.value = "";
            }
        }

        yes.addEventListener("change", toggleBranch);
        no.addEventListener("change", toggleBranch);

        // IMPORTANT: sync on load
        toggleBranch();
    }

});