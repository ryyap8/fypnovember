const params = new URLSearchParams(window.location.search);
const restaurantId = params.get("id");


function getPriceDisplay(priceRange) {

    const activeCount =
        (priceRange || "").length;

    let priceHTML = "";

    for (let i = 1; i <= 4; i++) {
        if (i <= activeCount) {
            priceHTML +=
                `<span class="price-symbol active">$</span>`;
        } else {
            priceHTML +=
                `<span class="price-symbol">$</span>`;
        }
    }

    return priceHTML;
}


// ================================
// Opening Hours
// ================================

const openingDays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
];

const openingDayNames = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday"
};


// Convert HH:mm to minutes
function timeToMinutes(time) {

    if (!time) return null;

    const [hour, minute] =
        time.split(":").map(Number);

    return (hour * 60) + minute;

}


// Convert HH:mm to 12-hour display
function formatOpeningTime(time) {

    if (!time) return "";

    const [hourString, minute] =
        time.split(":");

    let hour = Number(hourString);

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


// Get sessions for a day
function getDaySessions(data) {

    if (!data || !data.isOpen) {
        return [];
    }

    const sessions = [];

    if (data.open1 && data.close1) {

        sessions.push({
            open: data.open1,
            close: data.close1
        });

    }

    if (data.open2 && data.close2) {

        sessions.push({
            open: data.open2,
            close: data.close2
        });

    }

    return sessions;

}


// Display full weekly schedule
function displayOpeningHours(openingHours) {

    const schedule =
        document.getElementById("openingHoursSchedule");

    if (!schedule) return;

    schedule.innerHTML = "";

    if (
        !openingHours ||
        typeof openingHours !== "object"
    ) {

        schedule.innerHTML = `
            <div class="opening-hours-day">
                <span>No opening hours available.</span>
            </div>
        `;

        return;

    }


    openingDays.forEach(day => {

        const data =
            openingHours[day];

        const row =
            document.createElement("div");

        row.className =
            "opening-hours-day";


        if (!data || !data.isOpen) {

            row.innerHTML = `
                <strong>${openingDayNames[day]}</strong>
                <span>Closed</span>
            `;

        }
        else {

            const sessions =
                getDaySessions(data);

            if (sessions.length === 0) {

                row.innerHTML = `
                    <strong>${openingDayNames[day]}</strong>
                    <span>-</span>
                `;

            }
            else {

                const sessionHTML =
                    sessions
                        .map(session => `
                            ${formatOpeningTime(session.open)}
                            -
                            ${formatOpeningTime(session.close)}
                        `)
                        .join("<br>");

                row.innerHTML = `
                    <strong>${openingDayNames[day]}</strong>
                    <span>${sessionHTML}</span>
                `;

            }

        }


        schedule.appendChild(row);

    });

}


// ================================
// Opening Status
// ================================

function getOpeningStatus(openingHours) {

    if (
        !openingHours ||
        typeof openingHours !== "object"
    ) {

        return {
            text: "Opening hours unavailable",
            className: "closed"
        };

    }


    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();


    const todayIndex =
        now.getDay() === 0
            ? 6
            : now.getDay() - 1;


    const yesterdayIndex =
        todayIndex === 0
            ? 6
            : todayIndex - 1;


    const today =
        openingDays[todayIndex];

    const yesterday =
        openingDays[yesterdayIndex];


    const todayData =
        openingHours[today];

    const yesterdayData =
        openingHours[yesterday];


    // ================================
    // Check overnight session
    // from yesterday
    // ================================

    const yesterdaySessions =
        getDaySessions(yesterdayData);


    for (const session of yesterdaySessions) {

        const openTime =
            timeToMinutes(session.open);

        const closeTime =
            timeToMinutes(session.close);


        // Overnight session
        // Example: 18:00 - 02:00
        if (
            closeTime < openTime &&
            currentMinutes < closeTime
        ) {

            const minutesUntilClose =
                closeTime - currentMinutes;

            if (minutesUntilClose <= 60) {

                return {
                    text: "Closing Soon",
                    className: "closing-soon"
                };

            }

            return {
                text: "Open Now",
                className: "open"
            };

        }

    }


    // ================================
    // Check today's sessions
    // ================================

    const todaySessions =
        getDaySessions(todayData);


    if (todaySessions.length === 0) {

        return {
            text: "Closed Today",
            className: "closed"
        };

    }


    // ================================
    // Check if currently open
    // ================================

    for (const session of todaySessions) {

        const openTime =
            timeToMinutes(session.open);

        const closeTime =
            timeToMinutes(session.close);


        // Overnight session
        if (closeTime < openTime) {

            if (currentMinutes >= openTime) {

                const minutesUntilClose =
                    (24 * 60 - currentMinutes) +
                    closeTime;

                if (minutesUntilClose <= 60) {

                    return {
                        text: "Closing Soon",
                        className: "closing-soon"
                    };

                }

                return {
                    text: "Open Now",
                    className: "open"
                };

            }

        }


        // Normal session
        else {

            if (
                currentMinutes >= openTime &&
                currentMinutes < closeTime
            ) {

                const minutesUntilClose =
                    closeTime - currentMinutes;

                if (minutesUntilClose <= 60) {

                    return {
                        text: "Closing Soon",
                        className: "closing-soon"
                    };

                }

                return {
                    text: "Open Now",
                    className: "open"
                };

            }

        }

    }


    // ================================
    // Find next opening time today
    // ================================

    let nextOpeningMinutes = null;


    for (const session of todaySessions) {

        const openTime =
            timeToMinutes(session.open);

        const closeTime =
            timeToMinutes(session.close);


        // For a normal session, check
        // if it has not started yet
        if (
            closeTime >= openTime &&
            currentMinutes < openTime
        ) {

            if (
                nextOpeningMinutes === null ||
                openTime < nextOpeningMinutes
            ) {

                nextOpeningMinutes = openTime;

            }

        }


        // For an overnight session,
        // opening is still later today
        if (
            closeTime < openTime &&
            currentMinutes < openTime
        ) {

            if (
                nextOpeningMinutes === null ||
                openTime < nextOpeningMinutes
            ) {

                nextOpeningMinutes = openTime;

            }

        }

    }


    if (nextOpeningMinutes !== null) {

        const minutesUntilOpen =
            nextOpeningMinutes - currentMinutes;

        if (
            minutesUntilOpen > 0 &&
            minutesUntilOpen <= 60
        ) {

            return {
                text: "Opening Soon",
                className: "soon"
            };

        }

        return {
            text: "Closed Now",
            className: "closed"
        };

    }


    // ================================
    // No more sessions today
    // ================================

    return {
        text: "Closed Today",
        className: "closed"
    };

}


// Update status on page
function updateOpeningStatus(openingHours) {

    const status =
        document.getElementById(
            "restaurantOpeningStatus"
        );

    if (!status) return;


    const result =
        getOpeningStatus(openingHours);


    status.textContent =
        result.text;

    status.className =
        `opening-status ${result.className}`;

}


// ================================
// Refresh opening status every minute
// ================================

let currentOpeningHours = null;

setInterval(() => {

    if (currentOpeningHours) {

        updateOpeningStatus(
            currentOpeningHours
        );

    }

}, 60000);


// ================================
// Opening Hours Toggle
// ================================

const openingHoursBtn =
    document.getElementById("openingHoursBtn");

const openingHoursSchedule =
    document.getElementById("openingHoursSchedule");


if (
    openingHoursBtn &&
    openingHoursSchedule
) {

    openingHoursBtn.addEventListener(
        "click",
        () => {

            openingHoursSchedule.classList.toggle(
                "show"
            );

            openingHoursBtn.classList.toggle(
                "active"
            );

        }
    );

}


// Load restaurant details
fetch(`/restaurants/${restaurantId}`)
    .then(res => res.json())
    .then(restaurant => {

        if (!restaurant) {
            document.body.innerHTML = "<h2>Restaurant not found</h2>";
            return;
        }


        document.getElementById("restaurantImage").src = restaurant.image;
        document.getElementById("restaurantName").textContent =
        restaurant.branch
            ? `${restaurant.restaurantName} ${restaurant.branch}`
            : restaurant.restaurantName;


        const avgRating = parseFloat(restaurant.averageRating || 0);
        const totalRatings = restaurant.totalRatings || 0;


        document.getElementById("restaurantRating").innerText =
            avgRating.toFixed(1);

        document.getElementById("restaurantTotalRatings").innerText =
            totalRatings;


        // Keep price for now
        document.getElementById("restaurantPrice").innerHTML =
            getPriceDisplay(restaurant.priceRange);


        document.getElementById("restaurantAddress").innerText =
            restaurant.fullAddress || "";


        currentOpeningHours =
            restaurant.openingHours;

        displayOpeningHours(
            currentOpeningHours
        );

        updateOpeningStatus(
            currentOpeningHours
        );

        
        document.getElementById("restaurantContactNumber").innerText =
            restaurant.contactNumber || "-";

        // ================================
        // Social Media
        // ================================

        const socialMediaSection =
            document.getElementById("socialMediaSection");

        const facebookLink =
            document.getElementById("facebookLink");

        const instagramLink =
            document.getElementById("instagramLink");

        const tiktokLink =
            document.getElementById("tiktokLink");


        const socialMedia =
            restaurant.socialMedia || {};


        // Hide everything first
        socialMediaSection.style.display = "none";


        // Facebook
        if (socialMedia.facebook) {

            facebookLink.href =
                socialMedia.facebook;

            facebookLink.style.display = "flex";

        } else {

            facebookLink.style.display = "none";

        }


        // Instagram
        if (socialMedia.instagram) {

            instagramLink.href =
                socialMedia.instagram;

            instagramLink.style.display = "flex";

        } else {

            instagramLink.style.display = "none";

        }


        // TikTok
        if (socialMedia.tiktok) {

            tiktokLink.href =
                socialMedia.tiktok;

            tiktokLink.style.display = "flex";

        } else {

            tiktokLink.style.display = "none";

        }


        // Show Follow Us only if at least
        // one social media link exists
        if (
            socialMedia.facebook ||
            socialMedia.instagram ||
            socialMedia.tiktok
        ) {

            socialMediaSection.style.display = "block";

        }


        document.getElementById("restaurantGoogleMapsLink").href =
            restaurant.googleMapsLink || "#";


        // Cuisine
        const cuisineEl = document.getElementById("restaurantCuisine");

        cuisineEl.innerText = restaurant.cuisine || "";

        if (restaurant.cuisine) {
            cuisineEl.className =
                `tag ${restaurant.cuisine.toLowerCase().trim()}`;
        }

        // Halal Status
        const halalEl =
            document.getElementById("restaurantHalalStatus");

        halalEl.innerText =
            restaurant.halalStatus || "";


        // Description
        document.getElementById("restaurantDescription").innerText =
            restaurant.restaurantDescription || "";

        // Announcements
        loadAnnouncements(
            restaurant.announcements || []
        );

        // Restaurant History
        document.getElementById("restaurantHistory").innerText =
            restaurant.restaurantHistory || 
            "This restaurant does not provide its history.";


        loadReviews();
        updateRestaurantRating();

    })
    .catch(err => {

        console.error(err);

        document.body.innerHTML =
            "<h2>Error loading restaurant</h2>";

    });


// ================================
// Copy Contact Number
// ================================

const copyContactBtn =
    document.getElementById("copyContactNumber");

if (copyContactBtn) {

    copyContactBtn.addEventListener("click", async () => {

        const contactNumber =
            document.getElementById("restaurantContactNumber")
                .innerText.trim();


        // Do nothing if no contact number
        if (!contactNumber || contactNumber === "-") {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                contactNumber
            );


            const icon =
                copyContactBtn.querySelector("i");


            // Change icon to check
            icon.className =
                "fa-solid fa-check";

            copyContactBtn.title =
                "Copied!";


            // Change back after 1.5 seconds
            setTimeout(() => {

                icon.className =
                    "fa-regular fa-copy";

                copyContactBtn.title =
                    "Copy contact number";

            }, 1500);


        } catch (error) {

            console.error(
                "Failed to copy contact number:",
                error
            );

        }

    });

}


// History toggle
const historyBtn = document.getElementById("historyBtn");
const historyBox = document.getElementById("historyBox");

historyBtn.addEventListener("click", () => {

    if (historyBox.style.display === "block") {

        historyBox.style.display = "none";

        historyBtn.innerHTML =
            `<i class="fa-solid fa-scroll"></i> View Restaurant History`;

    } else {

        historyBox.style.display = "block";

        historyBtn.innerHTML =
            `<i class="fa-solid fa-scroll"></i> Hide Restaurant History`;

    }

});


// ================================
// Restaurant Menu
// ================================

let allRestaurantFoods = [];
let selectedCategory = "All";


// ================================
// Load Restaurant Menu
// ================================

async function loadRestaurantMenu() {

    try {

        const res = await fetch(`/menu/restaurant/${restaurantId}`);
        const data = await res.json();

        if (!data.success) {

            console.error(data.message);
            return;

        }


        const container =
            document.getElementById("restaurantMenu");

        const categoryContainer =
            document.getElementById("menuCategories");

        container.innerHTML = "";
        categoryContainer.innerHTML = "";


        if (!data.foods || data.foods.length === 0) {

            container.innerHTML = `
                <div class="empty-menu">

                    <i class="fa-solid fa-book-open"></i>

                    <p>Sorry, no menu items available.</p>

                </div>
            `;

            return;

        }


        // Store all foods
        allRestaurantFoods = data.foods;


        // ================================
        // Create Category Buttons
        // ================================

        const categories = [
            ...new Set(
                data.foods
                    .map(food => food.category)
                    .filter(
                        category =>
                            category &&
                            category.trim() !== ""
                    )
            )
        ];


        // All button

        const allButton =
            document.createElement("button");

        allButton.className =
            "menu-category-btn active";

        allButton.textContent = "All";

        categoryContainer.appendChild(allButton);


        allButton.addEventListener("click", () => {

            selectedCategory = "All";

            document
                .querySelectorAll(".menu-category-btn")
                .forEach(btn => {
                    btn.classList.remove("active");
                });

            allButton.classList.add("active");

            applyMenuFilters();

        });


        // Other categories

        categories.forEach(category => {

            const button =
                document.createElement("button");

            button.className =
                "menu-category-btn";

            button.textContent = category;


            button.addEventListener("click", () => {

                selectedCategory = category;

                document
                    .querySelectorAll(".menu-category-btn")
                    .forEach(btn => {
                        btn.classList.remove("active");
                    });

                button.classList.add("active");

                applyMenuFilters();

            });


            categoryContainer.appendChild(button);

        });


        // ================================
        // Create Meal Type Options
        // ================================

        const mealTypeSelect =
            document.getElementById("menuMealType");

        mealTypeSelect.innerHTML = `
            <option value="">All Meal Types</option>
        `;


        const mealTypes = [
            ...new Set(
                data.foods
                    .flatMap(food =>
                        Array.isArray(food.mealType)
                            ? food.mealType
                            : []
                    )
                    .filter(
                        type =>
                            type &&
                            type.trim() !== ""
                    )
            )
        ];


        mealTypes.forEach(type => {

            const option =
                document.createElement("option");

            option.value = type;
            option.textContent = type;

            mealTypeSelect.appendChild(option);

        });


        // ================================
        // Initial Display
        // ================================

        applyMenuFilters();


        // ================================
        // Search
        // ================================

        document
            .getElementById("menuSearch")
            .addEventListener("input", applyMenuFilters);


        // ================================
        // Sort
        // ================================

        document
            .getElementById("menuSort")
            .addEventListener("change", applyMenuFilters);


        // ================================
        // Meal Type Filter
        // ================================

        document
            .getElementById("menuMealType")
            .addEventListener("change", applyMenuFilters);


        // ================================
        // Clear Button
        // ================================

        document
            .getElementById("clearMenuFilters")
            .addEventListener("click", clearMenuFilters);

    }

    catch (err) {

        console.error(
            "Failed to load restaurant menu:",
            err
        );

    }

}


// ================================
// Apply All Menu Filters
// ================================

function applyMenuFilters() {

    let filteredFoods =
        [...allRestaurantFoods];


    // ================================
    // Search
    // ================================

    const searchInput =
        document.getElementById("menuSearch");

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    if (searchText) {

        filteredFoods =
            filteredFoods.filter(food => {

                const name =
                    (food.name || "").toLowerCase();

                const description =
                    (food.description || "").toLowerCase();

                const culturalInfo =
                    (food.culturalInfo || "").toLowerCase();


                return (
                    name.includes(searchText) ||
                    description.includes(searchText) ||
                    culturalInfo.includes(searchText)
                );

            });

    }


    // ================================
    // Category
    // ================================

    if (selectedCategory !== "All") {

        filteredFoods =
            filteredFoods.filter(food =>
                food.category === selectedCategory
            );

    }


    // ================================
    // Meal Type
    // ================================

    const selectedMealType =
        document.getElementById("menuMealType").value;


    if (selectedMealType) {

        filteredFoods =
            filteredFoods.filter(food => {

                if (!Array.isArray(food.mealType)) {
                    return false;
                }

                return food.mealType.includes(
                    selectedMealType
                );

            });

    }


    // ================================
    // Sort Menu
    // ================================

    const sortValue =
        document.getElementById("menuSort").value;


    // ================================
    // Price Sorting Selected
    // ================================

    if (sortValue === "low-high") {

        filteredFoods.sort(
            (a, b) =>
                Number(a.price) - Number(b.price)
        );

    }
    else if (sortValue === "high-low") {

        filteredFoods.sort(
            (a, b) =>
                Number(b.price) - Number(a.price)
        );

    }


    // ================================
    // No Sorting → Popular Food First
    // ================================

    else {

        filteredFoods.sort((a, b) => {

            const popularA =
                a.isPopular === true ? 1 : 0;

            const popularB =
                b.isPopular === true ? 1 : 0;

            return popularB - popularA;

        });

    }


    // Display results

    displayMenuItems(filteredFoods);

}


// ================================
// Display Menu Items
// ================================

function displayMenuItems(foods) {

    const container =
        document.getElementById("restaurantMenu");

    container.innerHTML = "";


    if (foods.length === 0) {

        container.innerHTML = `
            <div class="empty-menu">

                <i class="fa-solid fa-magnifying-glass"></i>

                <p>
                    No food items match your search or filters.
                </p>

            </div>
        `;

        return;

    }


    foods.forEach(food => {

        const item =
            document.createElement("div");

        item.className = "menu-item";


        item.innerHTML = `

            <div class="menu-food-image">

                ${
                    food.image
                    ?
                    `<img
                        src="${food.image}"
                        alt="${food.name}"
                    >`
                    :
                    `<i class="fa-solid fa-utensils"></i>`
                }

            </div>


            <div class="menu-food-info">

                <div class="menu-food-header">

                    <h3>
                        ${food.name}
                        ${
                            food.isPopular
                                ? '<i class="fa-solid fa-fire popular-food-icon" title="Popular Food"></i>'
                                : ''
                        }
                    </h3>

                    <span class="menu-price">
                        RM${Number(food.price).toFixed(2)}
                    </span>

                </div>


                <span class="menu-category">
                    ${food.category || ""}
                </span>


                <p class="menu-description">
                    ${food.description || ""}
                </p>


                <span class="menu-view-details">

                    View Details

                    <i class="fa-solid fa-arrow-right"></i>

                </span>

            </div>

        `;


        // Make food card clickable

        item.addEventListener("click", () => {

            openFoodDetails(food);

        });


        container.appendChild(item);

    });

}


// ================================
// Clear Menu Filters
// ================================

function clearMenuFilters() {

    // Clear search

    document.getElementById("menuSearch").value = "";


    // Reset sort

    document.getElementById("menuSort").value = "";


    // Reset meal type

    document.getElementById("menuMealType").value = "";


    // Reset category

    selectedCategory = "All";


    // Reset category buttons

    document
        .querySelectorAll(".menu-category-btn")
        .forEach(btn => {
            btn.classList.remove("active");
        });


    const allButton =
        document.querySelector(
            ".menu-category-btn"
        );


    if (allButton) {
        allButton.classList.add("active");
    }


    // Show everything again

    applyMenuFilters();

}


// ================================
// Food Details Modal
// ================================

function openFoodDetails(food) {

    const modal = document.getElementById("foodDetailsModal");

    const image = document.getElementById("modalFoodImage");
    const name = document.getElementById("modalFoodName");
    const price = document.getElementById("modalFoodPrice");
    const category = document.getElementById("modalFoodCategory");
    const mealType = document.getElementById("modalFoodMealType");
    const description = document.getElementById("modalFoodDescription");
    const culturalInfo = document.getElementById("modalFoodCulturalInfo");

    // Image
    if (food.image) {

        image.src = food.image;
        image.style.display = "block";

    } else {

        image.style.display = "none";

    }

    // Food information
    name.textContent = food.name;
    price.textContent = `RM${Number(food.price).toFixed(2)}`;

    category.textContent = food.category || "";

    mealType.textContent =
        (food.mealType || []).join(", ");

    description.textContent =
        food.description || "No description available.";

    culturalInfo.textContent =
        food.culturalInfo || "No cultural information available.";

    // Show modal
    modal.classList.add("show");

    // Prevent background scrolling
    document.body.style.overflow = "hidden";
}


function closeFoodDetails() {

    const modal = document.getElementById("foodDetailsModal");

    modal.classList.remove("show");

    // Allow scrolling again
    document.body.style.overflow = "";

}


// Close when clicking outside the modal
document.getElementById("foodDetailsModal").addEventListener("click", function(e) {

    if (e.target === this) {
        closeFoodDetails();
    }

});


// Close with ESC key
document.addEventListener("keydown", function(e) {

    if (e.key === "Escape") {
        closeFoodDetails();
    }

});


// =======================
// SHARE RESTAURANT
// =======================

const shareBtn = document.getElementById("shareBtn");

if (shareBtn) {

    shareBtn.addEventListener("click", async () => {

        const restaurantName =
            document.getElementById("restaurantName").textContent;

        const shareUrl = window.location.href;

        // Mobile / supported browsers
        if (navigator.share) {

            try {

                await navigator.share({
                    title: restaurantName,
                    text: `Check out ${restaurantName} on FoodRoutes!`,
                    url: shareUrl
                });

            } catch (error) {

                // User cancelled sharing
                if (error.name !== "AbortError") {
                    console.error("Share failed:", error);
                }

            }

        } else {

            // Desktop fallback
            try {

                await navigator.clipboard.writeText(shareUrl);

                alert("Restaurant link copied!");

            } catch (error) {

                console.error("Could not copy link:", error);

                alert("Unable to copy the restaurant link.");
            }

        }

    });

}


// ================================
// Restaurant Announcements
// ================================

// ================================
// Restaurant Announcements
// ================================

function loadAnnouncements(announcements) {

    const container =
        document.getElementById("restaurantAnnouncements");

    if (!container) return;

    container.innerHTML = "";

    const now = new Date();


    // ================================
    // Show only active announcements
    // ================================

    const activeAnnouncements =
        (announcements || []).filter(announcement => {

            const start =
                new Date(announcement.startDate);

            const end =
                new Date(announcement.endDate);


            // End date lasts until the end
            // of that day
            end.setHours(
                23,
                59,
                59,
                999
            );


            return (
                now >= start &&
                now <= end
            );

        });


    // ================================
    // No active announcements
    // ================================

    if (activeAnnouncements.length === 0) {

        container.innerHTML = `
            <div class="empty-announcements">

                <i class="fa-solid fa-bullhorn"></i>

                <p>
                    No announcements available.
                </p>

            </div>
        `;

        return;

    }


    // ================================
    // Sort newest first
    // ================================

    const sortedAnnouncements =
        [...activeAnnouncements].sort(
            (a, b) =>
                new Date(b.startDate) -
                new Date(a.startDate)
        );


    // ================================
    // Display announcements
    // ================================

    sortedAnnouncements.forEach(announcement => {

        const card =
            document.createElement("div");

        card.className =
            "restaurant-announcement-card";


        card.innerHTML = `

            <div class="restaurant-announcement-header">

                <div>

                    <h3>
                        ${escapeAnnouncementHTML(
                            announcement.title
                        )}
                    </h3>

                </div>

                <i class="fa-solid fa-bullhorn announcement-icon"></i>

            </div>


            <p class="restaurant-announcement-description">
                ${escapeAnnouncementHTML(
                    announcement.description
                )}
            </p>

        `;


        container.appendChild(card);

    });

}

/* =========================================
   AUTO LOAD ANNOUNCEMENTS
========================================= */

setInterval(async function () {

    try {

        const response =
            await fetch(`/restaurants/${restaurantId}`);

        const restaurant =
            await response.json();

        if (!response.ok) return;

        loadAnnouncements(
            restaurant.announcements || []
        );

    } catch (err) {

        console.error(
            "Auto load announcements error:",
            err
        );

    }

}, 5000);


function escapeAnnouncementHTML(text) {

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function setupReviewForm() {

    const reviewBtn =
        document.querySelector(".submit-review-btn");

    const textarea =
        document.querySelector(".review-box textarea");

    const stars =
        document.querySelectorAll("#starRating i");


    if (!reviewBtn || !textarea || !stars.length) {
        return;
    }


    let selectedRating = 0;


    // ==========================
    // Star Hover + Click
    // ==========================

    stars.forEach(star => {

        // Hover over star
        star.addEventListener("mouseover", () => {

            const value =
                Number(star.dataset.value);


            stars.forEach(s => {

                if (
                    Number(s.dataset.value) <= value
                ) {

                    s.classList.add("hover");

                } else {

                    s.classList.remove("hover");

                }

            });

        });


        // Click star
        star.addEventListener("click", () => {

            selectedRating =
                Number(star.dataset.value);


            highlightReviewStars(
                stars,
                selectedRating
            );

        });

    });


    // ==========================
    // Mouse Leave
    // ==========================

    const starContainer =
        document.getElementById("starRating");


    if (starContainer) {

        starContainer.addEventListener(
            "mouseleave",
            () => {

                highlightReviewStars(
                    stars,
                    selectedRating
                );

            }
        );

    }


    // ==========================
    // Submit Review
    // ==========================

    reviewBtn.addEventListener(
        "click",
        async () => {

            const comment =
                textarea.value.trim();


            if (!selectedRating || !comment) {

                alert(
                    "Please give rating and write a review"
                );

                return;

            }


            const data = {

                restaurantId,
                rating: selectedRating,
                comment

            };


            try {

                const res =
                    await fetch("/reviews", {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(data)

                    });


                const result =
                    await res.json();


                if (result.success) {

                    await loadReviews();

                    await updateRestaurantRating();

                    alert(result.message);

                }

                else {

                    alert(
                        result.message ||
                        "Failed to add review."
                    );

                }

            }

            catch (err) {

                console.error(err);

                alert(
                    "Something went wrong."
                );

            }

        }
    );

}


function highlightReviewStars(
    stars,
    rating
) {

    stars.forEach(star => {

        const value =
            Number(star.dataset.value);

        star.classList.remove("hover");

        if (value <= rating) {

            star.classList.add("selected");

        } else {

            star.classList.remove("selected");

        }

    });

}


// ================================
// Load Reviews
// ================================

let allReviews = [];

async function loadReviews() {

    const res = await fetch(`/reviews/${restaurantId}`);

    const data = await res.json();

    allReviews = Array.isArray(data) ? data : [];


    // ==============================
    // Get Current User
    // ==============================

    let currentUserId = null;

    try {

        const userRes =
            await fetch("/auth/currentUser");

        const userData =
            await userRes.json();

        if (
            userData.loggedIn &&
            userData.role === "user"
        ) {

            currentUserId =
                String(userData.userId);

        }

    } catch (err) {

        console.error(
            "Failed to get current user:",
            err
        );

    }


    // ==============================
    // Find User's Review
    // ==============================

    let myReview = null;

    if (currentUserId) {

        myReview =
            allReviews.find(review => {

                if (
                    !review.userId ||
                    !review.userId._id
                ) {
                    return false;
                }

                return (
                    String(review.userId._id) ===
                    currentUserId
                );

            });

    }


    // ==============================
    // Update Review Box
    // ==============================

    const reviewBox =
        document.querySelector(".review-box");


    if (reviewBox) {

        // ==========================
        // User already reviewed
        // ==========================

        
        if (myReview) {

            // Create a wrapper only if it does not already exist
            let wrapper = document.getElementById("yourReviewWrapper");

            if (!wrapper) {
                wrapper = document.createElement("div");
                wrapper.id = "yourReviewWrapper";

                reviewBox.replaceWith(wrapper);
            }

            wrapper.innerHTML = `

                <h3 class="your-review-title">
                    Your Review
                </h3>

                <div class="review-box your-review-card" id="yourReviewBox">

                    <div class="review-header">

                        <div class="review-user">

                            ${
                                myReview.userId.profileImage
                                    ? `
                                        <img
                                            src="${myReview.userId.profileImage}"
                                            alt="${myReview.userId.username}"
                                            class="review-profile-picture"
                                        >
                                    `
                                    : `
                                        <div class="review-profile-placeholder">
                                            <i class="fa-solid fa-user"></i>
                                        </div>
                                    `
                            }

                            <h4>${myReview.userId.username}</h4>

                        </div>
                        
                        <span class="review-date">
                            ${
                                myReview.updatedAt
                                    ? `Edited by ${new Date(myReview.updatedAt)
                                        .toLocaleString([], {
                                            day: "numeric",
                                            month: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true
                                        })
                                        .replace(",", " •")}`
                                    : new Date(myReview.createdAt)
                                        .toLocaleString([], {
                                            day: "numeric",
                                            month: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true
                                        })
                                        .replace(",", " •")
                            }
                        </span>

                    </div>

                    <div class="review-rating">
                        ${renderStars(parseFloat(myReview.rating))}
                    </div>

                    <p class="review-comment">
                        ${myReview.comment}
                    </p>

                    <div class="your-review-actions">

                        <button class="edit-review-btn" id="editReviewBtn">
                            <i class="fa-solid fa-pen"></i>
                            Edit
                        </button>

                        <button class="delete-review-btn" id="deleteReviewBtn">
                            <i class="fa-solid fa-trash"></i>
                            Delete
                        </button>

                    </div>

                </div>
            `;

            setupOwnReviewActions(myReview);
        }


        // ==========================
        // User has NOT reviewed
        // ==========================

        else {

            // If not logged in
            if (!currentUserId) {

                reviewBox.innerHTML = `

                    <h3 class="login-message">
                        Please login first to write a review
                    </h3>

                    <div class="login-btn-container">

                        <a
                            href="login.html"
                            class="login-btn"
                        >
                            Go to Login
                        </a>

                    </div>

                `;

            }

            // Logged-in user can write
            else {

                reviewBox.innerHTML = `

                    <h3>
                        Write a Review
                    </h3>

                    <div
                        class="star-rating"
                        id="starRating"
                    >

                        <i
                            class="fa-solid fa-star"
                            data-value="1"
                        ></i>

                        <i
                            class="fa-solid fa-star"
                            data-value="2"
                        ></i>

                        <i
                            class="fa-solid fa-star"
                            data-value="3"
                        ></i>

                        <i
                            class="fa-solid fa-star"
                            data-value="4"
                        ></i>

                        <i
                            class="fa-solid fa-star"
                            data-value="5"
                        ></i>

                    </div>


                    <textarea
                        placeholder="Share your experience..."
                    ></textarea>


                    <button class="submit-review-btn">
                        Submit Review
                    </button>

                `;

                setupReviewForm();

            }

        }

    }


    // ==============================
    // Review List
    // ==============================

    const container =
        document.getElementById("reviewList");

    container.innerHTML = "";


    let reviewText = "";


    if (allReviews.length === 0) {

        reviewText =
            "No reviews yet";

    }

    else if (allReviews.length === 1) {

        reviewText =
            "1 review has been posted";

    }

    else {

        reviewText =
            `${allReviews.length} reviews have been posted`;

    }


    container.innerHTML = `

        <div class="review-list-header">

            <h3 class="review-count">
                ${reviewText}
            </h3>

            <div class="review-sort">

                <label for="reviewSort">
                    Sort by:
                </label>

                <select id="reviewSort">

                    <option value="newest">
                        Newest
                    </option>

                    <option value="highest">
                        Highest Rating
                    </option>

                    <option value="lowest">
                        Lowest Rating
                    </option>

                </select>

            </div>

        </div>

        <div id="reviewCards"></div>

    `;


    const sortSelect =
        document.getElementById("reviewSort");


    sortSelect.addEventListener(
        "change",
        displayReviews
    );


    displayReviews();

}


// ================================
// Own Review - Edit / Delete
// ================================

function setupOwnReviewActions(myReview) {

    const editBtn =
        document.getElementById("editReviewBtn");

    const deleteBtn =
        document.getElementById("deleteReviewBtn");


    // ==========================
    // Edit Review
    // ==========================

    if (editBtn) {

        editBtn.addEventListener("click", () => {

            showEditReviewForm(myReview);

        });

    }


    // ==========================
    // Delete Review
    // ==========================

    if (deleteBtn) {

        deleteBtn.addEventListener(
            "click",
            async () => {

                const confirmDelete =
                    confirm(
                        "Are you sure you want to delete your review?"
                    );


                if (!confirmDelete) {
                    return;
                }


                try {

                    const res =
                        await fetch(
                            `/reviews/${myReview._id}`,
                            {
                                method: "DELETE"
                            }
                        );


                    const result =
                        await res.json();


                    if (result.success) {

                        alert(
                            "Review deleted successfully."
                        );


                        await loadReviews();

                        await updateRestaurantRating();

                    }

                    else {

                        alert(
                            result.message ||
                            "Failed to delete review."
                        );

                    }

                }

                catch (err) {

                    console.error(err);

                    alert(
                        "Something went wrong."
                    );

                }

            }
        );

    }

}


// ================================
// Show Edit Review Form
// ================================

function showEditReviewForm(myReview) {

    const reviewBox =
        document.getElementById("yourReviewBox");


    if (!reviewBox) {
        return;
    }


    reviewBox.innerHTML = `

        <h3>
            Edit Your Review
        </h3>


        <div
            class="star-rating"
            id="editStarRating"
        >

            <i
                class="fa-solid fa-star"
                data-value="1"
            ></i>

            <i
                class="fa-solid fa-star"
                data-value="2"
            ></i>

            <i
                class="fa-solid fa-star"
                data-value="3"
            ></i>

            <i
                class="fa-solid fa-star"
                data-value="4"
            ></i>

            <i
                class="fa-solid fa-star"
                data-value="5"
            ></i>

        </div>


        <textarea
            id="editReviewComment"
            placeholder="Share your experience..."
        ></textarea>


        <div class="your-review-actions">

            <button
                class="cancel-edit-btn"
                id="cancelEditBtn"
            >
                Cancel
            </button>

            <button
                class="save-review-btn"
                id="saveReviewBtn"
            >
                Save Changes
            </button>

        </div>

    `;


    // Put existing comment into textarea

    const textarea =
        document.getElementById(
            "editReviewComment"
        );

    textarea.value =
        myReview.comment || "";


    // ==========================
    // Existing Rating
    // ==========================

    let selectedRating =
        Number(myReview.rating);


    const stars =
        document.querySelectorAll(
            "#editStarRating i"
        );


    highlightReviewStars(
        stars,
        selectedRating
    );


    // ==========================
    // Star Click
    // ==========================

    stars.forEach(star => {

        star.addEventListener(
            "mouseover",
            () => {

                const value =
                    Number(star.dataset.value);


                stars.forEach(s => {

                    if (
                        Number(s.dataset.value) <= value
                    ) {

                        s.classList.add("hover");

                    }

                    else {

                        s.classList.remove("hover");

                    }

                });

            }
        );


        star.addEventListener(
            "click",
            () => {

                selectedRating =
                    Number(star.dataset.value);


                highlightReviewStars(
                    stars,
                    selectedRating
                );

            }
        );

    });


    // ==========================
    // Mouse Leave
    // ==========================

    const starContainer =
        document.getElementById(
            "editStarRating"
        );


    starContainer.addEventListener(
        "mouseleave",
        () => {

            highlightReviewStars(
                stars,
                selectedRating
            );

        }
    );


    // ==========================
    // Cancel
    // ==========================

    const cancelBtn =
        document.getElementById(
            "cancelEditBtn"
        );


    cancelBtn.addEventListener(
        "click",
        () => {

            loadReviews();

        }
    );


    // ==========================
    // Save Changes
    // ==========================

    const saveBtn =
        document.getElementById(
            "saveReviewBtn"
        );


    saveBtn.addEventListener(
        "click",
        async () => {

            const comment =
                textarea.value.trim();


            if (!selectedRating || !comment) {

                alert(
                    "Please give rating and write a review."
                );

                return;

            }


            try {

                const res =
                    await fetch(
                        `/reviews/${myReview._id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                rating:
                                    selectedRating,

                                comment:
                                    comment

                            })

                        }
                    );


                const result =
                    await res.json();


                if (result.success) {

                    alert(
                        "Review updated successfully."
                    );


                    await loadReviews();

                    await updateRestaurantRating();

                }

                else {

                    alert(
                        result.message ||
                        "Failed to update review."
                    );

                }

            }

            catch (err) {

                console.error(err);

                alert(
                    "Something went wrong."
                );

            }

        }
    );

}


// ================================
// Display Reviews
// ================================

async function displayReviews() {

    const reviewCards =
        document.getElementById("reviewCards");

    if (!reviewCards) return;


    // Get current logged-in user

    let currentUserId = null;


    try {

        const userRes =
            await fetch("/auth/currentUser");

        const userData =
            await userRes.json();


        if (
            userData.loggedIn &&
            userData.role === "user"
        ) {

            currentUserId =
                String(userData.userId);

        }

    }

    catch (err) {

        console.error(
            "Failed to get current user:",
            err
        );

    }


    // ==============================
    // Remove user's own review
    // from other reviews
    // ==============================

    let otherReviews =
        allReviews.filter(review => {

            if (!currentUserId) {
                return true;
            }


            if (
                !review.userId ||
                !review.userId._id
            ) {

                return true;

            }


            return (
                String(review.userId._id) !==
                currentUserId
            );

        });


    // ==============================
    // Sort Other Reviews
    // ==============================

    const sortValue =
        document.getElementById("reviewSort").value;


    if (sortValue === "newest") {

        otherReviews.sort((a, b) => {

            const dateA = new Date(
                a.updatedAt || a.createdAt
            );

            const dateB = new Date(
                b.updatedAt || b.createdAt
            );

            return dateB - dateA;

        });

    }

    else if (sortValue === "highest") {

        otherReviews.sort(
            (a, b) =>
                Number(b.rating) -
                Number(a.rating)
        );

    }

    else if (sortValue === "lowest") {

        otherReviews.sort(
            (a, b) =>
                Number(a.rating) -
                Number(b.rating)
        );

    }


    // ==============================
    // Display Other Reviews
    // ==============================

    reviewCards.innerHTML = "";


    if (otherReviews.length === 0) {

        reviewCards.innerHTML = "";

        return;

    }


    otherReviews.forEach(r => {

        reviewCards.innerHTML += `

            <div class="review-card">

                <div class="review-header">

                    <div class="review-user">

                        ${
                            r.userId.profileImage

                                ? `

                                    <img
                                        src="${r.userId.profileImage}"
                                        alt="${r.userId.username}"
                                        class="review-profile-picture"
                                    >

                                `

                                : `

                                    <div class="review-profile-placeholder">

                                        <i class="fa-solid fa-user"></i>

                                    </div>

                                `
                        }

                        <h4>
                            ${r.userId.username}
                        </h4>

                    </div>


                    <span class="review-date">
                        ${
                            r.updatedAt
                                ? `Edited by ${new Date(r.updatedAt)
                                    .toLocaleString([], {
                                        day: "numeric",
                                        month: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true
                                    })
                                    .replace(",", " •")}`
                                : new Date(r.createdAt)
                                    .toLocaleString([], {
                                        day: "numeric",
                                        month: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true
                                    })
                                    .replace(",", " •")
                        }
                    </span>

                </div>


                <div class="review-rating">

                    ${renderStars(
                        parseFloat(r.rating)
                    )}

                </div>


                <p class="review-comment">

                    ${r.comment}

                </p>

            </div>

        `;

    });

}


// Convert numeric rating into star icons
function renderStars(rating) {

    let stars = "";


    for (let i = 1; i <= 5; i++) {

        if (i <= Math.floor(rating)) {

            stars += `<i class="fa-solid fa-star"></i>`;

        } else {

            stars += `<i class="fa-regular fa-star"></i>`;

        }

    }


    return stars;
}


// Update restaurant rating
async function updateRestaurantRating() {

    const res = await fetch(`/restaurants/${restaurantId}`);

    const restaurant = await res.json();


    document.getElementById("restaurantRating").innerText =
        parseFloat(restaurant.averageRating || 0).toFixed(1);


    document.getElementById("restaurantTotalRatings").innerText =
        restaurant.totalRatings || 0;

}


// Check user is logged in before allowing favourite action
document.addEventListener("DOMContentLoaded", () => {

    const favouriteBtn = document.getElementById("favouriteBtn");


    if (!favouriteBtn) return;


    favouriteBtn.addEventListener("click", async () => {

        const sessionRes = await fetch("/auth/currentUser");

        const sessionData = await sessionRes.json();


        if (!sessionData.loggedIn || sessionData.role !== "user") {
            alert("Please login first");
            return;
        }


        const isFavourite =
            favouriteBtn.classList.contains("active");


        if (!isFavourite) {

            const res = await fetch(`/favourites/${restaurantId}`, {

                method: "POST"

            });


            const data = await res.json();


            if (data.success) {

                favouriteBtn.classList.add("active");

                favouriteBtn.classList.remove("fa-regular");

                favouriteBtn.classList.add("fa-solid");


                alert("Added to favourites");


                setTimeout(() => {

                    window.location.href = "/favourite.html";

                }, 100);

            }


        } else {

            const res = await fetch(`/favourites/${restaurantId}`, {

                method: "DELETE"

            });


            const data = await res.json();


            if (data.success) {

                favouriteBtn.classList.remove("active");

                favouriteBtn.classList.remove("fa-solid");

                favouriteBtn.classList.add("fa-regular");


                alert("Removed from favourites");


                setTimeout(() => {

                    window.location.href = "/favourite.html";

                }, 100);

            }

        }

    });


    // Check whether current restaurant is already a favourite
    async function checkFavouriteStatus() {

        const res =
            await fetch(`/favourites/check/${restaurantId}`);

        const data = await res.json();


        if (data.isFavourite) {

            favouriteBtn.classList.add("active");

            favouriteBtn.classList.remove("fa-regular");

            favouriteBtn.classList.add("fa-solid");

        } else {

            favouriteBtn.classList.remove("active");

            favouriteBtn.classList.add("fa-regular");

            favouriteBtn.classList.remove("fa-solid");

        }

    }


    checkFavouriteStatus();

});


// ==========================
// Restaurant Tabs
// ==========================

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(button => {

    button.addEventListener("click", async () => {

        const targetTab = button.dataset.tab;


        // ==========================
        // Reviews requires login
        // ==========================

        if (targetTab === "reviewTab") {

            const res = await fetch("/auth/currentUser");
            const data = await res.json();

            if (!data.loggedIn) {

                // Open Reviews tab
                tabButtons.forEach(btn => {
                    btn.classList.remove("active");
                });

                tabContents.forEach(content => {
                    content.classList.remove("active");
                });

                button.classList.add("active");

                document
                    .getElementById("reviewTab")
                    .classList.add("active");

                return;
            }
        }


        // ==========================
        // Open tab normally
        // ==========================

        tabButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        tabContents.forEach(content => {
            content.classList.remove("active");
        });

        button.classList.add("active");

        document
            .getElementById(targetTab)
            .classList.add("active");

    });

});


document.addEventListener("DOMContentLoaded", async () => {

    await loadRestaurantMenu();

});