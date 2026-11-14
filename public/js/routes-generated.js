/* =========================================
   SYSTEM-GENERATED ROUTE
========================================= */

let selectedMeals = [];
let generatedRoute = null;
let previousRecommendationIds = [];
let previousRecommendationsByMeal = {};

let selectedFoods = {
    Breakfast: [],
    Lunch: [],
    Dinner: []
};


/* =========================================
   EDIT MODE
========================================= */

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const editRouteId =
    urlParams.get("edit");

const isEditMode =
    Boolean(editRouteId);


/* =========================================
   PAGE ELEMENTS
========================================= */

const routeNameInput =
    document.getElementById("routeName");

const routeDateInput =
    document.getElementById("routeDate");

const locationSelect =
    document.getElementById("location");

const budgetInput =
    document.getElementById("budget");

const mealCheckboxes =
    document.querySelectorAll(".meal-checkbox");

const cuisineSelect =
    document.getElementById("cuisine");

const halalStatusSelect =
    document.getElementById("halalStatus");

const generateBtn =
    document.getElementById("generateBtn");

const generateMessage =
    document.getElementById("generateMessage");

const resultsSection =
    document.getElementById("resultsSection");

const generatedResults =
    document.getElementById("generatedResults");


/* =========================================
   SET TODAY'S DATE
========================================= */

function setTodayDate() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    routeDateInput.value =
        `${year}-${month}-${day}`;

    routeDateInput.min =
        `${year}-${month}-${day}`;
}


/* =========================================
   LOAD LOCATIONS
========================================= */

async function loadLocations() {

    try {

        const response =
            await fetch("/restaurants");

        if (!response.ok) {

            throw new Error(
                "Failed to load restaurants."
            );

        }

        const restaurants =
            await response.json();

        locationSelect.innerHTML = `
            <option value="">
                Select location
            </option>
        `;

        const locations = [
            ...new Set(
                restaurants
                    .map(
                        restaurant =>
                            restaurant.location
                    )
                    .filter(
                        location =>
                            location
                    )
            )
        ];

        locations.sort();

        locations.forEach(
            location => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    location;

                option.textContent =
                    location;

                locationSelect.appendChild(
                    option
                );

            }
        );

    }
    catch (error) {

        console.error(
            "Load locations error:",
            error
        );

    }
}


/* =========================================
   LOAD SAVED GENERATED ROUTE
========================================= */

async function loadSavedGeneratedRoute() {

    if (!isEditMode) {
        return;
    }

    try {

        const response =
            await fetch(
                `/routes/${editRouteId}`
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            showMessage(
                data.message ||
                "Unable to load saved route."
            );

            return;
        }

        const route =
            data.route;


        /* =========================================
           CHECK ROUTE TYPE
        ========================================= */

        if (
            route.routeType !== "generated"
        ) {

            showMessage(
                "This is not a system-generated route."
            );

            return;
        }


        /* =========================================
           FILL ROUTE INFORMATION
        ========================================= */

        routeNameInput.value =
            route.routeName || "";

        routeDateInput.value =
            route.date
                ? new Date(route.date)
                    .toISOString()
                    .split("T")[0]
                : "";

        locationSelect.value =
            route.location || "";

        budgetInput.value =
            route.budget || "";


        /* =========================================
           SELECT MEALS
        ========================================= */

        selectedMeals =
            route.meals.map(
                meal =>
                    meal.mealType
            );


        mealCheckboxes.forEach(
            checkbox => {

                checkbox.checked =
                    selectedMeals.includes(
                        checkbox.value
                    );

            }
        );


        /* =========================================
           STORE SAVED ROUTE
        ========================================= */

        generatedRoute = convertSavedRouteToGeneratedRoute(route);

        previousRecommendationsByMeal = {};

        (generatedRoute.recommendations || []).forEach(recommendation => {
            if (recommendation.mealType && recommendation.restaurant?._id) {
                previousRecommendationsByMeal[recommendation.mealType] =
                    String(recommendation.restaurant._id);
            }
        });
        
        // Store the restaurant IDs from the saved generated route
        previousRecommendationIds =
            (generatedRoute.recommendations || []).map(
                recommendation =>
                    String(recommendation.restaurant._id)
            );


        /* =========================================
        DISPLAY SAVED RESULTS
        ========================================= */

        displayGeneratedResults(
            generatedRoute
        );


        /* =========================================
        RESTORE SAVED QUANTITIES
        ========================================= */

        route.meals.forEach(meal => {

            meal.items.forEach(item => {

                if (
                    !selectedFoods[meal.mealType]
                ) {
                    selectedFoods[meal.mealType] = [];
                }

                selectedFoods[meal.mealType].push({

                    menuId:
                        item.menuId._id,

                    price:
                        Number(
                            item.menuId.price
                        ),

                    quantity:
                        Number(
                            item.quantity
                        )

                });

            });

        });


        /* =========================================
        UPDATE QUANTITY DISPLAYS
        ========================================= */

        route.meals.forEach(meal => {

            meal.items.forEach(item => {

                updateQuantityDisplay(
                    meal.mealType,
                    item.menuId._id
                );

                updateMealTotal(
                    meal.mealType
                );

            });

        });


        updateGeneratedTotal();


        console.log(
            "Saved generated route loaded:",
            route
        );

        console.log(
            "MEALS:",
            JSON.stringify(
                route.meals,
                null,
                2
            )
        );

    }

    catch (error) {

        console.error(
            "Load saved generated route error:",
            error
        );

        showMessage(
            "Something went wrong while loading the route."
        );

    }
}


function convertSavedRouteToGeneratedRoute(route) {

    const recommendations =
        route.meals.map(meal => {

            const restaurant =
                meal.restaurantId;

            /* =========================================
               ALL FOODS FROM THIS RESTAURANT
            ========================================= */

            const foods =
                meal.allFoods || [];

            /* =========================================
               RESTORE SAVED QUANTITIES
            ========================================= */

            const foodsWithQuantity =
                foods.map(food => {

                    const savedItem =
                        meal.items.find(item =>
                            item.menuId &&
                            item.menuId._id.toString() ===
                            food._id.toString()
                        );

                    return {

                        _id:
                            food._id,

                        name:
                            food.name,

                        price:
                            food.price,

                        image:
                            food.image,

                        category:
                            food.category,

                        mealType:
                            food.mealType,

                        description:
                            food.description,

                        culturalInfo:
                            food.culturalInfo,

                        savedQuantity:
                            savedItem
                                ? Number(savedItem.quantity)
                                : 0

                    };

                });

            const averageMealPrice =
                foodsWithQuantity.length > 0
                    ? foodsWithQuantity.reduce(
                        (sum, food) =>
                            sum +
                            Number(food.price || 0),
                        0
                    ) / foodsWithQuantity.length
                    : 0;

            return {

                mealType:
                    meal.mealType,

                restaurant: {

                    _id:
                        restaurant._id,

                    restaurantName:
                        restaurant.restaurantName,

                    branch:
                        restaurant.branch,

                    location:
                        restaurant.location,

                    fullAddress:
                        restaurant.fullAddress,

                    cuisine:
                        restaurant.cuisine,

                    halalStatus:
                        restaurant.halalStatus,

                    averageRating:
                        restaurant.averageRating,

                    totalRatings:
                        restaurant.totalRatings,

                    googleMapsLink:
                        restaurant.googleMapsLink

                },

                foods:
                    foodsWithQuantity,

                averageMealPrice:
                    averageMealPrice

            };

        });

    return {

        routeName:
            route.routeName,

        date:
            route.date,

        location:
            route.location,

        budget:
            route.budget,

        routeType:
            "generated",

        recommendations:
            recommendations

    };
}


/* =========================================
   GET SELECTED MEALS
========================================= */

function getSelectedMeals() {

    selectedMeals = [];

    mealCheckboxes.forEach(
        checkbox => {

            if (checkbox.checked) {

                selectedMeals.push(
                    checkbox.value
                );

            }

        }
    );

    return selectedMeals;
}


/* =========================================
   SHOW MESSAGE
========================================= */

function showMessage(
    message,
    type = "error"
) {

    generateMessage.textContent =
        message;

    generateMessage.className =
        `generate-message ${type}`;
}


/* =========================================
   CLEAR MESSAGE
========================================= */

function clearMessage() {

    generateMessage.textContent =
        "";

    generateMessage.className =
        "generate-message";
}


/* =========================================
   VALIDATE FORM
========================================= */

function validateForm() {

    const routeName =
        routeNameInput.value.trim();

    const routeDate =
        routeDateInput.value;

    const location =
        locationSelect.value;

    const budget =
        Number(
            budgetInput.value
        );

    const meals =
        getSelectedMeals();


    /* Route name */

    if (!routeName) {

        showMessage(
            "Please enter a route name."
        );

        routeNameInput.focus();

        return false;
    }


    /* Date */

    if (!routeDate) {

        showMessage(
            "Please select a date."
        );

        routeDateInput.focus();

        return false;
    }


    /* Location */

    if (!location) {

        showMessage(
            "Please select a location."
        );

        locationSelect.focus();

        return false;
    }


    /* Budget */

    if (
        !budget ||
        budget <= 0
    ) {

        showMessage(
            "Please enter a valid daily budget."
        );

        budgetInput.focus();

        return false;
    }


    /* Meals */

    if (
        meals.length === 0
    ) {

        showMessage(
            "Please select at least one meal."
        );

        return false;
    }


    return true;
}


/* =========================================
   GENERATE ROUTE
========================================= */

async function generateRoute(isRegenerate = false) {

    clearMessage();

    if (!validateForm()) {
        return;
    }

    const routeData = {

        routeName: routeNameInput.value.trim(),
        date: routeDateInput.value,
        location: locationSelect.value,
        budget: Number(budgetInput.value),
        meals: getSelectedMeals(),
        cuisine: cuisineSelect.value,
        halalStatus: halalStatusSelect.value,

        previousRecommendationsByMeal: isRegenerate
            ? previousRecommendationsByMeal
            : {}
    };


    /*
     * Clear previous food selections
     */

    selectedFoods = {
        Breakfast: [],
        Lunch: [],
        Dinner: []
    };


    /*
     * Disable button while generating
     */

    generateBtn.disabled =
        true;

    generateBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Generating...
    `;


    try {

        const response =
            await fetch(
                "/routes/generate",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            routeData
                        )
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            showMessage(
                data.message ||
                "Unable to generate a route."
            );

            return;
        }

        previousRecommendationsByMeal = {};

            (data.route.recommendations || []).forEach(recommendation => {
                if (recommendation.mealType && recommendation.restaurant?._id) {
                    previousRecommendationsByMeal[recommendation.mealType] =
                        String(recommendation.restaurant._id);
                }
            });

            generatedRoute = data.route;
            displayGeneratedResults(data.route);

        showMessage(
            "Route recommendations generated successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Generate route error:",
            error
        );

        showMessage(
            "Something went wrong. Please try again."
        );

    }

    finally {

        generateBtn.disabled =
            false;

        generateBtn.innerHTML = `
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Generate Route
        `;
    }
}


/* =========================================
   DISPLAY GENERATED RESULTS
========================================= */

function displayGeneratedResults(
    route
) {

    resultsSection.style.display =
        "block";

    generatedResults.innerHTML =
        "";


    route.recommendations.forEach(
        recommendation => {

            const mealType =
                recommendation.mealType;

            const restaurant =
                recommendation.restaurant;

            const foods =
                recommendation.foods;


            /*
             * Reset selected foods
             */

            selectedFoods[mealType] = [];


            /*
             * Restaurant card
             */

            const mealCard =
                document.createElement(
                    "div"
                );

            mealCard.className =
                "generated-meal-card";


            mealCard.innerHTML = `

                <div class="generated-meal-header">

                    <div class="generated-meal-title">

                        <div class="generated-meal-icon">

                            ${getMealIcon(mealType)}

                        </div>

                        <div>

                            <span class="generated-meal-type">
                                ${mealType}
                            </span>

                            <h3 class="generated-restaurant-name">
                                ${restaurant.restaurantName}
                                ${
                                    restaurant.branch
                                        ? `<span class="restaurant-branch"> - ${restaurant.branch}</span>`
                                        : ""
                                }
                            </h3>

                            <p class="generated-restaurant-location">
                                <i class="fa-solid fa-location-dot"></i>
                                ${
                                    restaurant.location ||
                                    restaurant.fullAddress ||
                                    "Location unavailable"
                                }
                            </p>

                        </div>

                    </div>


                    <div class="restaurant-rating">

                        <i class="fa-solid fa-star"></i>

                        ${Number(
                            restaurant.averageRating || 0
                        ).toFixed(1)}

                        <span>
                            (${restaurant.totalRatings || 0})
                        </span>

                    </div>

                </div>


                <div class="generated-restaurant-meta">

                    ${
                        restaurant.cuisine
                            ? `
                                <span>
                                    <i class="fa-solid fa-circle-check"></i>
                                    ${restaurant.cuisine}
                                </span>
                            `
                            : ""
                    }

                    ${
                        restaurant.halalStatus
                            ? `
                                <span>
                                    <i class="fa-solid fa-circle-check"></i>
                                    ${restaurant.halalStatus}
                                </span>
                            `
                            : ""
                    }

                    <span class="recommended-label">
                        <i class="fa-solid fa-sparkles"></i>
                        Recommended
                    </span>

                </div>


                <div class="food-selection-heading">

                    <div>

                        <h4>
                            Choose Your Food
                        </h4>

                        <p>
                            Select one or more items and adjust the quantity.
                        </p>

                    </div>

                    <span class="average-meal-price">
                        Avg. menu price RM${Number(
                            recommendation.averageMealPrice || 0
                        ).toFixed(2)}
                    </span>

                </div>


                <div
                    class="generated-food-selection"
                    data-meal="${mealType}"
                >

                    ${renderGeneratedFoods(
                        mealType,
                        foods
                    )}

                </div>


                <div class="generated-meal-total">

                    <span>
                        Selected Meal Total
                    </span>

                    <strong
                        id="mealTotal-${mealType}"
                    >
                        RM0.00
                    </strong>

                </div>

            `;

            generatedResults.appendChild(
                mealCard
            );
        }
    );


    /*
     * Add overall summary
     */

    const summary =
        document.createElement(
            "div"
        );

    summary.className =
        "generated-route-summary";


    summary.innerHTML = `

        <div class="summary-header">

            <div>

                <h3>
                    Route Summary
                </h3>

                <p>
                    Review your selected foods before saving.
                </p>

            </div>

            <div class="summary-budget">

                <span>
                    Daily Budget
                </span>

                <strong>
                    RM${Number(
                        route.budget
                    ).toFixed(2)}
                </strong>

            </div>

        </div>


        <div class="summary-details">

            <div>
                <span>Route</span>

                <strong>
                    ${route.routeName}
                </strong>
            </div>

            <div>
                <span>Date</span>

                <strong>
                    ${formatDate(route.date)}
                </strong>
            </div>

            <div>
                <span>Location</span>

                <strong>
                    ${route.location}
                </strong>
            </div>

        </div>


        <div class="summary-cost">

            <span>
                Current Total
            </span>

            <strong id="generatedTotal">
                RM0.00
            </strong>

        </div>


        <div
            id="budgetWarning"
            class="budget-warning"
        ></div>

        <button
            type="button"
            class="regenerate-route-btn"
            id="regenerateRouteBtn"
        >
            <i class="fa-solid fa-rotate"></i>
            Regenerate Route
        </button>

        <button
            type="button"
            class="btn btn-orange save-generated-btn"
            id="saveGeneratedRouteBtn"
        >

            <i class="fa-solid fa-floppy-disk"></i>

            ${
                isEditMode
                    ? "Update Generated Route"
                    : "Save Generated Route"
            }

        </button>

    `;


    generatedResults.appendChild(
        summary
    );


    /*
     * Attach quantity buttons
     */

    attachFoodQuantityEvents();


    /*
     * Attach save button
     */

    document
        .getElementById(
            "saveGeneratedRouteBtn"
        )
        .addEventListener(
            "click",
            saveGeneratedRoute
        );


    updateGeneratedTotal();


    const regenerateButton =
        document.getElementById("regenerateRouteBtn");

    if (regenerateButton) {
        regenerateButton.addEventListener("click", () => {
            generateRoute(true);
        });
    }


    /*
     * Scroll to results
     */

    resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================
   RENDER GENERATED FOODS
========================================= */

function renderGeneratedFoods(
    mealType,
    foods
) {

    if (
        !foods ||
        foods.length === 0
    ) {

        return `
            <div class="food-placeholder">
                No suitable food items found.
            </div>
        `;
    }


    return foods.map(
        food => `

            <div
                class="generated-food-item"
                data-meal="${mealType}"
                data-food-id="${food._id}"
            >

                <div class="generated-food-info">

                    <div class="generated-food-name">
                        ${food.name}
                    </div>

                    <div class="generated-food-price">
                        RM${Number(
                            food.price || 0
                        ).toFixed(2)}
                    </div>

                </div>


                <div class="generated-quantity-control">

                    <button
                        type="button"
                        class="generated-quantity-btn minus"
                        data-meal="${mealType}"
                        data-food-id="${food._id}"
                    >
                        −
                    </button>

                    <span class="generated-quantity-value"
                        data-meal="${mealType}"
                        data-food-id="${food._id}">
                        ${food.savedQuantity || 0}
                    </span>

                    <button
                        type="button"
                        class="generated-quantity-btn plus"
                        data-meal="${mealType}"
                        data-food-id="${food._id}"
                    >
                        +
                    </button>

                </div>

            </div>

        `
    ).join("");
}


/* =========================================
   ATTACH FOOD QUANTITY EVENTS
========================================= */

function attachFoodQuantityEvents() {

    const buttons =
        document.querySelectorAll(
            ".generated-quantity-btn"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const mealType =
                    this.dataset.meal;

                const foodId =
                    this.dataset.foodId;

                const isPlus =
                    this.classList.contains(
                        "plus"
                    );

                updateFoodQuantity(
                    mealType,
                    foodId,
                    isPlus
                );
            }
        );
    });
}


/* =========================================
   UPDATE FOOD QUANTITY
========================================= */

function updateFoodQuantity(
    mealType,
    foodId,
    isPlus
) {

    if (
        !selectedFoods[mealType]
    ) {
        selectedFoods[mealType] = [];
    }


    const food =
        findGeneratedFood(
            mealType,
            foodId
        );

    if (!food) {
        return;
    }


    const existing =
        selectedFoods[mealType].find(
            item =>
                String(item.menuId) ===
                String(foodId)
        );


    if (isPlus) {

        if (existing) {

            existing.quantity += 1;

        }

        else {

            selectedFoods[mealType].push({

                menuId:
                    food._id,

                price:
                    Number(food.price),

                quantity:
                    1

            });
        }

    }

    else {

        if (!existing) {
            return;
        }

        existing.quantity -= 1;

        if (
            existing.quantity <= 0
        ) {

            selectedFoods[mealType] =
                selectedFoods[mealType].filter(
                    item =>
                        String(item.menuId) !==
                        String(foodId)
                );
        }
    }


    updateQuantityDisplay(
        mealType,
        foodId
    );

    updateMealTotal(
        mealType
    );

    updateGeneratedTotal();
}


/* =========================================
   FIND GENERATED FOOD
========================================= */

function findGeneratedFood(
    mealType,
    foodId
) {

    if (!generatedRoute) {
        return null;
    }


    const recommendation =
        generatedRoute.recommendations.find(
            item =>
                item.mealType ===
                mealType
        );

    if (!recommendation) {
        return null;
    }


    return recommendation.foods.find(
        food =>
            String(food._id) ===
            String(foodId)
    );
}


/* =========================================
   UPDATE QUANTITY DISPLAY
========================================= */

function updateQuantityDisplay(
    mealType,
    foodId
) {

    const item =
        selectedFoods[mealType].find(
            food =>
                String(food.menuId) ===
                String(foodId)
        );

    const quantity =
        item
            ? item.quantity
            : 0;

    const quantityElement =
        document.querySelector(
            `.generated-quantity-value[data-meal="${mealType}"][data-food-id="${foodId}"]`
        );

    if (quantityElement) {

        quantityElement.textContent =
            quantity;
    }
}


/* =========================================
   UPDATE MEAL TOTAL
========================================= */

function updateMealTotal(
    mealType
) {

    const foods =
        selectedFoods[mealType] || [];

    const total =
        foods.reduce(
            (sum, item) =>
                sum +
                (
                    Number(item.price) *
                    Number(item.quantity)
                ),
            0
        );

    const totalElement =
        document.getElementById(
            `mealTotal-${mealType}`
        );

    if (totalElement) {

        totalElement.textContent =
            `RM${total.toFixed(2)}`;
    }
}


/* =========================================
   UPDATE GENERATED TOTAL
========================================= */

function updateGeneratedTotal() {

    let total = 0;

    selectedMeals.forEach(
        mealType => {

            const foods =
                selectedFoods[mealType] ||
                [];

            foods.forEach(item => {

                total +=
                    Number(item.price) *
                    Number(item.quantity);

            });
        }
    );


    const totalElement =
        document.getElementById(
            "generatedTotal"
        );

    if (totalElement) {

        totalElement.textContent =
            `RM${total.toFixed(2)}`;
    }


    /*
     * Budget warning
     */

    const warning =
        document.getElementById(
            "budgetWarning"
        );

    if (!warning) {
        return;
    }


    const budget =
        Number(
            budgetInput.value
        );


    if (total > budget) {
        const excess = total - budget;

        warning.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            Your selected food total exceeds your daily budget by
            RM${excess.toFixed(2)}.
        `;

        warning.className = "budget-warning show";
    }

    else if (total > 0) {

        const remaining =
            budget - total;

        warning.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            RM${remaining.toFixed(2)} remaining from your daily budget.
        `;

        warning.className =
            "budget-warning show success";

    }

    else {

        warning.innerHTML = `
            <i class="fa-solid fa-circle-info"></i>
            Select at least one food item from each meal you want.
        `;

        warning.className =
            "budget-warning show info";
    }
}


// =========================================
// SAVE / UPDATE GENERATED ROUTE
// =========================================

async function saveGeneratedRoute() {

    if (!generatedRoute) {
        return;
    }


    /*
     * Build meals
     */

    const meals = [];


    for (
        const recommendation
        of generatedRoute.recommendations
    ) {

        const mealType =
            recommendation.mealType;

        const foods =
            selectedFoods[mealType] || [];


        /*
         * User must select at least one
         * food for every generated meal.
         */

        if (
            foods.length === 0
        ) {

            showMessage(
                `Please select at least one food for ${mealType}.`
            );

            return;
        }


        meals.push({

            mealType:
                mealType,

            restaurantId:
                recommendation.restaurant._id,

            items:
                foods

        });

    }


    /*
     * Get save button
     */

    const saveButton =
        document.getElementById(
            "saveGeneratedRouteBtn"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            ${isEditMode ? "Updating..." : "Saving..."}
        `;

    }


    try {

        /*
         * =========================================
         * EDIT MODE
         * =========================================
         */

        let url;
        let method;


        if (isEditMode) {

            url =
                `/routes/${editRouteId}`;

            method =
                "PUT";

        }

        else {

            url =
                "/routes/create";

            method =
                "POST";

        }


        /*
         * =========================================
         * SAVE / UPDATE REQUEST
         * =========================================
         */

        const response =
            await fetch(
                url,
                {
                    method:
                        method,

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            routeName:
                                routeNameInput.value.trim(),

                            date:
                                routeDateInput.value,

                            location:
                                locationSelect.value,

                            budget:
                                Number(
                                    budgetInput.value
                                ),

                            routeType:
                                "generated",

                            meals:
                                meals

                        })
                }
            );


        const data =
            await response.json();


        /*
         * =========================================
         * HANDLE ERROR
         * =========================================
         */

        if (
            !response.ok ||
            !data.success
        ) {

            showMessage(
                data.message ||
                (
                    isEditMode
                        ? "Unable to update route."
                        : "Unable to save route."
                )
            );

            return;
        }


        /*
         * =========================================
         * SUCCESS
         * =========================================
         */

        window.location.href =
            "/routes.html";

    }

    catch (error) {

        console.error(
            isEditMode
                ? "Update generated route error:"
                : "Save generated route error:",
            error
        );

        showMessage(
            isEditMode
                ? "Something went wrong while updating the route."
                : "Something went wrong while saving the route."
        );

    }

    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                ${
                    isEditMode
                        ? "Update Generated Route"
                        : "Save Generated Route"
                }
            `;

        }

    }

}


/* =========================================
   GET MEAL ICON
========================================= */

function getMealIcon(
    mealType
) {

    if (
        mealType === "Breakfast"
    ) {

        return `
            <i class="fa-solid fa-mug-hot"></i>
        `;

    }

    if (
        mealType === "Lunch"
    ) {

        return `
            <i class="fa-solid fa-bowl-food"></i>
        `;

    }

    if (
        mealType === "Dinner"
    ) {

        return `
            <i class="fa-solid fa-moon"></i>
        `;

    }

    return `
        <i class="fa-solid fa-utensils"></i>
    `;
}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(
    date
) {

    if (!date) {
        return "-";
    }

    const dateObject =
        new Date(date);

    return dateObject.toLocaleDateString(
        "en-MY",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================
   EVENT LISTENER
========================================= */

generateBtn.addEventListener(
    "click",
    generateRoute
);


/* =========================================
   INITIALIZE PAGE
========================================= */

async function initializePage() {

    setTodayDate();

    await loadLocations();

    await loadSavedGeneratedRoute();
}

initializePage();