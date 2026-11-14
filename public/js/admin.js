function showSection(section) {

    const sections = [
        "overviewSection",
        "restaurantSection",
        "userSection",
        "restaurantsSection",
        "supportSection"
    ];

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    const sectionMap = {
        overview: "overviewSection",
        restaurant: "restaurantSection",
        users: "userSection",
        restaurants: "restaurantsSection",
        support: "supportSection"
    };

    const targetId = sectionMap[section];
    if (targetId) {
        const el = document.getElementById(targetId);
        if (el) el.style.display = "block";
    }

    if (section === "support") {
        loadSupportRequests();
    }
}


// =======================
// CHART
// =======================
let statusChart;
let supportStatusChart;
let selectedRestaurantId = null;
let restaurantData = [];
let userData = [];
let approvedRestaurantData = [];

function updateChart(data) {

    const ctx = document.getElementById('statusChart');

    if (!ctx) return;

    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Rejected', 'Pending'],
            datasets: [{
                data: [
                    data.approved,
                    data.rejected,
                    data.pending
                ],
                backgroundColor: [
                    '#28a745',
                    '#dc3545',
                    '#ffc107'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 30,
                        boxWidth: 50,
                        font: { size: 14 }
                    }
                }
            }
        }
    });
}



function updateSupportStats(requests) {

    const total = requests.length;

    const pending = requests.filter(
        r => (r.status || "Pending").toLowerCase() === "pending"
    ).length;

    const inProgress = requests.filter(
        r => (r.status || "Pending").toLowerCase() === "in progress"
    ).length;

    const resolved = requests.filter(
        r => (r.status || "Pending").toLowerCase() === "resolved"
    ).length;

    // Update statistic cards
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };

    setText("totalSupportRequests", total);
    setText("pendingSupportRequests", pending);
    setText("inProgressSupportRequests", inProgress);
    setText("resolvedSupportRequests", resolved);

    // Update support status doughnut chart
    const ctx = document.getElementById("supportStatusChart");

    if (!ctx) return;

    if (supportStatusChart) {
        supportStatusChart.destroy();
    }

    supportStatusChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Pending", "In Progress", "Resolved"],
            datasets: [{
                data: [pending, inProgress, resolved],
                backgroundColor: [
                    "#ecb101",
                    "#173ab8",
                    "#18692b"
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 30,
                        boxWidth: 20,
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}


async function refreshSupportStats() {
    try {
        const response = await fetch("/admin/support-requests");
        const data = await response.json();

        if (data.success) {
            updateSupportStats(data.requests || []);
        }
    } catch (error) {
        console.error("Error refreshing support statistics:", error);
    }
}

// =======================
// STATS
// =======================
async function loadStats() {

    try {

        const res = await fetch("/admin/stats");
        const data = await res.json();

        if (!data.success) return;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        };

        setText("totalUsers", data.totalUsers);
        setText("totalApplications", data.totalApplications);
        setText("pendingCount", data.pending);
        setText("approvedCount", data.approved);
        setText("rejectedCount", data.rejected);

        updateChart(data);

    } catch (err) {
        console.error("loadStats error:", err);
    }
}


// =======================
// RESTAURANT LIST
// =======================
async function loadRestaurants() {

    try {

        const res = await fetch("/admin/restaurants");
        const data = await res.json();

        if (!data.success) return;

        restaurantData = data.restaurants;

        restaurantData.sort((a, b) => {

            const aPending = a.restaurantStatus === "pending";
            const bPending = b.restaurantStatus === "pending";

            // Pending always comes first
            if (aPending && !bPending) return -1;
            if (!aPending && bPending) return 1;

            // Same group → newest registration first
            return new Date(b.createdAt) - new Date(a.createdAt);

        });

        displayRestaurants(restaurantData);

    } catch (err) {
        console.error("loadRestaurants error:", err);
    }
}

function displayRestaurants(restaurants) {

    const container = document.querySelector("#restaurantTableBody");

    container.innerHTML = "";

    const countElement = document.getElementById("restaurantApplicationCount");

    if (countElement) {
        countElement.innerText =
            `Total ${restaurants.length} applications found`;
    }


    restaurants.forEach(r => {

        const row = document.createElement("div");
        row.classList.add("table-row");

        row.innerHTML = `
            <div class="date">${new Date(r.createdAt).toLocaleString() || "-"}</div>
            <div class="email">
                ${
                    r.email
                        ? r.email.replace("@", "<br>@")
                        : "-"
                }
            </div>
            <div>${r.restaurantName || "-"}</div>
            <div>${r.branch || "-"}</div>
            <div>${r.address || "-"}</div>

            <div class="ssmNumber">
                ${r.ssmNumber || "-"}
            </div>

            <div class="status-cell">

                <div class="status ${r.restaurantStatus}">
                    ${r.restaurantStatus}
                </div>

                ${
                    r.restaurantStatus === "rejected"
                    ?
                    `
                    <div class="reject-text">
                        <b>Rejected due to:</b><br>
                        ${r.rejectReason || "-"}
                    </div>
                    `
                    :
                    ""
                }

            </div>


            <div>

                <button class="btn view" data-file="${r.ssmDocument || ''}">
                    View SSM Document
                </button>

                ${
                    r.restaurantStatus === "pending"
                    ?
                    `
                    <button class="btn approve" onclick="approve('${r._id}')">
                        Approve
                    </button>

                    <button class="btn reject" onclick="reject('${r._id}')">
                        Reject
                    </button>
                    `
                    :
                    ""
                }

            </div>
        `;


        container.appendChild(row);

    });

}

function filterRestaurants() {

    const keyword = document
        .getElementById("restaurantSearch")
        .value
        .toLowerCase();

    const fromDate = document
        .getElementById("restaurantFromDateFilter")
        .value;

    const toDate = document
        .getElementById("restaurantToDateFilter")
        .value;

    const status = document
        .getElementById("restaurantStatusFilter")
        .value;


    const filtered = restaurantData.filter(r => {

        // =======================
        // KEYWORD SEARCH
        // =======================
        const keywordMatch =
            (r.email || "").toLowerCase().includes(keyword) ||
            (r.restaurantName || "").toLowerCase().includes(keyword) ||
            (r.branch || "").toLowerCase().includes(keyword) ||
            (r.address || "").toLowerCase().includes(keyword) ||
            (r.ssmNumber || "").toLowerCase().includes(keyword);


        // =======================
        // DATE RANGE FILTER
        // =======================
        let dateMatch = true;

        const createdDate = new Date(r.createdAt);

        // From Date
        if (fromDate) {

            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);

            dateMatch = createdDate >= from;
        }

        // To Date
        if (toDate && dateMatch) {

            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);

            dateMatch = createdDate <= to;
        }


        // =======================
        // STATUS FILTER
        // =======================
        let statusMatch = true;

        if (status) {

            statusMatch =
                r.restaurantStatus.toLowerCase() === status.toLowerCase();

        }


        return keywordMatch && dateMatch && statusMatch;

    });


    displayRestaurants(filtered);

}

// =======================
// VIEW SSM (SAFE EVENT)
// =======================
document.addEventListener("click", (e) => {

    if (e.target.classList.contains("view")) {

        const file = e.target.getAttribute("data-file");

        if (!file) {
            alert("No SSM document uploaded");
            return;
        }

        window.open(file, "_blank");
    }
});


// =======================
// APPROVE
// =======================
let approving = false;

async function approve(id) {

    if (approving) return;   // block double call
    approving = true;

    try {

        const res = await fetch(`/admin/approve/${id}`, {
            method: "POST"
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Failed to approve restaurant.");
            return;
        }

        await loadRestaurants();
        await loadApprovedRestaurants();
        await loadStats();

    } catch (err) {
        console.error("Approve error:", err);
        alert("Something went wrong.");
    } finally {
        approving = false; // unlock
    }
}


// =======================
// REJECT
// =======================
function reject(id) {

    selectedRestaurantId = id;

    document.getElementById("rejectModal").style.display = "flex";

}

// =======================
// CLOSE REJECT MODAL
// =======================
function closeRejectModal() {

    document.getElementById("rejectModal").style.display = "none";

    document.getElementById("otherReason").value = "";

    document.querySelectorAll("input[name='rejectReason']").forEach(r => {
        r.checked = false;
    });

    document.getElementById("otherReason").style.display = "none";
}

// =======================
// SHOW OTHER INPUT
// =======================
document.addEventListener("change", function (e) {

    if (e.target.name === "rejectReason") {

        const other = document.getElementById("otherReason");

        if (e.target.value === "Others") {
            other.style.display = "block";
        } else {
            other.style.display = "none";
        }

    }

});

// =======================
// CONFIRM REJECT
// =======================
let processingReject = false;

async function confirmReject() {

    if (processingReject) return;   // block double call
    processingReject = true;

    const selected = document.querySelector("input[name='rejectReason']:checked");

    if (!selected) {
        alert("Please select a reason.");
        processingReject = false;
        return;
    }

    let reason = selected.value;

    if (reason === "Others") {
        reason = document.getElementById("otherReason").value.trim();

        if (reason === "") {
            alert("Please enter the reason.");
            processingReject = false;
            return;
        }
    }

    try {

        const res = await fetch(`/admin/reject/${selectedRestaurantId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ reason })
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Failed to reject restaurant.");
            return;
        }

        closeRejectModal();
        loadRestaurants();
        loadStats();

    } catch (err) {
        console.error(err);
        alert("Something went wrong.");
    } finally {
        processingReject = false; // unlock
    }
}


//Users
async function loadUsers() {

    try {

        const res = await fetch("/admin/users");
        const data = await res.json();

        if (!data.success) return;

        userData = data.users.reverse();

        displayUsers(userData);

    } catch (err) {
        console.error("loadUsers error:", err);
    }
}


// =======================
// DISPLAY USERS
// =======================
function displayUsers(users) {

    const container = document.getElementById("userTableBody");

    if (!container) return;

    container.innerHTML = "";

    const countElement = document.getElementById("userCount");

    if (countElement) {
        countElement.innerText =
            `Total ${users.length} users found`;
    }

    users.forEach(user => {

        const row = document.createElement("div");
        row.classList.add("table-row-user");

        row.innerHTML = `
            <div class="date">${new Date(user.createdAt).toLocaleString() || "-"}</div>
            <div>${user.username || "-"}</div>
            <div>${user.email || "-"}</div>
            <div>
                <button class="btn delete" onclick="deleteUser('${user._id}')">
                    Delete
                </button>
            </div>
        `;

        container.appendChild(row);

    });

}

// =======================
// FILTER USERS
// =======================
function filterUsers() {

    const keyword = document.getElementById("userSearch")
        .value
        .toLowerCase();

    const date = document.getElementById("userDateFilter")
        .value;

    const filteredUsers = userData.filter(user => {

        const keywordMatch =
            (user.username || "").toLowerCase().includes(keyword) ||
            (user.email || "").toLowerCase().includes(keyword);

        let dateMatch = true;

        if (date) {

            const createdDate = new Date(user.createdAt);

            const formattedDate =
                createdDate.getFullYear() +
                "-" +
                String(createdDate.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(createdDate.getDate()).padStart(2, "0");

            dateMatch = formattedDate === date;
        }

        return keywordMatch && dateMatch;

    });

    displayUsers(filteredUsers);

}

// =======================
// DELETE USER
// =======================
async function deleteUser(id) {

    const confirmed = confirm("Are you sure you want to delete this user?");

    if (!confirmed) return;

    try {

        const res = await fetch(`/admin/delete/${id}`, {
            method: "DELETE"
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Failed to delete user.");
            return;
        }

        alert(data.message);

        loadUsers();
        loadStats();

    } catch (err) {
        console.error("Delete user error:", err);
        alert("Something went wrong.");
    }
}

// =======================
// APPROVED RESTAURANTS
// =======================
async function loadApprovedRestaurants() {

    try {

        const res = await fetch("/admin/restaurants");
        const data = await res.json();

        if (!data.success) return;

        approvedRestaurantData = data.restaurants
            .reverse()
            .filter(r => r.restaurantStatus === "approved");

        displayApprovedRestaurants(approvedRestaurantData);

    } catch (err) {
        console.error("loadApprovedRestaurants error:", err);
    }
}

// =======================
// DISPLAY APPROVED RESTAURANTS
// =======================
function displayApprovedRestaurants(restaurants) {

    const container = document.getElementById("approvedRestaurantTableBody");

    if (!container) return;

    container.innerHTML = "";

    const countElement = document.getElementById("approvedRestaurantCount");

    if (countElement) {
        countElement.innerText =
            `Total ${restaurants.length} approved restaurants found`;
    }

    restaurants.forEach(r => {

        const row = document.createElement("div");
        row.classList.add("table-row-approvedRestaurant");

        row.innerHTML = `
            <div class="date">${new Date(r.createdAt).toLocaleString() || "-"}</div>
            <div class="date">${new Date(r.updatedAt).toLocaleString() || "-"}</div>
            <div class="email">
                ${
                    r.email
                        ? r.email.replace("@", "<br>@")
                        : "-"
                }
            </div>
            <div>${r.restaurantId || "-"}</div>
            <div>${r.restaurantName || "-"}</div>
            <div>${r.branch || "-"}</div>
            <div>${r.address || "-"}</div>
            <div class="ssmNumber">
                ${r.ssmNumber || "-"}
            </div>

            <div>
                <button class="btn delete" onclick="deleteRestaurant('${r._id}')">
                    Delete
                </button>
            </div>
        `;

        container.appendChild(row);

    });

}

// =======================
// FILTER APPROVED RESTAURANTS
// =======================
function filterApprovedRestaurants() {

    const keyword = document.getElementById("approvedRestaurantSearch")
        .value
        .toLowerCase();

    const applicationDate = document.getElementById("applicationDateFilter")
        .value;

    const approvedDate = document.getElementById("approvedDateFilter")
        .value;

    const filtered = approvedRestaurantData.filter(r => {

        const keywordMatch =
            (r.restaurantName || "").toLowerCase().includes(keyword) ||
            (r.branch || "").toLowerCase().includes(keyword) ||
            (r.address || "").toLowerCase().includes(keyword) ||
            (r.ssmNumber || "").toLowerCase().includes(keyword);

        let applicationMatch = true;

        if (applicationDate) {

            const date = new Date(r.createdAt);

            const formatted =
                date.getFullYear() + "-" +
                String(date.getMonth() + 1).padStart(2, "0") + "-" +
                String(date.getDate()).padStart(2, "0");

            applicationMatch = formatted === applicationDate;
        }

        let approvedMatch = true;

        if (approvedDate) {

            const date = new Date(r.updatedAt);

            const formatted =
                date.getFullYear() + "-" +
                String(date.getMonth() + 1).padStart(2, "0") + "-" +
                String(date.getDate()).padStart(2, "0");

            approvedMatch = formatted === approvedDate;
        }

        return keywordMatch && applicationMatch && approvedMatch;

    });

    displayApprovedRestaurants(filtered);

}

// =======================
// DELETE RESTAURANT (APPROVED LIST)
// =======================
async function deleteRestaurant(id) {

    const confirmed = confirm("Are you sure you want to delete this restaurant?");

    if (!confirmed) return;

    try {

        const res = await fetch(`/admin/deleteRestaurant/${id}`, {
            method: "DELETE"
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Failed to delete restaurant.");
            return;
        }

        alert(data.message || "Restaurant deleted.");

        // refresh both tables + stats
        loadApprovedRestaurants();
        loadRestaurants();
        loadStats();

    } catch (err) {
        console.error("Delete restaurant error:", err);
        alert("Something went wrong.");
    }
}


/* ===============================
   CONTACT SUPPORT
================================ */


/* ===============================
   CONTACT SUPPORT FILTERS
================================ */

let allSupportRequests = [];
let expandedSupportRequestId = null;

function setupSupportFilters() {
    const search = document.getElementById("supportSearch");
    const category = document.getElementById("supportCategoryFilter");
    const status = document.getElementById("supportStatusFilter");
    const date = document.getElementById("supportDateFilter");
    const clear = document.getElementById("clearSupportFilter");

    if (!search || !category || !status || !date || !clear) return;

    // Prevent duplicate event listeners
    if (search.dataset.initialized === "true") return;
    search.dataset.initialized = "true";

    search.addEventListener("input", applySupportFilters);
    category.addEventListener("change", applySupportFilters);
    status.addEventListener("change", applySupportFilters);
    date.addEventListener("change", applySupportFilters);

    clear.addEventListener("click", () => {
        search.value = "";
        category.value = "";
        status.value = "";
        date.value = "";

        applySupportFilters();
    });
}

function populateSupportCategories(requests) {
    const categoryFilter = document.getElementById("supportCategoryFilter");

    if (!categoryFilter) return;

    const selectedCategory = categoryFilter.value;

    // Use the actual categories already present in support requests
    const categories = [
        ...new Set(
            requests
                .map(request => (request.category || "").trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    categoryFilter.innerHTML =
        '<option value="">All Categories</option>';

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    // Preserve the selection if the category still exists
    if (categories.includes(selectedCategory)) {
        categoryFilter.value = selectedCategory;
    }
}

function applySupportFilters() {
    const searchValue =
        (document.getElementById("supportSearch")?.value || "")
            .trim()
            .toLowerCase();

    const selectedCategory =
        document.getElementById("supportCategoryFilter")?.value || "";

    const selectedStatus =
        document.getElementById("supportStatusFilter")?.value || "";

    const selectedDate =
        document.getElementById("supportDateFilter")?.value || "";

    const filteredRequests = allSupportRequests.filter(request => {
        const sender = request.senderId || {};

        // Search name, subject, issue description and conversation messages.
        // Email is intentionally excluded.
        const searchableText = [
            sender.username,
            sender.restaurantName,
            request.subject,
            request.description,
            request.adminReply,
            ...(request.messages || []).map(message => message.message)
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            !searchValue || searchableText.includes(searchValue);

        const matchesCategory =
            !selectedCategory || request.category === selectedCategory;

        const matchesStatus =
            !selectedStatus ||
            (request.status || "Pending") === selectedStatus;

        let matchesDate = true;

        if (selectedDate) {
            if (!request.createdAt) {
                matchesDate = false;
            } else {
                const createdAt = new Date(request.createdAt);

                // Compare local calendar dates
                const year = createdAt.getFullYear();
                const month = String(createdAt.getMonth() + 1).padStart(2, "0");
                const day = String(createdAt.getDate()).padStart(2, "0");

                matchesDate =
                    `${year}-${month}-${day}` === selectedDate;
            }
        }

        return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus &&
            matchesDate
        );
    });

    displaySupportRequests(filteredRequests);
}



async function loadSupportRequests() {
    const container = document.getElementById("supportRequestsContainer");

    if (!container) return;

    setupSupportFilters();

    try {
        const res = await fetch("/admin/support-requests");
        const data = await res.json();

        if (!res.ok || !data.success) {
            container.textContent =
                data.message || "Failed to load support requests.";
            return;
        }

        allSupportRequests = data.requests || [];

        // Update support statistics and chart
        updateSupportStats(allSupportRequests);

        // Update category filter and request list
        populateSupportCategories(allSupportRequests);
        applySupportFilters();

    } catch (err) {
        console.error("Load support requests error:", err);
        container.textContent = "Unable to load support requests.";
    }
}


function displaySupportRequests(requests) {
    const container = document.getElementById("supportRequestsContainer");

    if (!container) return;

    container.innerHTML = "";

    const countElement = document.getElementById("supportRequestCount");

    if (countElement) {
        countElement.textContent =
            `Total ${requests.length} support request${requests.length !== 1 ? "s" : ""} found`;
    }

    if (requests.length === 0) {
        const hasFilters =
            document.getElementById("supportSearch")?.value.trim() ||
            document.getElementById("supportCategoryFilter")?.value ||
            document.getElementById("supportStatusFilter")?.value ||
            document.getElementById("supportDateFilter")?.value;

        container.innerHTML = `
            <div class="support-empty">
                <i class="fa-solid fa-headset"></i>
                <h3>${hasFilters ? "No Matching Support Requests" : "No Support Requests Yet"}</h3>
                <p>${hasFilters
                    ? "Try changing your filters or click Clear Filters."
                    : "There are currently no support requests from users or restaurants."}</p>
            </div>
        `;
        return;
    }

    requests.forEach(request => {
        const card = document.createElement("div");
        card.className = "card support-request-card";

        const sender = request.senderId || {};
        const senderName =
            sender.username ||
            sender.restaurantName ||
            sender.email ||
            "Unknown sender";

        const createdAt = request.createdAt
            ? new Date(request.createdAt).toLocaleString("en-MY", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })
            : "-";

        // TOP ROW: Username + Status badge
        const topRow = document.createElement("div");
        topRow.className = "support-request-top";
        
        const senderRole = request.senderRole === "restaurant"
        ? "Restaurant"
        : "User";
        
        const username = document.createElement("h3");
        username.textContent = `${senderRole} ${senderName}`;

        const statusBadge = document.createElement("span");
        statusBadge.className =
            `support-status status-${(request.status || "Pending")
                .toLowerCase()
                .replace(/\s+/g, "-")}`;
        statusBadge.textContent = request.status || "Pending";

        topRow.appendChild(username);
        topRow.appendChild(statusBadge);

        // CATEGORY
        const category = document.createElement("p");
        category.className = "support-request-info";
        category.innerHTML = `<strong>Category:</strong> <span>${request.category || "-"}</span>`;

        // SUBJECT
        const subject = document.createElement("p");
        subject.className = "support-request-info";
        subject.innerHTML = `<strong>Subject:</strong> <span>${request.subject || "-"}</span>`;

        // DATE AND TIME
        const dateLabel = document.createElement("div");
        dateLabel.className = "support-request-date";

        const dateIcon = document.createElement("i");
        dateIcon.className = "fa-regular fa-clock";

        const dateText = document.createElement("span");
        dateText.textContent = createdAt;

        dateLabel.appendChild(dateIcon);
        dateLabel.appendChild(dateText);

        // ISSUE / PROBLEM
        const issueBox = document.createElement("div");
        issueBox.className = "support-request-issue";

        const issueTitle = document.createElement("strong");
        issueTitle.textContent = "Issue/Problem:";

        const issueDescription = document.createElement("p");
        issueDescription.textContent = request.description || "-";
        issueDescription.style.fontWeight = "normal";

        issueBox.appendChild(issueTitle);
        issueBox.appendChild(issueDescription);

        // DIVIDER
        const divider = document.createElement("hr");

        // STATUS CONTROL
        const statusLabel = document.createElement("label");
        statusLabel.textContent = "Update Status";

        const statusSelect = document.createElement("select");

        ["Pending", "In Progress", "Resolved"].forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            option.selected = (request.status || "Pending") === status;
            statusSelect.appendChild(option);
        });

        const statusButton = document.createElement("button");
        statusButton.className = "btn";
        statusButton.textContent = "Update Status";

        statusButton.addEventListener("click", async () => {
            try {
                const res = await fetch(
                    `/admin/support-requests/${request._id}/status`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            status: statusSelect.value
                        })
                    }
                );

                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || "Failed to update status.");
                    return;
                }

                request.status = statusSelect.value;

                // Update support statistics and chart
                updateSupportStats(allSupportRequests);

                // Update the badge immediately
                statusBadge.textContent = request.status;
                statusBadge.className =
                    `support-status status-${request.status
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`;

                alert("Support request status updated.");
                applySupportFilters();

            } catch (err) {
                console.error("Update support status error:", err);
                alert("Unable to update status.");
            }
        });

        
        const conversation = document.createElement("div");
        conversation.className = "support-conversation";

        const conversationTitle = document.createElement("h4");
        conversationTitle.textContent = "Conversation";
        conversation.appendChild(conversationTitle);

        const messages = request.messages || [];

        // Display older requests that only have the legacy adminReply field
        if (messages.length === 0 && request.adminReply) {
            messages.push({
                senderRole: "admin",
                message: request.adminReply,
                createdAt: request.updatedAt
            });
        }

        if (messages.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No replies yet.";
            emptyMessage.className = "support-conversation-empty";
            conversation.appendChild(emptyMessage);
        }

        messages.forEach(msg => {
            const bubble = document.createElement("div");
            bubble.className =
                `support-message ${msg.senderRole === "admin"
                    ? "support-message-admin"
                    : "support-message-user"}`;

            const sender = document.createElement("strong");

            sender.textContent =
                msg.senderRole === "admin"
                    ? "Admin"
                    : msg.senderRole === "restaurant"
                        ? `Restaurant (${senderName})`
                        : `User (${senderName})`;

            const content = document.createElement("p");
            content.textContent = msg.message || "";

            const time = document.createElement("small");
            time.textContent = msg.createdAt
                ? new Date(msg.createdAt).toLocaleString("en-MY")
                : "";

            bubble.appendChild(sender);
            bubble.appendChild(content);
            bubble.appendChild(time);
            conversation.appendChild(bubble);
        });


        // ADMIN REPLY
        const replyLabel = document.createElement("label");
        replyLabel.textContent = "Admin Reply";

        const replyBox = document.createElement("textarea");
        replyBox.rows = 3;
        replyBox.placeholder = "Write a reply to the sender...";
        replyBox.value = "";

        const replyButton = document.createElement("button");
        replyButton.className = "btn";
        replyButton.textContent = "Send Reply";

        replyButton.addEventListener("click", async () => {
            const adminReply = replyBox.value.trim();

            if (!adminReply) {
                alert("Please enter a reply.");
                return;
            }

            try {
                const res = await fetch(
                    `/admin/support-requests/${request._id}/reply`,
                    {
                        method: "PATCH",
                        credentials: "same-origin",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ adminReply })
                    }
                );

                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || "Failed to save reply.");
                    return;
                }

                request.adminReply = adminReply;
                replyBox.value = "";

                alert("Reply saved successfully.");

                await loadSupportRequests();

            } catch (err) {
                console.error("Save support reply error:", err);
                alert("Unable to save reply.");
            }
        });

        
        card.appendChild(topRow);
        card.appendChild(category);
        card.appendChild(subject);
        card.appendChild(dateLabel);
        card.appendChild(issueBox);

        // Collapsible admin controls
        const moreSection = document.createElement("div");
        moreSection.className = "support-more-section";
        moreSection.style.display = "none";

        moreSection.appendChild(statusLabel);
        moreSection.appendChild(statusSelect);
        moreSection.appendChild(statusButton);

        // Conversation history
        moreSection.appendChild(conversation);

        // Admin reply
        moreSection.appendChild(replyLabel);
        moreSection.appendChild(replyBox);
        moreSection.appendChild(replyButton);

        // Show More / Show Less button
        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.className = "support-toggle-btn";

        const toggleIcon = document.createElement("i");
        toggleIcon.className = "fa-solid fa-chevron-down";

        const toggleText = document.createElement("span");
        toggleText.textContent = "Show More";

        toggleButton.appendChild(toggleIcon);
        toggleButton.appendChild(toggleText);
        
        toggleButton.addEventListener("click", () => {
            const isHidden = moreSection.style.display === "none";

            moreSection.style.display = isHidden ? "block" : "none";
            toggleText.textContent = isHidden ? "Show Less" : "Show More";
            toggleIcon.className = isHidden
                ? "fa-solid fa-chevron-up"
                : "fa-solid fa-chevron-down";

            expandedSupportRequestId = isHidden ? request._id : null;
        });


        card.appendChild(toggleButton);
        card.appendChild(moreSection);

        container.appendChild(card);

        // Keep the conversation expanded after re-rendering
        if (String(request._id) === String(expandedSupportRequestId)) {
            moreSection.style.display = "block";
            toggleText.textContent = "Show Less";
            toggleIcon.className = "fa-solid fa-chevron-up";
        }

    });
}


// =======================
// AUTO REFRESH ADMIN DATA
// =======================
function startAutoRefresh() {

    setInterval(() => {

        loadRestaurants();
        loadUsers();
        loadStats();
        loadApprovedRestaurants();

        refreshSupportStats();

    }, 3000); // refresh every 3 seconds

}


// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {

    loadRestaurants();
    loadUsers();
    loadStats();
    loadApprovedRestaurants();
    loadSupportRequests();

    startAutoRefresh();

    document.getElementById("restaurantSearch")?.addEventListener("input", filterRestaurants);
    document.getElementById("restaurantFromDateFilter")?.addEventListener("change", filterRestaurants);
    document.getElementById("restaurantToDateFilter")?.addEventListener("change", filterRestaurants);
    document.getElementById("restaurantStatusFilter")?.addEventListener("change", filterRestaurants);
    document.getElementById("clearRestaurantFilter")?.addEventListener("click", () => {

        document.getElementById("restaurantSearch").value = "";
        document.getElementById("restaurantFromDateFilter").value = "";
        document.getElementById("restaurantToDateFilter").value = "";
        document.getElementById("restaurantStatusFilter").value = "";

        displayRestaurants(restaurantData);

    });

    document.getElementById("userSearch")?.addEventListener("input", filterUsers);
    document.getElementById("userDateFilter")?.addEventListener("change", filterUsers);
    document.getElementById("clearUserFilter")?.addEventListener("click", () => {
        document.getElementById("userSearch").value = "";
        document.getElementById("userDateFilter").value = "";

        displayUsers(userData);

    });

    document.getElementById("approvedRestaurantSearch")?.addEventListener("input", filterApprovedRestaurants);
    document.getElementById("applicationDateFilter")?.addEventListener("change", filterApprovedRestaurants);
    document.getElementById("approvedDateFilter")?.addEventListener("change", filterApprovedRestaurants);
    document.getElementById("clearApprovedRestaurantFilter")?.addEventListener("click", () => {
        document.getElementById("approvedRestaurantSearch").value = "";
        document.getElementById("applicationDateFilter").value = "";
        document.getElementById("approvedDateFilter").value = "";

    displayApprovedRestaurants(approvedRestaurantData);

});

});
