/* =========================================
   ANALYTICS DATA
========================================= */

let restaurants = [];
let reviews = [];

let pieChart = null;
let barChart = null;
let topRatedChart = null;
let mostReviewedChart = null;

let currentPeriod = "week";


/* =========================================
   LOAD ANALYTICS DATA
========================================= */

async function loadAnalytics() {

    try {

        const [
            restaurantsResponse,
            reviewsResponse
        ] = await Promise.all([
            fetch("/restaurants"),
            fetch("/reviews")
        ]);


        // Check restaurant response
        if (!restaurantsResponse.ok) {
            throw new Error("Failed to load restaurants");
        }


        // Check review response
        if (!reviewsResponse.ok) {
            throw new Error("Failed to load reviews");
        }


        // Convert responses to JSON
        restaurants =
            await restaurantsResponse.json();

        reviews =
            await reviewsResponse.json();


        console.log("Restaurants:", restaurants);
        console.log("Reviews:", reviews);


        // Update dashboard
        updateSummary();

        createCuisineChart();

        createStateChart();

        updatePeriodAnalytics();

    }
    catch (error) {

        console.error(
            "Analytics loading error:",
            error
        );

    }

}


/* =========================================
   SUMMARY CARDS
========================================= */

function updateSummary() {

    /* -----------------------------------------
       Total Restaurants
    ----------------------------------------- */

    document.getElementById(
        "totalRestaurants"
    ).textContent = restaurants.length;


    /* -----------------------------------------
       Total Cuisines
    ----------------------------------------- */

    const cuisines =
        restaurants
            .map(
                restaurant =>
                    restaurant.cuisine?.trim()
            )
            .filter(
                cuisine => cuisine
            );


    const uniqueCuisines =
        [...new Set(cuisines)];


    document.getElementById(
        "totalCuisines"
    ).textContent =
        uniqueCuisines.length;


    /* -----------------------------------------
       Average Rating
    ----------------------------------------- */

    const ratings =
        restaurants
            .map(
                restaurant =>
                    Number(
                        restaurant.averageRating
                    )
            )
            .filter(
                rating =>
                    !isNaN(rating) &&
                    rating > 0
            );


    let averageRating = 0;


    if (ratings.length > 0) {

        const total =
            ratings.reduce(
                (sum, rating) =>
                    sum + rating,
                0
            );


        averageRating =
            total / ratings.length;

    }


    document.getElementById(
        "averageRating"
    ).textContent =
        averageRating.toFixed(1);

}


/* =========================================
   CUISINE DISTRIBUTION
========================================= */

function createCuisineChart() {

    const cuisineCount = {};


    restaurants.forEach(
        restaurant => {

            const cuisine =
                restaurant.cuisine?.trim();


            if (!cuisine) {
                return;
            }


            cuisineCount[cuisine] =
                (cuisineCount[cuisine] || 0) + 1;

        }
    );


    const labels =
        Object.keys(cuisineCount);


    const data =
        Object.values(cuisineCount);


    const ctx =
        document
            .getElementById("pieChart")
            .getContext("2d");


    // Destroy previous chart
    if (pieChart) {
        pieChart.destroy();
    }


    pieChart =
        new Chart(
            ctx,
            {
                type: "pie",

                data: {
                    labels: labels,

                    datasets: [
                        {
                            data: data
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: true,

                    plugins: {

                        legend: {
                            position: "bottom"
                        }

                    }

                }
            }
        );

}


/* =========================================
   RESTAURANTS BY STATE
========================================= */

function createStateChart() {

    const stateCounts = {};

    restaurants.forEach(restaurant => {

        if (!restaurant.location) {
            return;
        }

        // Example:
        // "Petaling Jaya, Selangor"
        // → "Selangor"

        const parts = restaurant.location.split(",");

        let state = parts.length > 1
            ? parts[parts.length - 1].trim()
            : restaurant.location.trim();

        if (!state) {
            state = "Unknown";
        }

        stateCounts[state] =
            (stateCounts[state] || 0) + 1;
    });

    const labels = Object.keys(stateCounts);
    const data = Object.values(stateCounts);

    if (barChart) {
        barChart.destroy();
    }

    barChart = new Chart(
        document.getElementById("barChart"),
        {
            type: "bar",

            data: {
                labels: labels,

                datasets: [
                    {
                        label: "Number of Restaurants",
                        data: data,
                        backgroundColor: "#FFF2CC",
                        borderColor: "#F4D35E",
                        borderWidth: 1,
                        borderRadius: 8
                    }
                ]
            },

            options: {
                responsive: true,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        }
    );
}


/* =========================================
   DATE RANGE
========================================= */

function getDateRange(period) {

    const now = new Date();


    /* -----------------------------------------
       Today
    ----------------------------------------- */

    if (period === "today") {

        const start =
            new Date(now);


        start.setHours(
            0,
            0,
            0,
            0
        );


        return {
            start,
            end: now
        };

    }


    /* -----------------------------------------
       This Week
    ----------------------------------------- */

    if (period === "week") {

        const start =
            new Date(now);


        start.setDate(
            start.getDate() - 7
        );


        return {
            start,
            end: now
        };

    }


    /* -----------------------------------------
       This Month
    ----------------------------------------- */

    if (period === "month") {

        const start =
            new Date(now);


        start.setDate(
            start.getDate() - 30
        );


        return {
            start,
            end: now
        };

    }


    /* -----------------------------------------
       All Time
    ----------------------------------------- */

    return {
        start: null,
        end: null
    };

}


/* =========================================
   FILTER REVIEWS BY PERIOD
========================================= */

function getFilteredReviews(period) {

    const {
        start,
        end
    } = getDateRange(period);


    // All Time
    if (!start) {
        return reviews;
    }


    return reviews.filter(
        review => {

            const reviewDate =
                new Date(
                    review.createdAt
                );


            return (
                reviewDate >= start &&
                reviewDate <= end
            );

        }
    );

}


/* =========================================
   GET RESTAURANT NAME
========================================= */

function getRestaurantName(restaurantId) {

    if (!restaurantId) {
        return "Unknown Restaurant";
    }


    /* -----------------------------------------
       Populated restaurant object
    ----------------------------------------- */

    if (typeof restaurantId === "object") {

        return (
            `${restaurantId.restaurantName || ""} ` +
            `${restaurantId.branch || ""}`
        ).trim();

    }


    /* -----------------------------------------
       Restaurant ID
    ----------------------------------------- */

    const restaurant =
        restaurants.find(
            restaurant =>
                String(restaurant._id) ===
                String(restaurantId)
        );


    if (!restaurant) {
        return "Unknown Restaurant";
    }


    return (
        `${restaurant.restaurantName || ""} ` +
        `${restaurant.branch || ""}`
    ).trim();

}


/* =========================================
   GET RESTAURANT ID FROM REVIEW
========================================= */

function getRestaurantId(review) {

    if (!review.restaurantId) {
        return null;
    }


    /* -----------------------------------------
       Populated restaurant object
    ----------------------------------------- */

    if (
        typeof review.restaurantId === "object"
    ) {

        return review.restaurantId._id;

    }


    /* -----------------------------------------
       Normal restaurant ID
    ----------------------------------------- */

    return review.restaurantId;

}


/* =========================================
   CALCULATE RESTAURANT STATISTICS
========================================= */

function calculateRestaurantStats(
    filteredReviews
) {

    const stats = {};


    filteredReviews.forEach(
        review => {

            const restaurantId =
                getRestaurantId(review);


            if (!restaurantId) {
                return;
            }


            const id =
                String(restaurantId);


            /* -----------------------------------------
               Create restaurant statistics
            ----------------------------------------- */

            if (!stats[id]) {

                stats[id] = {

                    restaurantId:
                        restaurantId,

                    ratingTotal: 0,

                    ratingCount: 0

                };

            }


            /* -----------------------------------------
               Add rating
            ----------------------------------------- */

            stats[id].ratingTotal +=
                Number(
                    review.rating || 0
                );


            stats[id].ratingCount++;

        }
    );


    /* -----------------------------------------
       Calculate average rating
    ----------------------------------------- */

    Object.values(stats).forEach(
        restaurant => {

            restaurant.averageRating =
                restaurant.ratingCount > 0

                    ? restaurant.ratingTotal /
                      restaurant.ratingCount

                    : 0;

        }
    );


    return Object.values(stats);

}


/* =========================================
   UPDATE PERIOD ANALYTICS
========================================= */

function updatePeriodAnalytics() {

    const filteredReviews =
        getFilteredReviews(
            currentPeriod
        );


    const stats =
        calculateRestaurantStats(
            filteredReviews
        );


    createTopRatedChart(stats);

    createMostReviewedChart(stats);

    displayTopRestaurants(stats);

}


/* =========================================
   TOP RATED RESTAURANTS
========================================= */

function createTopRatedChart(stats) {

    const topRated =
        [...stats]
            .sort(
                (a, b) => {

                    // Higher rating first
                    if (
                        b.averageRating !==
                        a.averageRating
                    ) {

                        return (
                            b.averageRating -
                            a.averageRating
                        );

                    }


                    // If same rating,
                    // more reviews first
                    return (
                        b.ratingCount -
                        a.ratingCount
                    );

                }
            )
            .slice(0, 5);


    const labels =
        topRated.map(
            restaurant =>
                getRestaurantName(
                    restaurant.restaurantId
                )
        );


    const ratings =
        topRated.map(
            restaurant =>
                Number(
                    restaurant.averageRating.toFixed(1)
                )
        );


    const ctx =
        document
            .getElementById(
                "topRatedChart"
            )
            .getContext("2d");


    // Destroy previous chart
    if (topRatedChart) {
        topRatedChart.destroy();
    }


    topRatedChart =
        new Chart(
            ctx,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Average Rating",

                            data: ratings,

                            backgroundColor: "#E8A4B8",
                            borderColor: "#D98FA5",
                            borderWidth: 1,
                            borderRadius: 8
                        }
                    ]

                },

                options: {

                    indexAxis: "y",

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        x: {

                            min: 0,

                            max: 5,

                            ticks: {
                                stepSize: 1
                            }

                        }

                    }

                }

            }
        );

}


/* =========================================
   MOST REVIEWED RESTAURANTS
========================================= */

function createMostReviewedChart(stats) {

    const mostReviewed =
        [...stats]
            .sort(
                (a, b) =>
                    b.ratingCount -
                    a.ratingCount
            )
            .slice(0, 5);


    const labels =
        mostReviewed.map(
            restaurant =>
                getRestaurantName(
                    restaurant.restaurantId
                )
        );


    const counts =
        mostReviewed.map(
            restaurant =>
                restaurant.ratingCount
        );


    const ctx =
        document
            .getElementById(
                "mostReviewedChart"
            )
            .getContext("2d");


    // Destroy previous chart
    if (mostReviewedChart) {
        mostReviewedChart.destroy();
    }


    mostReviewedChart =
        new Chart(
            ctx,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Number of Ratings",

                            data: counts,

                            backgroundColor: "#9BCB9B",
                            borderColor: "#7FB77F",
                            borderWidth: 1,
                            borderRadius: 8
                        }
                    ]

                },

                options: {

                    indexAxis: "y",

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        x: {

                            beginAtZero: true,

                            ticks: {
                                stepSize: 1
                            }

                        }

                    }

                }

            }
        );

}

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


/* =========================================
   TOP RESTAURANT CARDS
========================================= */

function displayTopRestaurants(stats) {

    const performerList =
        document.getElementById(
            "performerList"
        );


    performerList.innerHTML = "";


    /* -----------------------------------------
       Sort restaurants
    ----------------------------------------- */

    const topRestaurants =
        [...stats]
            .sort(
                (a, b) => {

                    // Higher rating first
                    if (
                        b.averageRating !==
                        a.averageRating
                    ) {

                        return (
                            b.averageRating -
                            a.averageRating
                        );

                    }


                    // More ratings if same rating
                    return (
                        b.ratingCount -
                        a.ratingCount
                    );

                }
            )
            .slice(0, 5);


    /* -----------------------------------------
       Create cards
    ----------------------------------------- */

    topRestaurants.forEach(
        (restaurant, index) => {

            const restaurantData =
                restaurants.find(
                    item =>
                        String(item._id) ===
                        String(
                            restaurant.restaurantId
                        )
                );


            if (!restaurantData) {
                return;
            }


            /* -----------------------------------------
               Restaurant image
            ----------------------------------------- */

            const image =
                restaurantData.image ||
                "/images/default-restaurant.jpg";


            /* -----------------------------------------
               Restaurant name
            ----------------------------------------- */

            const name =
                (
                    `${restaurantData.restaurantName || ""} ` +
                    `${restaurantData.branch || ""}`
                ).trim();


            /* -----------------------------------------
               Cuisine
            ----------------------------------------- */

            const cuisine =
                restaurantData.cuisine ||
                "Unknown";


            /* -----------------------------------------
            Halal Status
            ----------------------------------------- */

            const halalStatus =
                restaurantData.halalStatus ||
                "Unknown";


            /* -----------------------------------------
            Price Range
            ----------------------------------------- */

            const priceRange =
                getPriceDisplay(
                    restaurantData.priceRange
                );


            /* -----------------------------------------
               Description
            ----------------------------------------- */

            const description =
                restaurantData.restaurantDescription ||
                "";


            /* -----------------------------------------
               Rating
            ----------------------------------------- */

            const rating =
                restaurant.averageRating.toFixed(1);


            /* -----------------------------------------
               Rating count
            ----------------------------------------- */

            const ratingCount =
                restaurant.ratingCount;


            /* -----------------------------------------
               Create card
            ----------------------------------------- */

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "performer-card";


            card.innerHTML = `

                <div class="rank-badge">
                    #${index + 1}
                </div>

                <img
                    src="${image}"
                    alt="${name}"
                >

                <div class="info">

                    <h4>
                        ${name}
                    </h4>

                    <p class="meta">
                        <i class="fa-solid fa-star"></i> ${rating}
                        (${ratingCount} ratings)
                        · ${cuisine}
                        · ${halalStatus}
                        · ${priceRange}
                    </p>

                    <p class="desc">
                        ${description}
                    </p>

                </div>

            `;

            card.addEventListener("click", () => {
                window.location.href =
                    `/restaurant-details.html?id=${restaurantData._id}`;
            });

            performerList.appendChild(card);

        }
    );


    /* -----------------------------------------
       No data
    ----------------------------------------- */

    if (topRestaurants.length === 0) {

        performerList.innerHTML = `

            <p class="no-data">
                No ratings available
                for this period.
            </p>

        `;

    }

}


/* =========================================
   FILTER BUTTONS
========================================= */

document
    .querySelectorAll(
        ".filter .btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    /* -----------------------------------------
                       Remove active from all buttons
                    ----------------------------------------- */

                    document
                        .querySelectorAll(
                            ".filter .btn"
                        )
                        .forEach(
                            btn =>
                                btn.classList.remove(
                                    "active"
                                )
                        );


                    /* -----------------------------------------
                       Add active to clicked button
                    ----------------------------------------- */

                    button.classList.add(
                        "active"
                    );


                    /* -----------------------------------------
                       Update current period
                    ----------------------------------------- */

                    currentPeriod =
                        button.dataset.period;


                    /* -----------------------------------------
                       Update titles
                    ----------------------------------------- */

                    updateTitles();


                    /* -----------------------------------------
                       Update charts
                    ----------------------------------------- */

                    updatePeriodAnalytics();

                }
            );

        }
    );


/* =========================================
   UPDATE SECTION TITLES
========================================= */

function updateTitles() {

    let periodText = "";


    switch (currentPeriod) {

        case "today":
            periodText = "Today";
            break;


        case "week":
            periodText = "This Week";
            break;


        case "month":
            periodText = "This Month";
            break;


        case "all":
            periodText = "All Time";
            break;

    }


    /* -----------------------------------------
       Top Rated
    ----------------------------------------- */

    document.getElementById(
        "topRatedTitle"
    ).textContent =
        `Top Rated Restaurants ${periodText}`;


    /* -----------------------------------------
       Most Reviewed
    ----------------------------------------- */

    document.getElementById(
        "mostReviewedTitle"
    ).textContent =
        `Most Reviewed Restaurants ${periodText}`;


    /* -----------------------------------------
       Restaurant List
    ----------------------------------------- */

    document.getElementById(
        "restaurantListTitle"
    ).textContent =
        `Top Rated Restaurants ${periodText}`;

}


/* =========================================
   START ANALYTICS
========================================= */

loadAnalytics();
