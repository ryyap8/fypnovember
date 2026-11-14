const malaysiaLocations = {

    Johor: [
        "Johor Bahru",
        "Iskandar Puteri",
        "Kulai",
        "Pontian",
        "Batu Pahat",
        "Kluang",
        "Muar",
        "Segamat",
        "Kota Tinggi",
        "Mersing",
        "Tangkak"
    ],

    Kedah: [
        "Alor Setar",
        "Kubang Pasu",
        "Kulim",
        "Langkawi",
        "Pendang",
        "Baling",
        "Yan",
        "Sik"
    ],

    Kelantan: [
        "Kota Bharu",
        "Pasir Mas",
        "Pasir Puteh",
        "Machang",
        "Tanah Merah",
        "Gua Musang"
    ],

    Melaka: [
        "Melaka Tengah",
        "Alor Gajah",
        "Jasin"
    ],

    "Negeri Sembilan": [
        "Seremban",
        "Port Dickson",
        "Jempol",
        "Kuala Pilah",
        "Rembau",
        "Tampin"
    ],

    Pahang: [
        "Kuantan",
        "Bentong",
        "Temerloh",
        "Pekan",
        "Raub",
        "Jerantut"
    ],

    Perak: [
        "Ipoh",
        "Taiping",
        "Teluk Intan",
        "Manjung",
        "Kampar",
        "Kuala Kangsar"
    ],

    Perlis: [
        "Kangar",
        "Arau",
        "Padang Besar"
    ],

    Penang: [
        "George Town",
        "Butterworth",
        "Bukit Mertajam",
        "Nibong Tebal",
        "Balik Pulau"
    ],

    Sabah: [
        "Kota Kinabalu",
        "Sandakan",
        "Tawau",
        "Lahad Datu",
        "Keningau"
    ],

    Sarawak: [
        "Kuching",
        "Miri",
        "Sibu",
        "Bintulu",
        "Sri Aman"
    ],

    Selangor: [
        "Shah Alam",
        "Petaling Jaya",
        "Subang Jaya",
        "Klang",
        "Kajang",
        "Ampang",
        "Sepang",
        "Kuala Selangor"
    ],

    Terengganu: [
        "Kuala Terengganu",
        "Kemaman",
        "Dungun",
        "Besut"
    ],

    "Wilayah Persekutuan Kuala Lumpur": [
        "Kuala Lumpur"
    ],

    "Wilayah Persekutuan Putrajaya": [
        "Putrajaya"
    ],

    "Wilayah Persekutuan Labuan": [
        "Labuan"
    ]

};

let editingFoodId = null;

// ==========================
// Profile Completion
// ==========================
let profileCompleted = false;
let profileWarningShown = false;

const openingDays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
];

function isOpeningHoursComplete(openingHours) {

    if (!openingHours) return false;

    // At least one day must be open
    const hasOpenDay = openingDays.some(day =>
        openingHours[day]?.isOpen
    );

    if (!hasOpenDay) return false;

    // Check every open day
    return openingDays.every(day => {

        const data = openingHours[day];

        // Closed day is valid
        if (!data || !data.isOpen) {
            return true;
        }

        // Session 1 is required
        if (!data.open1 || !data.close1) {
            return false;
        }

        // Session 2 is optional
        // But if one time is entered, both must be entered
        if (
            (data.open2 && !data.close2) ||
            (!data.open2 && data.close2)
        ) {
            return false;
        }

        return true;

    });

}


function checkProfileComplete(r) {

    return (
        r.restaurantName &&
        r.fullAddress &&
        r.location &&
        isOpeningHoursComplete(r.openingHours) &&
        r.image &&
        r.cuisine &&
        r.halalStatus &&
        r.restaurantDescription
    );

}

// ==========================
// Section Navigation
// ==========================
async function showSection(section) {

    // ==========================
    // Block sections if profile incomplete
    // ==========================

    if (!profileCompleted && section !== "profile") {

        alert("Please complete your restaurant profile details first.");

        // Automatically show Profile
        section = "profile";

    }


    // ==========================
    // Leaving notification page
    // ==========================

    if(
        document.getElementById("notificationsSection").style.display === "block"
        &&
        section !== "notifications"
    ){

        await fetch("/menu/notifications/read", {
            method: "PUT"
        });

    }


    const ids = [
        "overviewSection",
        "menuSection",
        "reviewsSection",
        "announcementsSection",
        "profileSection",
        "notificationsSection",
        "supportSection"
    ];


    ids.forEach(id => {

        const el = document.getElementById(id);

        if(el){

            el.style.display = "none";

        }

    });


    const selectedSection = document.getElementById(section + "Section");

    if (selectedSection) {
        selectedSection.style.display = "block";
    }

    // Scroll back to the top when changing section
    window.scrollTo({
        top: 0,
        behavior: "auto"
    });

    // ==========================
    // Load notifications
    // ==========================

    if(section === "notifications"){

        loadNotifications();

    }

    // ==========================
    // Load reviews
    // ==========================

    if(section === "reviews"){

        loadReviews();

    }

    // ==========================
    // Load announcements
    // ==========================

    if (section === "announcements") {
        loadAnnouncements();
    }

    // Load Contact Admin requests
    if (section === "support") {
        loadRestaurantSupportRequests();
    }

}



async function submitRestaurantSupportRequest() {
    const category = document.getElementById("restaurantSupportCategory").value;
    const subject = document.getElementById("restaurantSupportSubject").value.trim();
    const description = document.getElementById("restaurantSupportDescription").value.trim();
    const feedback = document.getElementById("restaurantSupportFeedback");

    feedback.textContent = "";

    if (!category || !subject || !description) {
        feedback.textContent = "Please complete all required fields.";
        return;
    }

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
            feedback.textContent = data.message || "Failed to submit your request.";
            return;
        }

        feedback.textContent = "Support request submitted successfully.";

        document.getElementById("restaurantSupportCategory").value = "";
        document.getElementById("restaurantSupportSubject").value = "";
        document.getElementById("restaurantSupportDescription").value = "";

        await loadRestaurantSupportRequests();

    } catch (error) {
        console.error("Submit restaurant support request error:", error);
        feedback.textContent = "Unable to submit your request. Please try again.";
    }
}

let expandedRestaurantSupportRequestId = null;

async function loadRestaurantSupportRequests() {
    const container = document.getElementById("restaurantSupportRequestList");

    if (!container) return;

    container.innerHTML = "<p>Loading support requests...</p>";

    try {
        const response = await fetch("/support/my-requests");
        const data = await response.json();

        if (!response.ok || !data.success) {
            container.textContent = data.message || "Failed to load support requests.";
            return;
        }

        if (!data.requests || data.requests.length === 0) {
            container.innerHTML = "<p>You have not submitted any support requests yet.</p>";
            return;
        }

        container.innerHTML = data.requests.map(request => {
            const isExpanded =
                String(request._id) === expandedRestaurantSupportRequestId;
            const id = escapeSupportHtml(request._id);
            const subject = escapeSupportHtml(request.subject || "");
            const category = escapeSupportHtml(request.category || "");
            const description = escapeSupportHtml(request.description || "");
            const status = escapeSupportHtml(request.status || "Pending");
            const date = request.createdAt
                ? new Date(request.createdAt).toLocaleString()
                : "";

            const messages = Array.isArray(request.messages)
                ? request.messages
                : [];

            const conversation = messages.map(message => {
                const isAdmin = message.senderRole === "admin";
                const sender = isAdmin
                    ? "Admin"
                    : "You";

                return `
                    <div class="my-support-message ${isAdmin ? "my-support-message-admin" : "my-support-message-user"}">
                        <strong>${sender}</strong>
                        <p>${escapeSupportHtml(message.message || "")}</p>
                        <small>${
                            message.createdAt
                                ? escapeSupportHtml(new Date(message.createdAt).toLocaleString())
                                : ""
                        }</small>
                    </div>
                `;
            }).join("");

            
            return `
                <div class="support-card">

                    <div class="restaurant-support-header">
                        <h4>Subject: ${subject}</h4>
                        
                        <span class="support-status support-status-${status.toLowerCase().replace(/\s+/g, '-')}">
                            ${status}
                        </span>

                    </div>

                    <div class="restaurant-support-date">
                        <i class="fa-regular fa-clock"></i>
                        ${escapeSupportHtml(date)}
                    </div>

                    <p><strong>Category:</strong> ${category}</p>

                    <p class="restaurant-support-description">
                        <strong>Message:</strong> ${description}
                    </p>


                    <button
                        type="button"
                        class="conversation-toggle"
                        onclick="toggleRestaurantConversation('${id}')"
                    >
                        <i class="fa-regular fa-comments"></i>
                        <span id="conversationToggleText-${id}">${isExpanded ? "Close Conversation" : "Show Conversation"}</span>
                        <i class="fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}" id="conversationToggleIcon-${id}"></i>
                    </button>

                        <div
                            class="restaurant-support-expandable"
                            id="restaurantConversation-${id}"
                            style="display: ${isExpanded ? "block" : "none"};"
                        >

                        <div class="my-support-conversation">
                            <strong>Conversation with Admin</strong>
                            ${
                                conversation ||
                                '<p class="my-support-no-reply">No replies yet.</p>'
                            }
                        </div>

                        <form onsubmit="replyToRestaurantSupport(event, '${id}')">
                            <div class="form-group">
                                <label for="restaurantReply-${id}">Your Reply</label>
                                <textarea
                                    id="restaurantReply-${id}"
                                    rows="3"
                                    maxlength="3000"
                                    placeholder="Write your message to Admin..."
                                    required
                                ></textarea>
                            </div>

                            <button type="submit" class="btn save">
                                Send Reply
                            </button>

                            <p id="restaurantReplyFeedback-${id}" class="support-feedback"></p>
                        </form>
                    </div>

                </div>
            `;

        }).join("");

    } catch (error) {
        console.error("Load restaurant support requests error:", error);
        container.textContent = "Unable to load support requests. Please try again.";
    }
}


async function replyToRestaurantSupport(event, requestId) {
    event.preventDefault();

    const textarea = document.getElementById(`restaurantReply-${requestId}`);
    const feedback = document.getElementById(`restaurantReplyFeedback-${requestId}`);
    const message = textarea.value.trim();

    feedback.textContent = "";

    if (!message) {
        feedback.textContent = "Please enter a message.";
        return;
    }

    try {
        const response = await fetch(
            `/support/${encodeURIComponent(requestId)}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            feedback.textContent = data.message || "Failed to send your reply.";
            return;
        }

        await loadRestaurantSupportRequests();

    } catch (error) {
        console.error("Reply to restaurant support request error:", error);
        feedback.textContent = "Unable to send your reply. Please try again.";
    }
}


function escapeSupportHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}



// ==========================
// Review Analytics
// ==========================
let reviews = [];

let reviewChart = null;
let analyticsChart = null;

let currentReviewPeriod = "month";


// ==========================
// Review Doughnut Chart
// ==========================
function updateReviewDoughnutChart() {

    const ratingCounts = [0, 0, 0, 0, 0];


    // Count real reviews
    reviews.forEach(review => {

        const rating = Number(review.rating);

        if (rating >= 1 && rating <= 5) {

            ratingCounts[rating - 1]++;

        }

    });


    // Destroy previous chart
    if (reviewChart) {

        reviewChart.destroy();

    }


    // Create chart
    reviewChart = new Chart(
        document.getElementById("reviewChart"),
        {

            type: "doughnut",

            data: {

                labels: [
                    "5 Star",
                    "4 Star",
                    "3 Star",
                    "2 Star",
                    "1 Star"
                ],

                datasets: [{

                    data: [
                        ratingCounts[4],
                        ratingCounts[3],
                        ratingCounts[2],
                        ratingCounts[1],
                        ratingCounts[0]
                    ]

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false

            }

        }
    );

}


// ==========================
// Review Analytics Chart
// ==========================
function updateReviewAnalyticsChart() {

    if (!reviews || reviews.length === 0) {

        if (analyticsChart) {

            analyticsChart.destroy();

            analyticsChart = null;

        }

        return;

    }


    const now = new Date();

    let labels = [];
    let reviewCounts = [];


    // ==========================
    // TODAY
    // ==========================
    if (currentReviewPeriod === "today") {

        for (let hour = 0; hour < 24; hour++) {

            labels.push(
                `${String(hour).padStart(2, "0")}:00`
            );


            const count = reviews.filter(review => {

                const date =
                    new Date(review.createdAt);


                return (
                    date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth() &&
                    date.getDate() === now.getDate() &&
                    date.getHours() === hour
                );

            }).length;


            reviewCounts.push(count);

        }

    }


    // ==========================
    // THIS WEEK
    // ==========================
    else if (currentReviewPeriod === "week") {

        const startOfWeek = new Date(now);

        const day = now.getDay();

        // Monday = first day of week
        const diff =
            day === 0 ? 6 : day - 1;


        startOfWeek.setDate(
            now.getDate() - diff
        );

        startOfWeek.setHours(0, 0, 0, 0);


        const weekDays = [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun"
        ];


        labels = weekDays;


        for (let i = 0; i < 7; i++) {

            const targetDate =
                new Date(startOfWeek);


            targetDate.setDate(
                startOfWeek.getDate() + i
            );


            const count = reviews.filter(review => {

                const date =
                    new Date(review.createdAt);


                return (
                    date.getFullYear() ===
                        targetDate.getFullYear()

                    &&

                    date.getMonth() ===
                        targetDate.getMonth()

                    &&

                    date.getDate() ===
                        targetDate.getDate()
                );

            }).length;


            reviewCounts.push(count);

        }

    }


    // ==========================
    // THIS MONTH
    // ==========================
    else if (currentReviewPeriod === "month") {

        const year =
            now.getFullYear();

        const month =
            now.getMonth();


        const daysInMonth =
            new Date(
                year,
                month + 1,
                0
            ).getDate();


        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {

            labels.push(String(day));


            const count = reviews.filter(review => {

                const date =
                    new Date(review.createdAt);


                return (
                    date.getFullYear() === year
                    &&
                    date.getMonth() === month
                    &&
                    date.getDate() === day
                );

            }).length;


            reviewCounts.push(count);

        }

    }


    // ==========================
    // ALL TIME
    // ==========================
    else if (currentReviewPeriod === "all") {

        const monthlyReviews = {};


        reviews.forEach(review => {

            const date =
                new Date(review.createdAt);


            const key =
                `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`;


            if (!monthlyReviews[key]) {

                monthlyReviews[key] = 0;

            }


            monthlyReviews[key]++;

        });


        const sortedMonths =
            Object.keys(monthlyReviews).sort();


        sortedMonths.forEach(key => {

            const [year, month] =
                key.split("-");


            const date =
                new Date(
                    Number(year),
                    Number(month) - 1
                );


            labels.push(
                date.toLocaleDateString(
                    "en-MY",
                    {
                        month: "short",
                        year: "numeric"
                    }
                )
            );


            reviewCounts.push(
                monthlyReviews[key]
            );

        });

    }


    // ==========================
    // Destroy Old Chart
    // ==========================
    if (analyticsChart) {

        analyticsChart.destroy();

    }


    // ==========================
    // Create New Chart
    // ==========================
    analyticsChart = new Chart(
        document.getElementById("analyticsChart"),
        {

            type: "bar",

            data: {

                labels: labels,

                datasets: [{

                    label: "Reviews",

                    data: reviewCounts

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            precision: 0

                        }

                    }

                },

                plugins: {

                    legend: {

                        display: false

                    }

                }

            }

        }
    );

}


// ==========================
// Change Review Period
// ==========================
function changeReviewPeriod(period) {

    currentReviewPeriod = period;


    // Remove active from all tabs
    document
        .querySelectorAll(".review-tab")
        .forEach(tab => {

            tab.classList.remove("active");

        });


    // Add active to selected tab
    document
        .querySelector(
            `.review-tab[onclick="changeReviewPeriod('${period}')"]`
        )
        ?.classList.add("active");


    updateReviewAnalyticsChart();

}


// ==========================
// Opening Hours
// ==========================

function updateOpeningDayState(day) {

    const checkbox =
        document.getElementById(`${day}Open`);

    const openInput1 =
        document.getElementById(`${day}OpenTime1`);

    const closeInput1 =
        document.getElementById(`${day}CloseTime1`);

    const openInput2 =
        document.getElementById(`${day}OpenTime2`);

    const closeInput2 =
        document.getElementById(`${day}CloseTime2`);

    const addSessionBtn =
        document.getElementById(`${day}AddSession`);

    const dayRow =
        checkbox.closest(".opening-day");

    const isOpen =
        checkbox.checked;

    // Enable / disable Session 1
    openInput1.disabled = !isOpen;
    closeInput1.disabled = !isOpen;

    // Enable / disable Session 2
    openInput2.disabled = !isOpen;
    closeInput2.disabled = !isOpen;

    if (!isOpen) {

        // Clear times when day is closed
        openInput1.value = "";
        closeInput1.value = "";

        openInput2.value = "";
        closeInput2.value = "";

        // Hide Session 2
        removeOpeningSession(day);

    }

    if (dayRow) {

        dayRow.classList.toggle(
            "closed",
            !isOpen
        );

    }

}


// ==========================
// Add Second Session
// ==========================

function addOpeningSession(day) {

    const session2 =
        document.getElementById(`${day}Session2`);

    const addButton =
        document.getElementById(`${day}AddSession`);

    if (!session2) return;

    session2.style.display = "flex";

    if (addButton) {
        addButton.style.display = "none";
    }

}


// ==========================
// Remove Second Session
// ==========================

function removeOpeningSession(day) {

    const session2 =
        document.getElementById(`${day}Session2`);

    const addButton =
        document.getElementById(`${day}AddSession`);

    const openInput2 =
        document.getElementById(`${day}OpenTime2`);

    const closeInput2 =
        document.getElementById(`${day}CloseTime2`);

    if (!session2) return;

    session2.style.display = "none";

    if (openInput2) {
        openInput2.value = "";
    }

    if (closeInput2) {
        closeInput2.value = "";
    }

    if (addButton) {
        addButton.style.display = "block";
    }

}


// ==========================
// Get Opening Hours From Form
// ==========================

function getOpeningHoursFromForm() {

    const openingHours = {};

    openingDays.forEach(day => {

        const isOpen =
            document.getElementById(`${day}Open`).checked;

        const open1 =
            document.getElementById(`${day}OpenTime1`).value;

        const close1 =
            document.getElementById(`${day}CloseTime1`).value;

        const open2 =
            document.getElementById(`${day}OpenTime2`).value;

        const close2 =
            document.getElementById(`${day}CloseTime2`).value;

        openingHours[day] = {

            isOpen,

            open1: isOpen ? open1 : "",
            close1: isOpen ? close1 : "",

            open2: isOpen ? open2 : "",
            close2: isOpen ? close2 : ""

        };

    });

    return openingHours;

}


// ==========================
// Load Opening Hours Into Form
// ==========================

function loadOpeningHoursIntoForm(openingHours) {

    openingDays.forEach(day => {

        const data =
            openingHours?.[day];

        const checkbox =
            document.getElementById(`${day}Open`);

        const openInput1 =
            document.getElementById(`${day}OpenTime1`);

        const closeInput1 =
            document.getElementById(`${day}CloseTime1`);

        const openInput2 =
            document.getElementById(`${day}OpenTime2`);

        const closeInput2 =
            document.getElementById(`${day}CloseTime2`);

        if (data) {

            checkbox.checked =
                data.isOpen !== false;

            openInput1.value =
                convertTimeTo24Hour(data.open1);

            closeInput1.value =
                convertTimeTo24Hour(data.close1);

            openInput2.value =
                convertTimeTo24Hour(data.open2);

            closeInput2.value =
                convertTimeTo24Hour(data.close2);

        }
        else {

            checkbox.checked = true;

            openInput1.value = "";
            closeInput1.value = "";

            openInput2.value = "";
            closeInput2.value = "";

        }


        // Show Session 2 if it has times
        if (
            openInput2.value ||
            closeInput2.value
        ) {

            addOpeningSession(day);

        }
        else {

            removeOpeningSession(day);

        }


        updateOpeningDayState(day);

    });

}


// ==========================
// Convert Time To 24 Hour
// ==========================

function convertTimeTo24Hour(timeString) {

    if (!timeString) return "";

    // Already in HH:mm format
    if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
    }

    // Convert "10:00 AM" to "10:00"
    const match =
        timeString
            .trim()
            .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (!match) return "";

    let hour = Number(match[1]);

    const minute = match[2];

    const period =
        match[3].toUpperCase();


    if (period === "AM" && hour === 12) {
        hour = 0;
    }

    if (period === "PM" && hour !== 12) {
        hour += 12;
    }


    return `${String(hour).padStart(2, "0")}:${minute}`;

}


// ==========================
// Convert Time To Display
// ==========================

function convertTimeToDisplay(timeString) {

    if (!timeString) return "";

    const match =
        timeString.match(/^(\d{2}):(\d{2})$/);

    if (!match) return timeString;

    let hour = Number(match[1]);

    const minute = match[2];

    const period =
        hour >= 12 ? "PM" : "AM";


    if (hour === 0) {
        hour = 12;
    }
    else if (hour > 12) {
        hour -= 12;
    }


    return `${hour}:${minute} ${period}`;

}


// ==========================
// Format Opening Hours For View
// ==========================

function formatOpeningHoursForDisplay(openingHours) {

    if (!openingHours) {
        return "-";
    }


    const dayNames = {

        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday"

    };


    let html = "";


    openingDays.forEach(day => {

        const data =
            openingHours[day];


        if (!data || !data.isOpen) {

            html += `
                <div class="opening-hours-display-row">
                    <strong>${dayNames[day]}</strong>
                    <span>Closed</span>
                </div>
            `;

            return;

        }


        const sessions = [];


        // Session 1
        if (data.open1 && data.close1) {

            sessions.push(
                `${convertTimeToDisplay(data.open1)}
                 - ${convertTimeToDisplay(data.close1)}`
            );

        }


        // Session 2
        if (data.open2 && data.close2) {

            sessions.push(
                `${convertTimeToDisplay(data.open2)}
                 - ${convertTimeToDisplay(data.close2)}`
            );

        }


        html += `
            <div class="opening-hours-display-row">
                <strong>${dayNames[day]}</strong>
                <span>
                    ${sessions.length > 0
                        ? sessions.join("<br>")
                        : "-"
                    }
                </span>
            </div>
        `;

    });


    return html;

}


// ==========================
// Load Restaurant Profile
// ==========================
async function loadRestaurant() {

    try {

        const response = await fetch("/restaurant/profile");
        const data = await response.json();

        if (!data.success) return;

        const r = data.restaurant;

        // ==========================
        // Review Statistics
        // ==========================

        document.getElementById("averageRating").textContent =
            Number(r.averageRating || 0).toFixed(1);

        document.getElementById("totalReviews").textContent =
            r.totalRatings || 0;


        // ==========================
        // Total Favourites
        // ==========================

        try {

            const favouriteResponse =
                await fetch("/favourites/count/" + r._id);

            const favouriteData =
                await favouriteResponse.json();

            if (favouriteData.success) {

                document.getElementById("totalFavourites").textContent =
                    favouriteData.totalFavourites;

            }
            else {

                document.getElementById("totalFavourites").textContent =
                    0;

            }

        }
        catch (err) {

            console.error(
                "Failed to load favourite count:",
                err
            );

            document.getElementById("totalFavourites").textContent =
                0;

        }


        // ==========================
        // Check Profile Completion
        // ==========================

        profileCompleted = checkProfileComplete(r);


        // ==========================
        // Restaurant Greeting
        // ==========================

        document.getElementById("restaurantGreeting").textContent =
            r.branch
                ? `Hi, ${r.restaurantName} ${r.branch}`
                : `Hi, ${r.restaurantName}`;


        // ==========================
        // Restaurant ID
        // ==========================

        document.getElementById("restaurantIdText").textContent =
            r.restaurantId || "";

        document.getElementById("restaurantId").value =
            r.restaurantId || "";


        // ==========================
        // Restaurant Name
        // ==========================

        document.getElementById("restaurantNameText").textContent =
            r.restaurantName || "";

        document.getElementById("restaurantName").value =
            r.restaurantName || "";


        // ==========================
        // Branch
        // ==========================

        document.getElementById("branchText").textContent =
            r.branch ? r.branch : "-";

        document.getElementById("branch").value =
            r.branch || "";

        
        // ==========================
        // Cuisine Type
        // ==========================

        document.getElementById("restaurantCuisineText").textContent =
            r.cuisine || "-";

        document.getElementById("restaurantCuisine").value =
            r.cuisine || "";


        // ==========================
        // Halal Status
        // ==========================

        document.getElementById("halalStatusText").textContent =
            r.halalStatus || "-";

        document.getElementById("halalStatus").value =
            r.halalStatus || "";

        
        // ==========================
        // Restaurant Description
        // ==========================

        document.getElementById("restaurantDescriptionText").textContent =
            r.restaurantDescription || "-";

        document.getElementById("restaurantDescription").value =
            r.restaurantDescription || "";

        
        // ==========================
        // Restaurant History
        // ==========================

        document.getElementById("restaurantHistoryText").textContent =
            r.restaurantHistory || "-";

        document.getElementById("restaurantHistory").value =
            r.restaurantHistory || "";


        // ==========================
        // Contact Number
        // ==========================

        document.getElementById("contactNumberText").textContent =
            r.contactNumber || "-";

        document.getElementById("contactNumber").value =
            r.contactNumber || "";


        // ==========================
        // Social Media
        // ==========================

        const socialMedia = r.socialMedia || {};

        document.getElementById("facebookLink").value =
            socialMedia.facebook || "";

        document.getElementById("instagramLink").value =
            socialMedia.instagram || "";

        document.getElementById("tiktokLink").value =
            socialMedia.tiktok || "";

        const socialMediaText =
            document.getElementById("socialMediaText");

        socialMediaText.innerHTML = "";

        if (socialMedia.facebook) {
            const facebook = document.createElement("a");
            facebook.href = socialMedia.facebook;
            facebook.target = "_blank";
            facebook.rel = "noopener noreferrer";
            facebook.innerHTML =
                '<i class="fa-brands fa-facebook"></i> Facebook';
            socialMediaText.appendChild(facebook);
        }

        if (socialMedia.instagram) {
            const instagram = document.createElement("a");
            instagram.href = socialMedia.instagram;
            instagram.target = "_blank";
            instagram.rel = "noopener noreferrer";
            instagram.innerHTML =
                '<i class="fa-brands fa-instagram"></i> Instagram';
            socialMediaText.appendChild(instagram);
        }

        if (socialMedia.tiktok) {
            const tiktok = document.createElement("a");
            tiktok.href = socialMedia.tiktok;
            tiktok.target = "_blank";
            tiktok.rel = "noopener noreferrer";
            tiktok.innerHTML =
                '<i class="fa-brands fa-tiktok"></i> TikTok';
            socialMediaText.appendChild(tiktok);
        }

        /* No social media */
        if (
            !socialMedia.facebook &&
            !socialMedia.instagram &&
            !socialMedia.tiktok
        ) {
            socialMediaText.textContent = "-";
        }


        // ==========================
        // Location
        // ==========================

        if (r.location) {

            const parts = r.location.split(", ");

            if (parts.length === 2) {

                const district = parts[0];
                const state = parts[1];

                document.getElementById("stateText").textContent =
                    state;

                document.getElementById("state").value =
                    state;

                loadDistricts();

                document.getElementById("districtText").textContent =
                    district;

                document.getElementById("district").value =
                    district;

            }

        }
        else {

            document.getElementById("stateText").textContent = "";
            document.getElementById("districtText").textContent = "";

        }


        // ==========================
        // Opening Hours
        // ==========================

        loadOpeningHoursIntoForm(
            r.openingHours
        );

        document.getElementById("openingHoursText").innerHTML =
            formatOpeningHoursForDisplay(
                r.openingHours
            );


        // ==========================
        // Full Address
        // ==========================

        document.getElementById("fullAddressText").textContent =
            r.fullAddress || "";

        document.getElementById("fullAddress").value =
            r.fullAddress || "";


        // ==========================
        // Restaurant Image
        // ==========================

        if (r.image) {

            document.getElementById("imagePreview").src = r.image;

            document.getElementById("imagePreview").style.display = "block";

            document.getElementById("noRestaurantImage").style.display = "none";

        }
        else {

            document.getElementById("imagePreview").style.display = "none";

            document.getElementById("noRestaurantImage").style.display = "flex";

        }

        if (r.imageOriginalName) {

            document.getElementById("restaurantFileNameDisplay").textContent =
                r.imageOriginalName;

        }
        else {

            document.getElementById("restaurantFileNameDisplay").textContent =
                "No file chosen";

        }


        // ==========================
        // Profile Completion Behaviour
        // ==========================

        if (!profileCompleted) {

            // Force Profile page
            showSection("profile");

            // Allow editing immediately
            editProfile();


            if (!profileWarningShown) {

                setTimeout(() => {

                    alert(
                        "Welcome! Please complete your restaurant profile before accessing the other sections."
                    );

                    profileWarningShown = true;

                }, 300);

            }

        }
        else {

            // Profile is complete
            viewProfile();

        }

    }
    catch (err) {

        console.error(
            "Failed to load restaurant profile:",
            err
        );

    }

}

async function loadFoods(){

    const res = await fetch("/menu");

    const data = await res.json();

    if(!data.success) return;

    allFoods = data.foods;

    // Update Total Foods
    document.getElementById("totalFoods").textContent = allFoods.length;

    populateFoodFilters();

    displayFoods(allFoods);

}

function displayFoods(foods){

    document.getElementById("foodTableBody").innerHTML = "";

    document.getElementById("foodResultCount").textContent =
        `Showing ${foods.length} ${foods.length === 1 ? "result" : "results"}`;

    foods.forEach(addFoodRow);

}


function populateFoodFilters(){

    const categories = [
        ...new Set(allFoods.map(food => food.category))
    ];

    const mealTypes = [
        ...new Set(
            allFoods.flatMap(food => food.mealType || [])
        )
    ];

    const categorySelect =
        document.getElementById("categoryFilter");

    const mealTypeSelect =
        document.getElementById("mealTypeFilter");


    categorySelect.innerHTML =
        `<option value="">All Category</option>`;

    mealTypeSelect.innerHTML =
        `<option value="">All Meal Type</option>`;


    categories.forEach(c => {

        categorySelect.innerHTML +=
            `<option value="${c}">${c}</option>`;

    });


    mealTypes.forEach(m => {

        mealTypeSelect.innerHTML +=
            `<option value="${m}">${m}</option>`;

    });

}


function handleCategoryChange() {

    const category = document.getElementById("foodCategory").value;
    const customCategory = document.getElementById("customFoodCategory");

    if (category === "Others") {

        customCategory.style.display = "block";
        customCategory.focus();

    } else {

        customCategory.style.display = "none";
        customCategory.value = "";
    }
}



function filterFoods(){

    let filtered = [...allFoods];


    const search =
        document.getElementById("foodSearch")
        .value
        .toLowerCase();


    const category =
        document.getElementById("categoryFilter").value;


    const mealType =
        document.getElementById("mealTypeFilter").value;


    const price =
        document.getElementById("priceFilter").value;


    // Search
    if(search){

        filtered = filtered.filter(food =>

            food.name.toLowerCase().includes(search)

            ||

            (food.description || "")
            .toLowerCase()
            .includes(search)

            ||

            (food.culturalInfo || "")
            .toLowerCase()
            .includes(search)

        );

    }


    // Category filter
    if(category){

        filtered = filtered.filter(food =>

            food.category === category

        );

    }


    // Meal Type filter
    if(mealType){

        filtered = filtered.filter(food =>

            (food.mealType || []).includes(mealType)

        );

    }


    // Price sorting
    if(price === "low-high"){

        filtered.sort((a, b) =>
            a.price - b.price
        );

    }


    if(price === "high-low"){

        filtered.sort((a, b) =>
            b.price - a.price
        );

    }


    displayFoods(filtered);

}



function clearFoodFilter(){

    document.getElementById("foodSearch").value = "";

    document.getElementById("priceFilter").value = "";

    document.getElementById("categoryFilter").value = "";

    document.getElementById("mealTypeFilter").value = "";


    displayFoods(allFoods);

}

function editProfile(){

    document.querySelectorAll(".view-field")
        .forEach(el => {
            el.style.display = "none";
        });

    document.querySelectorAll(".edit-field")
        .forEach(el => {
            el.style.display =
                el.classList.contains("file-input")
                    ? "flex"
                    : "block";
        });

    document.querySelectorAll(".social-media-input")
    .forEach(el => {
        el.style.display = "flex";
    });

    document.getElementById("editBtn").style.display = "none";

    document.getElementById("saveBtn").style.display = "block";
}

function loadStates() {

    const state = document.getElementById("state");

    Object.keys(malaysiaLocations).forEach(s => {

        const option = document.createElement("option");

        option.value = s;
        option.textContent = s;

        state.appendChild(option);

    });

}

function loadDistricts() {

    const state = document.getElementById("state").value;

    const district = document.getElementById("district");

    district.innerHTML =
        '<option value="">-- Select District --</option>';

    if (!state) return;

    malaysiaLocations[state].forEach(d => {

        const option = document.createElement("option");

        option.value = d;
        option.textContent = d;

        district.appendChild(option);

    });

}


async function saveProfile() {

    const fullAddress =
        document.getElementById("fullAddress").value.trim();

    const state =
        document.getElementById("state").value;

    const district =
        document.getElementById("district").value;

    const openingHours =
        getOpeningHoursFromForm();

    const image =
        document.getElementById("restaurantImage").files[0];
    
    const cuisine =
        document.getElementById("restaurantCuisine").value;

    const halalStatus =
        document.getElementById("halalStatus").value;

    const restaurantDescription =
        document.getElementById("restaurantDescription").value.trim();

    const restaurantHistory =
        document.getElementById("restaurantHistory").value.trim();

    const contactNumber =
        document.getElementById("contactNumber").value.trim();

    const facebookLink =
        document.getElementById("facebookLink").value.trim();

    const instagramLink =
        document.getElementById("instagramLink").value.trim();

    const tiktokLink =
        document.getElementById("tiktokLink").value.trim();


    // ==========================
    // Validate Required Fields
    // ==========================

    if (!fullAddress) {
        alert("Please enter the full address.");
        return;
    }

    if (!state) {
        alert("Please select a state.");
        return;
    }

    if (!district) {
        alert("Please select a district.");
        return;
    }

    if (!cuisine) {
        alert("Please select the cuisine type.");
        document.getElementById("restaurantCuisine").focus();
        return;
    }

    if (!halalStatus) {
        alert("Please select the halal status.");
        document.getElementById("halalStatus").focus();
        return;
    }

    if (!restaurantDescription) {
        alert("Please enter the restaurant description.");
        document.getElementById("restaurantDescription").focus();
        return;
    }

    // Restaurant History is optional

    // Restaurant Image
    const imagePreview =
        document.getElementById("imagePreview").src;

    const hasExistingImage =
        imagePreview &&
        document.getElementById("imagePreview").style.display !== "none";


    if (!image && !hasExistingImage) {
        alert("Please upload a restaurant image.");
        return;
    }


    if (!isOpeningHoursComplete(openingHours)) {
        alert(
            "Please enter valid opening hours for every open day. Session 1 is required, while Session 2 is optional but must have both opening and closing times."
        );
        return;
    }


    // ==========================
    // Create FormData
    // ==========================

    const formData = new FormData();

    formData.append(
        "fullAddress",
        fullAddress
    );

    const location =
        `${district}, ${state}`;

    formData.append(
        "location",
        location
    );

    formData.append(
        "cuisine",
        cuisine
    );

    formData.append(
        "halalStatus",
        halalStatus
    );

    formData.append(
        "restaurantDescription",
        restaurantDescription
    );

    formData.append(
        "restaurantHistory", 
        restaurantHistory
    );

    if (image) {
        formData.append(
            "image",
            image
        );
    }

    formData.append(
        "openingHours",
        JSON.stringify(openingHours)
    );

    formData.append(
        "contactNumber", 
        contactNumber
    );

    formData.append(
        "facebookLink", 
        facebookLink
    );

    formData.append(
        "instagramLink", 
        instagramLink
    );

    formData.append(
        "tiktokLink", 
        tiktokLink
    );


    // ==========================
    // Save
    // ==========================

    try {

        const response = await fetch(
            "/restaurant/profile",
            {
                method: "PUT",
                body: formData
            }
        );


        const data = await response.json();


        if (data.success) {

            alert(data.message);

            // Clear the file input after saving
            document.getElementById("restaurantImage").value = "";

            document.getElementById("restaurantFileNameDisplay").textContent =
            "No file chosen";

            // Reload profile
            await loadRestaurant();

            // Profile is now unlocked
            profileCompleted = true;

            viewProfile();

            // Go to Overview
            showSection("overview");

        }
        else {

            alert(
                data.message ||
                "Failed to update profile."
            );

        }

    }
    catch (err) {

        console.error(err);

        alert(
            "Failed to update profile."
        );

    }

}

function viewProfile(){

    document.querySelectorAll(".edit-field")
        .forEach(el=>{
            el.style.display="none";
        });

    document.querySelectorAll(".social-media-input")
    .forEach(el => {
        el.style.display = "none";
    });

    document.querySelectorAll(".view-field")
        .forEach(el=>{
            el.style.display="block";
        });


    document.getElementById("editBtn").style.display="block";

    document.getElementById("saveBtn").style.display="none";

}

function openFoodModal(){

    editingFoodId = null;

    document.getElementById("foodModalTitle").textContent =
        "Add Food";

    document.getElementById("foodModal").style.display =
        "flex";


    document.getElementById("foodName").value = "";

    document.getElementById("foodPrice").value = "";

    document.getElementById("foodCategory").value = "";

    document.getElementById("customFoodCategory").value = "";

    document.getElementById("customFoodCategory").style.display = "none";

    document.getElementById("foodDescription").value = "";

    document.getElementById("foodCulture").value = "";


    // Clear Meal Type
    document
        .querySelectorAll('input[name="mealType"]')
        .forEach(checkbox => {
            checkbox.checked = false;
        });
    
    // Clear Popular Food
    document.getElementById("foodIsPopular").checked = false;

    document.getElementById("foodImage").value = "";

    document.getElementById("fileNameDisplay").textContent =
        "No file chosen";

}

function closeFoodModal(){
    document.getElementById("foodModal").style.display="none";
}

async function saveFood(){

    const formData = new FormData();


    const name =
        document.getElementById("foodName")
        .value
        .trim();


    const price =
        document.getElementById("foodPrice")
        .value
        .trim();


    const selectedCategory =
        document.getElementById("foodCategory")
        .value
        .trim();

    const customCategory =
        document.getElementById("customFoodCategory")
        .value
        .trim();

    let category = selectedCategory;


    const description =
        document.getElementById("foodDescription")
        .value
        .trim();


    const culturalInfo =
        document.getElementById("foodCulture")
        .value
        .trim();

    const isPopular =
        document.getElementById("foodIsPopular").checked;


    const image =
        document.getElementById("foodImage")
        .files[0];


    // ==========================
    // Meal Type
    // ==========================

    const mealTypes =
        Array.from(
            document.querySelectorAll(
                'input[name="mealType"]:checked'
            )
        ).map(checkbox => checkbox.value);


    // ==========================
    // ADD FOOD VALIDATION ONLY
    // ==========================

    if(!editingFoodId){

        if(!name){

            alert("Please enter the food name.");

            document.getElementById("foodName").focus();

            return;

        }


        if(!image){

            alert("Please upload a food image.");

            document.getElementById("foodImage").focus();

            return;

        }


        if(!price){

            alert("Please enter the food price.");

            document.getElementById("foodPrice").focus();

            return;

        }


        if(isNaN(price) || Number(price) <= 0){

            alert("Please enter a valid food price.");

            document.getElementById("foodPrice").focus();

            return;

        }


        if(!category){

            alert("Please select the category.");

            document.getElementById("foodCategory").focus();

            return;

        }


        if(selectedCategory === "Others"){

            if(!customCategory){

                alert("Please enter your category.");

                document.getElementById("customFoodCategory").focus();

                return;

            }

            category = customCategory;

        }


        if(mealTypes.length === 0){

            alert("Please select at least one meal type.");

            return;

        }


        if(!description){

            alert("Please enter the food description.");

            document.getElementById("foodDescription").focus();

            return;

        }


    }


    // ==========================
    // FormData
    // ==========================

    formData.append("name", name);

    if(image){

        formData.append("image", image);

    }

    formData.append("price", price);

    formData.append("category", category);

    formData.append(
        "mealType",
        JSON.stringify(mealTypes)
    );

    formData.append("description", description);

    formData.append("culturalInfo", culturalInfo);

    formData.append("isPopular", isPopular ? "true" : "false");


    // ==========================
    // Save
    // ==========================

    try{

        let url = "/menu/add";

        let method = "POST";


        if(editingFoodId){

            url = "/menu/edit/" + editingFoodId;

            method = "PUT";

        }


        const res = await fetch(url, {

            method,

            body: formData

        });


        const data = await res.json();


        if(data.success){

            alert(
                editingFoodId
                    ? "Food updated successfully!"
                    : "Food added successfully!"
            );


            document.getElementById("foodImage").value = "";

            document.getElementById("fileNameDisplay").textContent =
                "No file chosen";


            closeFoodModal();

            loadFoods();

            loadNotifications();

        }
        else{

            alert(data.message);

        }

    }
    catch(err){

        console.error(err);

        alert("Server error.");

    }

}

function addFoodRow(food){

    const table = document.getElementById("foodTableBody");

    const row = document.createElement("div");

    row.classList.add("table-row");

    row.innerHTML = `

        <div>
            ${
                food.image
                ? `<img
                    src="${food.image}"
                    class="food-img"
                    onclick="openImageModal('${food.image}')"
                >`
                : "-"
            }
        </div>

        <div>${food.name}</div>

        <div>RM${Number(food.price).toFixed(2)}</div>

        <div>${food.category}</div>

        <div>${(food.mealType || []).join(", ")}</div>

        <div>${food.description}</div>

        <div>${food.culturalInfo || "-"}</div>

        <div>

            <button
                class="btn edit"
                onclick="editFood('${food._id}')">
                Edit
            </button>

            <button
                class="btn delete"
                onclick="deleteFood('${food._id}')">
                Delete
            </button>

        </div>

    `;

    table.appendChild(row);

}

async function editFood(id){

    const res = await fetch("/menu");

    const data = await res.json();

    if(!data.success) return;


    const food = data.foods.find(f=>f._id===id);


    if(!food){

        alert("Food not found");

        return;

    }


    editingFoodId = id;

    document.getElementById("foodModalTitle").textContent = "Edit Food";

    document.getElementById("foodName").value = food.name;
    document.getElementById("foodPrice").value = food.price;
    
    const categorySelect =
        document.getElementById("foodCategory");

    const customCategory =
        document.getElementById("customFoodCategory");

    const predefinedCategories =
        Array.from(categorySelect.options)
            .map(option => option.value);

    if(predefinedCategories.includes(food.category)){

        categorySelect.value = food.category;

        customCategory.value = "";

        customCategory.style.display = "none";

    }
    else{

        categorySelect.value = "Others";

        customCategory.value = food.category;

        customCategory.style.display = "block";

    }

    document.getElementById("foodDescription").value = food.description;
    document.getElementById("foodCulture").value = food.culturalInfo;

    document.getElementById("foodIsPopular").checked =
        food.isPopular === true || food.isPopular === "true";

    // Load Meal Type
    document
        .querySelectorAll('input[name="mealType"]')
        .forEach(checkbox => {

            checkbox.checked =
                (food.mealType || []).includes(checkbox.value);

        });

    document.getElementById("foodImage").value = "";


    const currentFile = food.image
        ? food.image.split("/").pop()
        : "";


    document.getElementById("fileNameDisplay").textContent =
        currentFile;

    document.getElementById("foodModal").style.display="flex";

}

async function deleteFood(id){

    const confirmDelete = confirm(
        "Are you sure you want to delete this food?"
    );

    if(!confirmDelete) return;

    try{

        const res = await fetch("/menu/delete/" + id,{
            method:"DELETE"
        });

        const data = await res.json();

        if(data.success){

            alert("Food deleted successfully!");

            loadFoods();
            loadNotifications();

        }
        else{

            alert(data.message);

        }

    }
    catch(err){

        console.error(err);

        alert("Server error.");

    }

}


// ==========================
// Load Restaurant Reviews
// ==========================
async function loadReviews() {

    try {

        // Get current restaurant profile
        const restaurantResponse = await fetch("/restaurant/profile");

        const restaurantData = await restaurantResponse.json();

        if (!restaurantData.success) {

            console.error("Failed to get restaurant profile.");

            return;
        }

        const restaurant = restaurantData.restaurant;


        // Get reviews for this restaurant only
        const reviewResponse = await fetch(
            "/reviews/" + restaurant._id
        );

        reviews = await reviewResponse.json();


        // Display all reviews
        displayReviews(reviews);


        // Update charts
        updateReviewDoughnutChart();
        updateReviewAnalyticsChart();

    }
    catch (err) {

        console.error("Failed to load reviews:", err);

    }

}


// ==========================
// Display Reviews
// ==========================
function displayReviews(reviewData) {

    const container =
        document.getElementById("reviewList");

    container.innerHTML = "";

    document.getElementById("reviewResultCount").textContent =
        `Showing ${reviewData ? reviewData.length : 0} ${
            reviewData && reviewData.length === 1
                ? "result"
                : "results"
        }`;


    // ==========================
    // No Reviews
    // ==========================
    if (!reviewData || reviewData.length === 0) {

        container.innerHTML = `
            <div class="empty-message"> 
                No reviews available. 
            </div>
        `;

        return;
    }


    // ==========================
    // Display Reviews
    // ==========================
    reviewData.forEach(review => {

        // Format date
        const date =
            new Date(review.createdAt);


        const formattedDate =
            date.toLocaleDateString("en-MY", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });


        const formattedTime =
            date.toLocaleTimeString("en-MY", {
                hour: "2-digit",
                minute: "2-digit"
            });


        // ==========================
        // Generate Stars
        // ==========================
        const rating =
            Number(review.rating);


        const stars =
            "★".repeat(rating) +
            "☆".repeat(5 - rating);


        // ==========================
        // Create Review Card
        // ==========================
        const reviewCard =
            document.createElement("div");


        reviewCard.classList.add(
            "review-card"
        );


        reviewCard.innerHTML = `
            <div class="review-header">

                <span class="review-username">
                    ${review.userId?.username || "Anonymous"}
                </span>

                <span class="review-rating">
                    ${stars}
                </span>

            </div>

            <div class="review-comment">
                ${review.comment || "No comment provided."}
            </div>

            <div class="review-date">
                Posted by ${formattedDate} · ${formattedTime}
            </div>
        `;


        container.appendChild(reviewCard);

    });

}


// ==========================
// Filter Reviews
// ==========================
function filterReviews() {

    let filtered =
        [...reviews];


    // ==========================
    // Search
    // ==========================
    const search =
        document.getElementById("reviewSearch")
        .value
        .toLowerCase()
        .trim();


    if (search) {

        filtered =
            filtered.filter(review => {

                const username =
                    (
                        review.userId?.username ||
                        ""
                    )
                    .toLowerCase();


                const comment =
                    (
                        review.comment ||
                        ""
                    )
                    .toLowerCase();


                return (
                    username.includes(search) ||
                    comment.includes(search)
                );

            });

    }


    // ==========================
    // Rating Filter
    // ==========================
    const rating =
        document.getElementById("ratingFilter")
        .value;


    if (rating) {

        filtered =
            filtered.filter(review =>
                Number(review.rating) ===
                Number(rating)
            );

    }


    // ==========================
    // From Date
    // ==========================
    const dateFrom =
        document.getElementById("reviewDateFrom")
        .value;


    if (dateFrom) {

        filtered =
            filtered.filter(review => {

                const reviewDate =
                    new Date(review.createdAt);

                const fromDate =
                    new Date(dateFrom);

                fromDate.setHours(
                    0, 0, 0, 0
                );

                return reviewDate >= fromDate;

            });

    }


    // ==========================
    // To Date
    // ==========================
    const dateTo =
        document.getElementById("reviewDateTo")
        .value;


    if (dateTo) {

        filtered =
            filtered.filter(review => {

                const reviewDate =
                    new Date(review.createdAt);

                const toDate =
                    new Date(dateTo);

                // Include the entire selected day
                toDate.setHours(
                    23, 59, 59, 999
                );

                return reviewDate <= toDate;

            });

    }


    // ==========================
    // Display Filtered Reviews
    // ==========================
    displayReviews(filtered);

}


// ==========================
// Clear Review Filters
// ==========================
function clearReviewFilter() {

    document.getElementById("reviewSearch").value = "";

    document.getElementById("ratingFilter").value = "";

    document.getElementById("reviewDateFrom").value = "";

    document.getElementById("reviewDateTo").value = "";


    // Show all reviews again
    displayReviews(reviews);

}


/* =========================================
   ANNOUNCEMENTS
========================================= */

let announcements = [];
let editingAnnouncementId = null;

/* =========================================
   LOAD ANNOUNCEMENTS
========================================= */

async function loadAnnouncements() {

    try {

        const response =
            await fetch("/restaurant/announcements");

        const data =
            await response.json();


        if (!data.success) {

            console.error(
                data.message
            );

            return;

        }


        announcements =
            data.announcements || [];


        displayAnnouncements();

    }
    catch (err) {

        console.error(
            "Load announcements error:",
            err
        );

    }

}


/* =========================================
   DISPLAY ANNOUNCEMENTS
========================================= */

function displayAnnouncements(announcementData = announcements) {

    const list =
        document.getElementById(
            "announcementList"
        );


    if (!list) return;


    document.getElementById("announcementResultCount").textContent =
        `Showing ${announcementData ? announcementData.length : 0} ${
            announcementData && announcementData.length === 1
                ? "result"
                : "results"
        }`;


    if (!announcementData || announcementData.length === 0) {

        list.innerHTML = `
            <div class="empty-message">
                No announcements found.
            </div>
        `;

        return;

    }


    // Newest first
    const sortedAnnouncements =
        [...announcementData].sort(
            (a, b) =>
                new Date(b.startDate) -
                new Date(a.startDate)
        );


    list.innerHTML =
        sortedAnnouncements.map(
            announcement => {

                const status =
                    getAnnouncementStatus(
                        announcement.startDate,
                        announcement.endDate
                    );


                return `
                    <div class="announcement-card">

                        <div class="announcement-header">

                            <div>
                                <h3>
                                    ${escapeAnnouncementHTML(
                                        announcement.title
                                    )}
                                </h3>

                                <span class="
                                    announcement-status
                                    ${status.className}
                                ">
                                    ${status.text}
                                </span>
                            </div>

                            <div class="announcement-actions">

                                <button
                                    class="btn edit-announcement"
                                    onclick="editAnnouncement('${announcement._id}')"
                                >
                                    <i class="fa-solid fa-pen"></i>
                                    Edit
                                </button>

                                <button
                                    class="btn delete-announcement"
                                    onclick="deleteAnnouncement('${announcement._id}')"
                                >
                                    <i class="fa-solid fa-trash"></i>
                                    Delete
                                </button>

                            </div>

                        </div>


                        <p class="announcement-description">
                            ${escapeAnnouncementHTML(
                                announcement.description
                            )}
                        </p>


                        <div class="announcement-date">

                            <span>
                                <i class="fa-regular fa-calendar"></i>
                                ${formatAnnouncementDate(
                                    announcement.startDate
                                )}
                            </span>

                            <span>to</span>

                            <span>
                                ${formatAnnouncementDate(
                                    announcement.endDate
                                )}
                            </span>

                        </div>

                    </div>
                `;

            }
        ).join("");

}


/* =========================================
   FILTER ANNOUNCEMENTS
========================================= */

function filterAnnouncements() {

    let filtered =
        [...announcements];


    // ==========================
    // Search
    // ==========================

    const search =
        document.getElementById(
            "announcementSearch"
        ).value
        .toLowerCase()
        .trim();


    if (search) {

        filtered =
            filtered.filter(announcement => {

                const title =
                    (
                        announcement.title ||
                        ""
                    )
                    .toLowerCase();


                const description =
                    (
                        announcement.description ||
                        ""
                    )
                    .toLowerCase();


                return (
                    title.includes(search) ||
                    description.includes(search)
                );

            });

    }


    // ==========================
    // Status Filter
    // ==========================

    const selectedStatus =
        document.getElementById(
            "announcementStatusFilter"
        ).value;


    if (selectedStatus) {

        filtered =
            filtered.filter(announcement => {

                const status =
                    getAnnouncementStatus(
                        announcement.startDate,
                        announcement.endDate
                    );


                return status.text === selectedStatus;

            });

    }


    // ==========================
    // Date From
    // ==========================

    const dateFrom =
        document.getElementById(
            "announcementDateFrom"
        ).value;


    if (dateFrom) {

        filtered =
            filtered.filter(announcement => {

                const announcementEnd =
                    new Date(
                        announcement.endDate
                    );


                const fromDate =
                    new Date(dateFrom);


                fromDate.setHours(
                    0,
                    0,
                    0,
                    0
                );


                announcementEnd.setHours(
                    23,
                    59,
                    59,
                    999
                );


                return announcementEnd >= fromDate;

            });

    }


    // ==========================
    // Date To
    // ==========================

    const dateTo =
        document.getElementById(
            "announcementDateTo"
        ).value;


    if (dateTo) {

        filtered =
            filtered.filter(announcement => {

                const announcementStart =
                    new Date(
                        announcement.startDate
                    );


                const toDate =
                    new Date(dateTo);


                announcementStart.setHours(
                    0,
                    0,
                    0,
                    0
                );


                toDate.setHours(
                    23,
                    59,
                    59,
                    999
                );


                return announcementStart <= toDate;

            });

    }


    // ==========================
    // Display Filtered Results
    // ==========================

    displayAnnouncements(filtered);

}


/* =========================================
   CLEAR ANNOUNCEMENT FILTERS
========================================= */

function clearAnnouncementFilter() {

    document.getElementById(
        "announcementSearch"
    ).value = "";


    document.getElementById(
        "announcementStatusFilter"
    ).value = "";


    document.getElementById(
        "announcementDateFrom"
    ).value = "";


    document.getElementById(
        "announcementDateTo"
    ).value = "";


    // Show all announcements again
    displayAnnouncements(announcements);

}


/* =========================================
   ANNOUNCEMENT STATUS
========================================= */

function getAnnouncementStatus(
    startDate,
    endDate
) {

    const now =
        new Date();

    const start =
        new Date(startDate);

    const end =
        new Date(endDate);


    // End of the selected end date
    end.setHours(
        23,
        59,
        59,
        999
    );


    if (now < start) {

        return {

            text: "Upcoming",

            className:
                "status-upcoming"

        };

    }


    if (now > end) {

        return {

            text: "Expired",

            className:
                "status-expired"

        };

    }


    return {

        text: "Active",

        className:
            "status-active"

    };

}


/* =========================================
   FORMAT DATE
========================================= */

function formatAnnouncementDate(
    date
) {

    if (!date) return "-";


    const d =
        new Date(date);


    return d.toLocaleDateString(
        "en-MY",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================
   OPEN ADD MODAL
========================================= */

function openAnnouncementModal() {

    editingAnnouncementId = null;


    document.getElementById(
        "announcementModalTitle"
    ).textContent =
        "Add Announcement";


    document.getElementById(
        "announcementTitle"
    ).value = "";


    document.getElementById(
        "announcementDescription"
    ).value = "";


    document.getElementById(
        "announcementStartDate"
    ).value = "";


    document.getElementById(
        "announcementEndDate"
    ).value = "";


    document.getElementById(
        "announcementModal"
    ).style.display = "flex";

}


/* =========================================
   CLOSE MODAL
========================================= */

function closeAnnouncementModal() {

    document.getElementById(
        "announcementModal"
    ).style.display = "none";

}


/* =========================================
   EDIT ANNOUNCEMENT
========================================= */

function editAnnouncement(
    announcementId
) {

    const announcement =
        announcements.find(
            item =>
                item._id === announcementId
        );


    if (!announcement) {

        alert(
            "Announcement not found."
        );

        return;

    }


    editingAnnouncementId =
        announcementId;


    document.getElementById(
        "announcementModalTitle"
    ).textContent =
        "Edit Announcement";


    document.getElementById(
        "announcementTitle"
    ).value =
        announcement.title || "";


    document.getElementById(
        "announcementDescription"
    ).value =
        announcement.description || "";


    document.getElementById(
        "announcementStartDate"
    ).value =
        formatDateForInput(
            announcement.startDate
        );


    document.getElementById(
        "announcementEndDate"
    ).value =
        formatDateForInput(
            announcement.endDate
        );


    document.getElementById(
        "announcementModal"
    ).style.display = "flex";

}


/* =========================================
   FORMAT DATE FOR INPUT
========================================= */

function formatDateForInput(
    date
) {

    const d =
        new Date(date);


    const year =
        d.getFullYear();


    const month =
        String(
            d.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            d.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/* =========================================
   SAVE ANNOUNCEMENT
========================================= */

async function saveAnnouncement() {

    const title =
        document.getElementById(
            "announcementTitle"
        ).value.trim();


    const description =
        document.getElementById(
            "announcementDescription"
        ).value.trim();


    const startDate =
        document.getElementById(
            "announcementStartDate"
        ).value;


    const endDate =
        document.getElementById(
            "announcementEndDate"
        ).value;


    // ==========================
    // Validation
    // ==========================

    if (
        !title ||
        !description ||
        !startDate ||
        !endDate
    ) {

        alert(
            "Please fill in all announcement fields."
        );

        return;

    }


    if (endDate < startDate) {

        alert(
            "End date cannot be earlier than start date."
        );

        return;

    }


    try {

        const isEditing =
            Boolean(
                editingAnnouncementId
            );


        const url =
            isEditing
                ? `/restaurant/announcements/${editingAnnouncementId}`
                : "/restaurant/announcements";


        const method =
            isEditing
                ? "PUT"
                : "POST";


        const response =
            await fetch(
                url,
                {
                    method,
                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            title,

                            description,

                            startDate,

                            endDate

                        })

                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Failed to save announcement."
            );

            return;

        }


        alert(
            data.message
        );


        closeAnnouncementModal();


        editingAnnouncementId =
            null;


        await loadAnnouncements();

    }
    catch (err) {

        console.error(
            "Save announcement error:",
            err
        );

        alert(
            "Failed to save announcement."
        );

    }

}


/* =========================================
   DELETE ANNOUNCEMENT
========================================= */

async function deleteAnnouncement(
    announcementId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this announcement?"
        );


    if (!confirmed) return;


    try {

        const response =
            await fetch(
                `/restaurant/announcements/${announcementId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Failed to delete announcement."
            );

            return;

        }


        alert(
            data.message
        );


        await loadAnnouncements();

    }
    catch (err) {

        console.error(
            "Delete announcement error:",
            err
        );

        alert(
            "Failed to delete announcement."
        );

    }

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeAnnouncementHTML(
    text
) {

    return String(text || "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// load notifications
async function loadNotifications(){

    const res = await fetch("/menu/notifications");

    const data = await res.json();

    if(!data.success) return;


    const container =
        document.getElementById("notificationList");


    container.innerHTML="";


    let unreadCount = 0;


    data.notifications.forEach(n=>{


        if(!n.isRead){

            unreadCount++;

        }


        container.innerHTML += `

        <div class="notification-card 
            ${n.isRead ? "read" : "unread"}">


            <div class="notification-message">

                <i class="fa-solid fa-bell"></i>

                <div class="notification-text">
                    ${n.message.replace(/\n/g, "<br>")}
                </div>

            </div>


            <div class="notification-time">

                ${new Date(n.createdAt)
                .toLocaleString()}

            </div>


        </div>


        `;


    });



    document.getElementById("notificationBadge")
    .textContent = unreadCount;



    if(unreadCount === 0){

        document.getElementById("notificationBadge")
        .style.display="none";

    }
    else{

        document.getElementById("notificationBadge")
        .style.display="inline-block";

    }


}

function openNotifications(){
    showSection("notifications");
}

function openImageModal(image){
    document.getElementById("modalImage").src = image;
    document.getElementById("imageModal").style.display = "flex";
}

function closeImageModal(){
    document.getElementById("imageModal").style.display = "none";
}

document.getElementById("imageModal")
.addEventListener("click", function(e){

    if(e.target === this){
        closeImageModal();
    }

});



function toggleRestaurantConversation(requestId) {
    const conversation = document.getElementById(
        `restaurantConversation-${requestId}`
    );

    const toggleText = document.getElementById(
        `conversationToggleText-${requestId}`
    );

    const toggleIcon = document.getElementById(
        `conversationToggleIcon-${requestId}`
    );

    if (!conversation || !toggleText || !toggleIcon) return;

    const isHidden = conversation.style.display === "none";

    conversation.style.display = isHidden ? "block" : "none";

    toggleText.textContent = isHidden
        ? "Close Conversation"
        : "Show Conversation";

    toggleIcon.className = isHidden
        ? "fa-solid fa-chevron-up"
        : "fa-solid fa-chevron-down";

    expandedRestaurantSupportRequestId = isHidden
        ? String(requestId)
        : null;
}



// ==========================
// Initialize
// ==========================
document.addEventListener("DOMContentLoaded", async () => {

    loadStates();

    await loadRestaurant();

    loadFoods();

    loadNotifications();

    loadReviews();

    loadAnnouncements();


    // ==========================
    // Food Image File Name
    // ==========================

    document.getElementById("foodImage")
    .addEventListener("change", function(){

        if(this.files.length > 0){

            document.getElementById("fileNameDisplay").textContent =
                this.files[0].name;

        }
        else{

            document.getElementById("fileNameDisplay").textContent =
                "No file chosen";

        }

    });

    // ==========================
    // Restaurant Image File Name
    // ==========================

    document.getElementById("restaurantImage")
    .addEventListener("change", function () {

        const file = this.files[0];

        if (file) {

            // Show selected file name
            document.getElementById("restaurantFileNameDisplay").textContent =
                file.name;


            // Preview selected image immediately
            const reader = new FileReader();

            reader.onload = function (e) {

                document.getElementById("imagePreview").src =
                    e.target.result;

                document.getElementById("imagePreview").style.display =
                    "block";

                // Hide "No restaurant image"
                document.getElementById("noRestaurantImage").style.display =
                    "none";
            };

            reader.readAsDataURL(file);

        }
        else {

            document.getElementById("restaurantFileNameDisplay").textContent =
                "No file chosen";

        }

    });


    // ==========================
    // Food Filters
    // ==========================

    document.getElementById("foodSearch")
    .addEventListener("input", filterFoods);


    document.getElementById("priceFilter")
    .addEventListener("change", filterFoods);


    document.getElementById("categoryFilter")
    .addEventListener("change", filterFoods);


    document.getElementById("mealTypeFilter")
    .addEventListener("change", filterFoods);


    // ==========================
    // Review Filters
    // ==========================

    document.getElementById("reviewSearch")
    .addEventListener("input", filterReviews);


    document.getElementById("ratingFilter")
    .addEventListener("change", filterReviews);


    document.getElementById("reviewDateFrom")
    .addEventListener("change", filterReviews);


    document.getElementById("reviewDateTo")
    .addEventListener("change", filterReviews);


    // ==========================
    // Announcement Filters
    // ==========================

    document.getElementById("announcementSearch")
    .addEventListener("input", filterAnnouncements);


    document.getElementById("announcementStatusFilter")
    .addEventListener("change", filterAnnouncements);


    document.getElementById("announcementDateFrom")
    .addEventListener("change", filterAnnouncements);


    document.getElementById("announcementDateTo")
    .addEventListener("change", filterAnnouncements);


    // ==========================
    // Opening Hours
    // ==========================

    openingDays.forEach(day => {

        const checkbox =
            document.getElementById(`${day}Open`);

        checkbox.addEventListener("change", () => {

            updateOpeningDayState(day);

        });

    });


    // ==========================
    // Notification Auto Refresh
    // ==========================

    setInterval(() => {

        loadNotifications();

    }, 5000);

});