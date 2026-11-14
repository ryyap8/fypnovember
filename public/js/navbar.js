async function loadNavbar() {

    try {

        const response = await fetch("/auth/currentUser");
        const data = await response.json();

        const navCenter = document.getElementById("navCenter");
        const navRight = document.getElementById("navRight");
        const contactAdminButton = document.getElementById("contactAdminButton");


        // =======================
        // NORMAL USER LOGIN
        // =======================
        if (data.loggedIn && data.role === "user") {

            if (contactAdminButton) {
                contactAdminButton.style.display = "flex";
            }

            navCenter.innerHTML = `
                <a href="index.html" data-page="index.html">
                    <i class="fa-solid fa-bowl-food"></i>
                    Discover Foods
                </a>

                <a href="favourite.html" data-page="favourite.html">
                    <i class="fa-solid fa-heart"></i>
                    Favourites
                </a>

                <a href="routes.html" data-page="routes.html">
                    <i class="fa-solid fa-route"></i>
                    Routes
                </a>

                <a href="analytics.html" data-page="analytics.html">
                    <i class="fa-solid fa-chart-line"></i>
                    Analytics
                </a>
            `;


            const navbarAvatar = data.profileImage
                ? `<img src="${data.profileImage}" class="navbar-profile-image">`
                : `<i class="fa-solid fa-user navbar-user-icon"></i>`;

            navRight.innerHTML = `
                <a href="profile.html" class="profile-link">
                    ${navbarAvatar}
                    ${data.username}
                </a>

                <button id="logoutBtn">
                    Logout
                </button>
            `;

        }


        // =======================
        // NOT LOGGED IN
        // =======================
        else {

            if (contactAdminButton) {
                contactAdminButton.style.display = "none";
            }


            navCenter.innerHTML = `
                <a href="index.html">
                    <i class="fa-solid fa-bowl-food"></i>
                    Discover Foods
                </a>
            `;


            navRight.innerHTML = `
                <a href="login.html">
                    Login
                </a>

                <button onclick="window.location.href='register.html'">
                    Register
                </button>
            `;

        }


        // =======================
        // ACTIVE NAVIGATION TAB
        // =======================
        const currentPage = window.location.pathname.split("/").pop() || "index.html";

        const navLinks = navCenter.querySelectorAll("a[data-page]");

        navLinks.forEach(link => {

            if (link.dataset.page === currentPage) {
                link.classList.add("active");
            }

        });


        // =======================
        // LOGOUT
        // =======================
        const logoutBtn = document.getElementById("logoutBtn");


        if (logoutBtn) {

            logoutBtn.addEventListener("click", async () => {

                try {

                    const res = await fetch("/auth/logout");
                    const result = await res.json();


                    if (result.success) {

                        alert(result.message || "Logout successful");

                        window.location.replace("index.html");

                    }

                } catch (error) {

                    console.error("Logout error:", error);

                }

            });

        }


    } catch (error) {

        console.error("Navbar error:", error);

    }

}


loadNavbar();


window.addEventListener("userUpdated", () => {
    loadNavbar();
});


const contactAdminButton = document.getElementById("contactAdminButton");
const contactSupportPanel = document.getElementById("contactSupportPanel");
const closeSupportPanel = document.getElementById("closeSupportPanel");

if (contactAdminButton && contactSupportPanel) {
    contactAdminButton.addEventListener("click", () => {
        const isHidden =
            getComputedStyle(contactSupportPanel).display === "none";

        contactSupportPanel.style.display = isHidden ? "block" : "none";

        if (isHidden) {
            loadMySupportRequests();
        }
    });
}

if (closeSupportPanel && contactSupportPanel) {
    closeSupportPanel.addEventListener("click", () => {
        contactSupportPanel.style.display = "none";
    });
}


/* ===============================
   SUBMIT SUPPORT REQUEST
================================ */

const supportRequestForm = document.getElementById("supportRequestForm");
const supportFormMessage = document.getElementById("supportFormMessage");

if (supportRequestForm) {
    supportRequestForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const category = document.getElementById("supportCategory").value;
        const subject = document.getElementById("supportSubject").value.trim();
        const description = document.getElementById("supportDescription").value.trim();

        if (!category || !subject || !description) {
            supportFormMessage.textContent = "Please complete all required fields.";
            supportFormMessage.style.color = "#d9534f";
            return;
        }

        const submitButton = supportRequestForm.querySelector(
            ".support-submit-btn"
        );

        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        try {
            const response = await fetch("/support", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    category,
                    subject,
                    description
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                supportFormMessage.textContent =
                    data.message || "Failed to submit support request.";
                supportFormMessage.style.color = "#d9534f";
                return;
            }

            supportFormMessage.textContent =
                "Your support request has been submitted successfully!";
            supportFormMessage.style.color = "#198754";

            supportRequestForm.reset();
            loadMySupportRequests();

        } catch (error) {
            console.error("Submit support request error:", error);
            supportFormMessage.textContent =
                "Unable to submit your request. Please try again.";
            supportFormMessage.style.color = "#d9534f";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Submit Request";
        }
    });
}

let expandedMySupportRequestId = null;

async function loadMySupportRequests() {
    const container = document.getElementById("mySupportRequestsContainer");

    if (!container) return;

    container.innerHTML = "<p>Loading your requests...</p>";

    try {
        const response = await fetch("/support/my-requests");
        const data = await response.json();

        if (!response.ok || !data.success) {
            container.textContent = "Unable to load your support requests.";
            return;
        }

        const requests = data.requests || [];
        container.innerHTML = "";

        if (requests.length === 0) {
            container.textContent = "You have not submitted any support requests yet.";
            return;
        }

        requests.forEach(request => {
            const card = document.createElement("div");
            card.className = "my-support-card";

            // Subject
            const subject = document.createElement("h4");
            subject.textContent = request.subject || "(No subject)";

            // Status badge
            const status = document.createElement("span");
            const currentStatus = request.status || "Pending";

            status.className =
                "my-support-status status-" +
                currentStatus.toLowerCase().replace(/\s+/g, "-");

            status.textContent = currentStatus;

            const statusRow = document.createElement("div");
            statusRow.className = "my-support-status-row";
            statusRow.appendChild(status);

            // Category
            const category = document.createElement("p");
            category.textContent = `Category: ${request.category || "-"}`;

            // Date
            const date = document.createElement("p");
            date.className = "my-support-date";
            date.textContent = request.createdAt
                ? new Date(request.createdAt).toLocaleString("en-MY", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                })
                : "-";

            // Original issue
            const issueLabel = document.createElement("strong");
            issueLabel.textContent = "Your message:";

            const issue = document.createElement("p");
            issue.className = "my-support-description";
            issue.textContent = request.description || "-";

            // Conversation section (hidden by default)
            const conversationSection = document.createElement("div");
            conversationSection.className = "my-support-conversation-section";
            conversationSection.style.display = "none";

            const conversation = document.createElement("div");
            conversation.className = "my-support-conversation";

            const conversationTitle = document.createElement("strong");
            conversationTitle.textContent = "Conversation";
            conversation.appendChild(conversationTitle);

            const messages = [...(request.messages || [])];

            // Support older requests that only have adminReply
            if (messages.length === 0 && request.adminReply) {
                messages.push({
                    senderRole: "admin",
                    message: request.adminReply,
                    createdAt: request.updatedAt
                });
            }

            if (messages.length === 0) {
                const emptyMessage = document.createElement("p");
                emptyMessage.className = "my-support-no-reply";
                emptyMessage.textContent = "Awaiting reply from admin.";
                conversation.appendChild(emptyMessage);
            }

            messages.forEach(msg => {
                const bubble = document.createElement("div");

                bubble.className =
                    "my-support-message " +
                    (msg.senderRole === "admin"
                        ? "my-support-message-admin"
                        : "my-support-message-user");

                const sender = document.createElement("strong");

                sender.textContent =
                    msg.senderRole === "admin"
                        ? "Admin"
                        : msg.senderRole === "restaurant"
                            ? "Restaurant"
                            : "You";

                const messageText = document.createElement("p");
                messageText.textContent = msg.message || "";

                const time = document.createElement("small");
                time.textContent = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleString("en-MY", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                    })
                    : "";

                bubble.appendChild(sender);
                bubble.appendChild(messageText);
                bubble.appendChild(time);
                conversation.appendChild(bubble);
            });

            // Reply input
            const replyInput = document.createElement("textarea");
            replyInput.rows = 2;
            replyInput.maxLength = 3000;
            replyInput.placeholder = "Write a reply...";
            replyInput.setAttribute("aria-label", "Write a reply");

            // Send reply button
            const replyButton = document.createElement("button");
            replyButton.type = "button";
            replyButton.className = "my-support-reply-btn";
            replyButton.textContent = "Send Reply";

            const feedback = document.createElement("p");
            feedback.className = "my-support-reply-feedback";

            replyButton.addEventListener("click", async () => {
                const message = replyInput.value.trim();

                if (!message) {
                    feedback.textContent = "Please enter a message.";
                    return;
                }

                replyButton.disabled = true;
                feedback.textContent = "Sending...";

                try {
                    const replyResponse = await fetch(
                        `/support/${request._id}/messages`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ message })
                        }
                    );

                    const replyData = await replyResponse.json();

                    if (!replyResponse.ok || !replyData.success) {
                        feedback.textContent =
                            replyData.message || "Unable to send your reply.";
                        return;
                    }

                    await loadMySupportRequests();

                } catch (error) {
                    console.error("Send support reply error:", error);
                    feedback.textContent =
                        "Unable to send your reply. Please try again.";
                } finally {
                    replyButton.disabled = false;
                }
            });

            // Put conversation and reply controls inside the collapsible section
            conversationSection.appendChild(conversation);
            conversationSection.appendChild(replyInput);
            conversationSection.appendChild(replyButton);
            conversationSection.appendChild(feedback);

            // Show Conversation toggle
            const toggleButton = document.createElement("button");
            toggleButton.type = "button";
            toggleButton.className = "my-support-toggle-btn";
            toggleButton.textContent = "Show Conversation";
            toggleButton.setAttribute("aria-expanded", "false");

            
            toggleButton.addEventListener("click", () => {
                const isHidden =
                    conversationSection.style.display === "none";

                conversationSection.style.display =
                    isHidden ? "block" : "none";

                toggleButton.textContent =
                    isHidden ? "Close Conversation" : "Show Conversation";

                toggleButton.setAttribute(
                    "aria-expanded",
                    String(isHidden)
                );

                expandedMySupportRequestId = isHidden
                    ? String(request._id)
                    : null;
            });

            // Restore this conversation if it was expanded before reloading
            if (String(request._id) === expandedMySupportRequestId) {
                conversationSection.style.display = "block";
                toggleButton.textContent = "Close Conversation";
                toggleButton.setAttribute("aria-expanded", "true");
            }


            // Assemble card
            card.appendChild(subject);
            card.appendChild(statusRow);
            card.appendChild(category);
            card.appendChild(date);
            card.appendChild(issueLabel);
            card.appendChild(issue);
            card.appendChild(toggleButton);
            card.appendChild(conversationSection);

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Load support requests error:", error);
        container.textContent =
            "Unable to load your support requests. Please try again.";
    }
}

