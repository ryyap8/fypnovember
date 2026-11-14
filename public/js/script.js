const container = document.getElementById("restaurantContainer");
const count = document.getElementById("restaurantCount");
const searchInput = document.getElementById("searchInput");
const cuisineFilter = document.getElementById("cuisineFilter");
const halalFilter = document.getElementById("halalFilter");
const priceFilter = document.getElementById("priceFilter");
const sortFilter = document.getElementById("sortFilter");
const resetBtn = document.getElementById("resetFilters");

let restaurants = [];

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

function displayRestaurants(data) {

    // Clear previous cards
    container.innerHTML = "";

    // Update restaurant count
    count.innerText = `Found ${data.length} restaurants`;

    // Loop through restaurants
    data.forEach(restaurant => {

        container.innerHTML += `

            <div class="card" onclick="goToDetails('${restaurant._id}')">

                    <!-- Restaurant Image -->
                    <img src="${restaurant.image}" alt="${restaurant.restaurantName}">

                    <!-- Card Content -->
                    <div class="card-content">

                        <!-- Title -->
                        <div class="title-row">
                            <h2>
                                ${restaurant.restaurantName} ${restaurant.branch || ""}
                            </h2>

                            <div class="price-range">
                                ${getPriceDisplay(restaurant.priceRange)}
                            </div>

                        </div>

                        <!-- Rating -->
                        <div class="rating">
                            <i class="fa-solid fa-star"></i> 
                            ${Number(restaurant.averageRating || 0).toFixed(1)}
                            (${restaurant.totalRatings || 0})

                            <span class="halal-status">
                                · ${restaurant.halalStatus || ""}
                            </span>
                        </div>

                        <!-- Restaurant Description -->
                        <p class="description">
                            ${restaurant.restaurantDescription || ""}
                        </p>

                        <div class="info-row">

                            <!-- Location -->
                            <div class="location">
                                <i class="fa-solid fa-location-dot"></i> 
                                ${restaurant.location || ""}
                            </div>

                            <!-- Cuisine Tag -->
                            <div class="tag ${restaurant.cuisine ? restaurant.cuisine.toLowerCase().trim() : ""}">
                                ${restaurant.cuisine || ""}
                            </div>

                        </div>

                    </div>

            </div>
        `;
    });
}


fetch("/restaurants")
    .then(res => res.json())
    .then(data => {
        restaurants = data;
        displayRestaurants(restaurants);
    })
    .catch(err => {
        console.error("Error loading restaurants:", err);
    });


// Filter restaurants
function filterRestaurants() {

    const keyword = searchInput.value.toLowerCase().trim();
    const selectedCuisine = cuisineFilter.value;
    const selectedHalal = halalFilter.value;
    const selectedPrice = priceFilter.value;
    const selectedSort = sortFilter.value;

    const filtered = restaurants.filter(restaurant => {

        // Search
        const searchMatch =
            keyword === "" ||
            restaurant.restaurantName?.toLowerCase().includes(keyword) ||
            restaurant.restaurantDescription?.toLowerCase().includes(keyword) ||
            restaurant.location?.toLowerCase().includes(keyword) ||
            restaurant.fullAddress?.toLowerCase().includes(keyword);

        // Cuisine
        const cuisineMatch =
            selectedCuisine === "" ||
            restaurant.cuisine === selectedCuisine;

        // Halal Status
        const halalMatch =
            selectedHalal === "" ||
            restaurant.halalStatus === selectedHalal;

        // Price
        const priceMatch =
            selectedPrice === "" ||
            (restaurant.priceRange || "").trim() === selectedPrice.trim();

        return searchMatch && cuisineMatch && halalMatch && priceMatch;
    });


    // Sort restaurants
    if (selectedSort === "rating") {

        filtered.sort((a, b) => {
            return (Number(b.averageRating) || 0) -
                   (Number(a.averageRating) || 0);
        });

    } else if (selectedSort === "reviews") {

        filtered.sort((a, b) => {
            return (Number(b.totalRatings) || 0) -
                   (Number(a.totalRatings) || 0);
        });

    } else if (selectedSort === "priceLow") {

        filtered.sort((a, b) => {
            return (a.priceRange || "").length -
                   (b.priceRange || "").length;
        });

    } else if (selectedSort === "priceHigh") {

        filtered.sort((a, b) => {
            return (b.priceRange || "").length -
                   (a.priceRange || "").length;
        });
    }


    displayRestaurants(filtered);
}


resetBtn.addEventListener("click", () => {

    searchInput.value = "";
    cuisineFilter.value = "";
    halalFilter.value = "";
    priceFilter.value = "";
    sortFilter.value = "";

    filterRestaurants();
});


function goToDetails(id) {
    window.location.href = `restaurant-details.html?id=${id}`;
}


searchInput.addEventListener("input", filterRestaurants);
cuisineFilter.addEventListener("change", filterRestaurants);
halalFilter.addEventListener("change", filterRestaurants);
priceFilter.addEventListener("change", filterRestaurants);
sortFilter.addEventListener("change", filterRestaurants);


// Auto-refresh restaurant list every 10 seconds
setInterval(() => {

    fetch("/restaurants")
        .then(res => res.json())
        .then(data => {
            restaurants = data;
            filterRestaurants();
        })
        .catch(err => {
            console.error("Error refreshing restaurants:", err);
        });

}, 10000);

