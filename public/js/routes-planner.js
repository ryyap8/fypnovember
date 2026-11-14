/* =========================================
   ROUTE PLANNER
========================================= */

let restaurants = [];

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

const budgetSlider =
    document.getElementById("budget");

const budgetValue =
    document.getElementById("budgetValue");

const summaryBudget =
    document.getElementById("summaryBudget");

const totalCostElement =
    document.getElementById("totalCost");

const remainingBudgetElement =
    document.getElementById("remainingBudget");

const budgetStatus =
    document.getElementById("budgetStatus");

const saveRouteBtn =
    document.getElementById("saveRouteBtn");

const backBtn =
    document.getElementById("backBtn");

const plannerMessage =
    document.getElementById("plannerMessage");


/* =========================================
   SET TODAY'S DATE
========================================= */

function setTodayDate() {

    const today = new Date();

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
}


/* =========================================
   LOAD RESTAURANTS
========================================= */

async function loadRestaurants() {

    try {

        const response =
            await fetch("/restaurants");

        if (!response.ok) {

            throw new Error(
                "Failed to load restaurants."
            );

        }

        restaurants =
            await response.json();

        loadLocations();

        return true;

    }
    catch (error) {

        console.error(
            "Load restaurants error:",
            error
        );

        showMessage(
            "Unable to load restaurants. Please try again.",
            "error"
        );

        return false;
    }
}


/* =========================================
   LOAD UNIQUE LOCATIONS
========================================= */

function loadLocations() {

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


/* =========================================
   LOCATION CHANGED
========================================= */

locationSelect.addEventListener(
    "change",
    function () {

        const location =
            this.value;

        resetMealSelections();

        if (!location) {

            disableAllRestaurantSelects();

            return;
        }

        enableRestaurantSelects();

        document
            .querySelectorAll(
                ".restaurant-select"
            )
            .forEach(
                select => {

                    populateRestaurants(
                        select,
                        location
                    );

                }
            );

    }
);


/* =========================================
   POPULATE RESTAURANTS
========================================= */

function populateRestaurants(
    select,
    location
) {

    select.innerHTML = `
        <option value="">
            Select restaurant
        </option>
    `;

    const filteredRestaurants =
        restaurants.filter(
            restaurant =>
                restaurant.location ===
                location
        );

    filteredRestaurants.forEach(
        restaurant => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                restaurant._id;

            let displayName =
                restaurant.restaurantName;

            if (restaurant.branch) {

                displayName +=
                    ` - ${restaurant.branch}`;

            }

            option.textContent =
                displayName;

            select.appendChild(
                option
            );

        }
    );

    select.disabled =
        filteredRestaurants.length === 0;

    if (
        filteredRestaurants.length === 0
    ) {

        select.innerHTML = `
            <option value="">
                No restaurants available
            </option>
        `;

    }
}


/* =========================================
   RESTAURANT SELECT CHANGED
========================================= */

document
    .querySelectorAll(
        ".restaurant-select"
    )
    .forEach(
        select => {

            select.addEventListener(
                "change",
                async function () {

                    const restaurantId =
                        this.value;

                    const mealType =
                        this.dataset.meal;

                    const foodSelection =
                        document.querySelector(
                            `.food-selection[data-meal="${mealType}"]`
                        );

                    const priceElement =
                        document.getElementById(
                            `${mealType.toLowerCase()}Price`
                        );

                    resetFoodSelection(
                        foodSelection,
                        priceElement
                    );

                    selectedFoods[mealType] =
                        [];

                    if (!restaurantId) {
                        return;
                    }

                    await loadFoods(
                        restaurantId,
                        mealType,
                        foodSelection
                    );

                }
            );

        }
    );


/* =========================================
   LOAD FOODS
========================================= */

async function loadFoods(
    restaurantId,
    mealType,
    foodSelection,
    existingItems = []
) {

    try {

        foodSelection.innerHTML = `
            <div class="food-placeholder">
                Loading food...
            </div>
        `;

        const response =
            await fetch(
                `/menu/restaurant/${restaurantId}`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load food."
            );

        }

        const data =
            await response.json();

        const foods =
            data.foods || [];


        /* -------------------------
           FILTER MEAL TYPE
        ------------------------- */

        const availableFoods =
            foods.filter(
                food => {

                    if (
                        !Array.isArray(
                            food.mealType
                        )
                    ) {

                        return false;

                    }

                    const mealTypes =
                        food.mealType.map(
                            type =>
                                String(type)
                                    .trim()
                                    .toLowerCase()
                        );

                    const selectedMeal =
                        mealType
                            .trim()
                            .toLowerCase();

                    return (
                        mealTypes.includes(
                            selectedMeal
                        ) ||
                        mealTypes.includes(
                            "all day"
                        ) ||
                        mealTypes.includes(
                            "all-day"
                        )
                    );

                }
            );


        /* -------------------------
           NO FOOD
        ------------------------- */

        if (
            availableFoods.length === 0
        ) {

            foodSelection.innerHTML = `
                <div class="food-placeholder">
                    No food available for ${mealType}
                </div>
            `;

            return;

        }


        /* -------------------------
           DISPLAY FOOD ITEMS
        ------------------------- */

        foodSelection.innerHTML = "";


        availableFoods.forEach(
            food => {

                const foodItem =
                    document.createElement(
                        "div"
                    );

                foodItem.className =
                    "food-item";


                const foodInfo =
                    document.createElement(
                        "div"
                    );

                foodInfo.className =
                    "food-info";


                const foodName =
                    document.createElement(
                        "div"
                    );

                foodName.className =
                    "food-name";

                foodName.textContent =
                    food.name;


                const foodPrice =
                    document.createElement(
                        "div"
                    );

                foodPrice.className =
                    "food-item-price";

                foodPrice.textContent =
                    `RM${Number(food.price).toFixed(2)}`;


                foodInfo.appendChild(
                    foodName
                );

                foodInfo.appendChild(
                    foodPrice
                );


                /* -------------------------
                   QUANTITY CONTROL
                ------------------------- */

                const quantityControl =
                    document.createElement(
                        "div"
                    );

                quantityControl.className =
                    "quantity-control";


                const minusButton =
                    document.createElement(
                        "button"
                    );

                minusButton.type =
                    "button";

                minusButton.className =
                    "quantity-btn";

                minusButton.innerHTML =
                    `<i class="fa-solid fa-minus"></i>`;


                const quantityValue =
                    document.createElement(
                        "span"
                    );

                quantityValue.className =
                    "quantity-value";


                /* -------------------------
                   EXISTING QUANTITY
                ------------------------- */

                const existingItem =
                    existingItems.find(
                        item =>
                            String(
                                item.menuId?._id ||
                                item.menuId
                            ) ===
                            String(food._id)
                    );


                let quantity =
                    existingItem
                        ? Number(
                            existingItem.quantity
                        )
                        : 0;


                quantityValue.textContent =
                    quantity;


                const plusButton =
                    document.createElement(
                        "button"
                    );

                plusButton.type =
                    "button";

                plusButton.className =
                    "quantity-btn";

                plusButton.innerHTML =
                    `<i class="fa-solid fa-plus"></i>`;


                quantityControl.appendChild(
                    minusButton
                );

                quantityControl.appendChild(
                    quantityValue
                );

                quantityControl.appendChild(
                    plusButton
                );


                foodItem.appendChild(
                    foodInfo
                );

                foodItem.appendChild(
                    quantityControl
                );

                foodSelection.appendChild(
                    foodItem
                );


                /* -------------------------
                   RESTORE SELECTED FOOD
                ------------------------- */

                if (quantity > 0) {

                    selectedFoods[mealType].push({

                        menuId:
                            food._id,

                        price:
                            Number(food.price),

                        quantity:
                            quantity

                    });

                }


                /* -------------------------
                   PLUS BUTTON
                ------------------------- */

                plusButton.addEventListener(
                    "click",
                    function () {

                        quantity++;

                        quantityValue.textContent =
                            quantity;

                        updateSelectedFood(
                            mealType,
                            food,
                            quantity
                        );

                    }
                );


                /* -------------------------
                   MINUS BUTTON
                ------------------------- */

                minusButton.addEventListener(
                    "click",
                    function () {

                        if (
                            quantity <= 0
                        ) {

                            return;

                        }

                        quantity--;

                        quantityValue.textContent =
                            quantity;

                        updateSelectedFood(
                            mealType,
                            food,
                            quantity
                        );

                    }
                );

            }
        );


        updateMealTotal(
            mealType
        );

        calculateTotal();

    }
    catch (error) {

        console.error(
            "Load foods error:",
            error
        );

        foodSelection.innerHTML = `
            <div class="food-placeholder">
                Unable to load food
            </div>
        `;

    }
}


/* =========================================
   UPDATE SELECTED FOOD
========================================= */

function updateSelectedFood(
    mealType,
    food,
    quantity
) {

    const foods =
        selectedFoods[mealType];


    const existingIndex =
        foods.findIndex(
            item =>
                item.menuId ===
                food._id
        );


    /* -------------------------
       REMOVE IF QUANTITY = 0
    ------------------------- */

    if (quantity === 0) {

        if (
            existingIndex !== -1
        ) {

            foods.splice(
                existingIndex,
                1
            );

        }

    }

    /* -------------------------
       ADD / UPDATE FOOD
    ------------------------- */

    else {

        const foodData = {

            menuId:
                food._id,

            price:
                Number(food.price),

            quantity:
                quantity

        };


        if (
            existingIndex === -1
        ) {

            foods.push(
                foodData
            );

        }
        else {

            foods[existingIndex] =
                foodData;

        }

    }


    updateMealTotal(
        mealType
    );

    calculateTotal();
}


/* =========================================
   UPDATE MEAL TOTAL
========================================= */

function updateMealTotal(
    mealType
) {

    let total = 0;

    selectedFoods[mealType]
        .forEach(
            food => {

                total +=
                    Number(food.price) *
                    Number(food.quantity);

            }
        );


    const priceElement =
        document.getElementById(
            `${mealType.toLowerCase()}Price`
        );

    priceElement.textContent =
        `RM${total.toFixed(2)}`;
}


/* =========================================
   BUDGET SLIDER
========================================= */

budgetSlider.addEventListener(
    "input",
    function () {

        const budget =
            Number(this.value);

        budgetValue.textContent =
            `RM${budget}`;

        calculateTotal();

    }
);


/* =========================================
   CALCULATE TOTAL
========================================= */

function calculateTotal() {

    let total = 0;


    Object.values(
        selectedFoods
    )
    .forEach(
        mealFoods => {

            mealFoods.forEach(
                food => {

                    total +=
                        Number(food.price) *
                        Number(food.quantity);

                }
            );

        }
    );


    const budget =
        Number(
            budgetSlider.value
        );

    const remaining =
        budget - total;


    totalCostElement.textContent =
        `RM${total.toFixed(2)}`;

    summaryBudget.textContent =
        `RM${budget.toFixed(2)}`;

    remainingBudgetElement.textContent =
        `RM${remaining.toFixed(2)}`;


    if (remaining >= 0) {

        budgetStatus.className =
            "budget-status within";

        budgetStatus.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            Within Budget
        `;

    }
    else {

        const overAmount =
            Math.abs(remaining);

        budgetStatus.className =
            "budget-status over";

        budgetStatus.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            Over Budget by RM${overAmount.toFixed(2)}
        `;

    }
}


/* =========================================
   LOAD ROUTE FOR EDIT
========================================= */

async function loadRouteForEdit() {

    try {

        const response =
            await fetch(
                `/routes/${editRouteId}`
            );

        if (!response.ok) {

            throw new Error(
                "Unable to load route."
            );

        }

        const data =
            await response.json();

        const route =
            data.route;


        if (!route) {

            throw new Error(
                "Route not found."
            );

        }


        /* -------------------------
           ROUTE NAME
        ------------------------- */

        routeNameInput.value =
            route.routeName || "";


        /* -------------------------
           DATE
        ------------------------- */

        const routeDate =
            new Date(route.date);

        const year =
            routeDate.getFullYear();

        const month =
            String(
                routeDate.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                routeDate.getDate()
            ).padStart(2, "0");

        routeDateInput.value =
            `${year}-${month}-${day}`;


        /* -------------------------
           BUDGET
        ------------------------- */

        budgetSlider.value =
            Number(route.budget);

        budgetValue.textContent =
            `RM${Number(route.budget)}`;


        /* -------------------------
           LOCATION
        ------------------------- */

        locationSelect.value =
            route.location;


        enableRestaurantSelects();


        /* -------------------------
           POPULATE RESTAURANTS
        ------------------------- */

        document
            .querySelectorAll(
                ".restaurant-select"
            )
            .forEach(
                select => {

                    populateRestaurants(
                        select,
                        route.location
                    );

                }
            );


        /* -------------------------
           RESET SELECTED FOODS
        ------------------------- */

        selectedFoods = {
            Breakfast: [],
            Lunch: [],
            Dinner: []
        };


        /* -------------------------
           LOAD EACH MEAL
        ------------------------- */

        for (
            const meal
            of route.meals
        ) {

            const mealType =
                meal.mealType;

            const restaurantId =
                meal.restaurantId?._id ||
                meal.restaurantId;


            const restaurantSelect =
                document.querySelector(
                    `.restaurant-select[data-meal="${mealType}"]`
                );


            const foodSelection =
                document.querySelector(
                    `.food-selection[data-meal="${mealType}"]`
                );


            if (
                !restaurantSelect ||
                !foodSelection ||
                !restaurantId
            ) {

                continue;

            }


            restaurantSelect.value =
                restaurantId;


            await loadFoods(
                restaurantId,
                mealType,
                foodSelection,
                meal.items || []
            );

        }


        calculateTotal();


        /* -------------------------
           CHANGE BUTTON
        ------------------------- */

        saveRouteBtn.innerHTML = `
            <i class="fa-solid fa-pen-to-square"></i>
            Update Route
        `;

    }
    catch (error) {

        console.error(
            "Load route for edit error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load route.",
            "error"
        );

    }
}


/* =========================================
   SAVE / UPDATE ROUTE
========================================= */

saveRouteBtn.addEventListener(
    "click",
    async function () {

        clearMessage();


        /* -------------------------
           BASIC VALIDATION
        ------------------------- */

        const routeName =
            routeNameInput.value.trim();

        const date =
            routeDateInput.value;

        const location =
            locationSelect.value;

        const budget =
            Number(
                budgetSlider.value
            );


        if (!routeName) {

            showMessage(
                "Please enter a route name.",
                "error"
            );

            routeNameInput.focus();

            return;

        }


        if (!date) {

            showMessage(
                "Please select a date.",
                "error"
            );

            routeDateInput.focus();

            return;

        }


        if (!location) {

            showMessage(
                "Please select a location.",
                "error"
            );

            locationSelect.focus();

            return;

        }


        /* -------------------------
           BUILD MEALS
        ------------------------- */

        const meals = [];

        const mealTypes = [
            "Breakfast",
            "Lunch",
            "Dinner"
        ];


        for (
            const mealType
            of mealTypes
        ) {

            const restaurantSelect =
                document.querySelector(
                    `.restaurant-select[data-meal="${mealType}"]`
                );


            const selectedMealFoods =
                selectedFoods[
                    mealType
                ];


            if (
                restaurantSelect.value &&
                selectedMealFoods.length === 0
            ) {

                showMessage(
                    `Please select at least one food for ${mealType.toLowerCase()}.`,
                    "error"
                );

                return;

            }


            if (
                !restaurantSelect.value &&
                selectedMealFoods.length > 0
            ) {

                showMessage(
                    `Please select a restaurant for ${mealType.toLowerCase()}.`,
                    "error"
                );

                return;

            }


            if (
                restaurantSelect.value &&
                selectedMealFoods.length > 0
            ) {

                meals.push({

                    mealType:
                        mealType,

                    restaurantId:
                        restaurantSelect.value,

                    items:
                        selectedMealFoods.map(
                            food => ({

                                menuId:
                                    food.menuId,

                                price:
                                    food.price,

                                quantity:
                                    food.quantity

                            })
                        )

                });

            }

        }


        if (
            meals.length === 0
        ) {

            showMessage(
                "Please select at least one meal.",
                "error"
            );

            return;

        }


        /* -------------------------
           SAVE BUTTON
        ------------------------- */

        saveRouteBtn.disabled =
            true;

        saveRouteBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            ${isEditMode
                ? "Updating..."
                : "Saving..."
            }
        `;


        try {

            /* -------------------------
               REQUEST DETAILS
            ------------------------- */

            const url =
                isEditMode
                    ? `/routes/${editRouteId}`
                    : "/routes/create";

            const method =
                isEditMode
                    ? "PUT"
                    : "POST";


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
                                    routeName,

                                date:
                                    date,

                                location:
                                    location,

                                budget:
                                    budget,

                                meals:
                                    meals

                            })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    (
                        isEditMode
                            ? "Unable to update route."
                            : "Unable to save route."
                    )
                );

            }


            /* -------------------------
               SUCCESS MESSAGE
            ------------------------- */

            showMessage(
                isEditMode
                    ? "Food route updated successfully!"
                    : "Food route saved successfully!",
                "success"
            );


            saveRouteBtn.innerHTML = `
                <i class="fa-solid fa-check"></i>
                ${isEditMode
                    ? "Updated"
                    : "Saved"
                }
            `;


            setTimeout(
                () => {

                    window.location.href =
                        "/routes.html";

                },
                1200
            );

        }
        catch (error) {

            console.error(
                "Save/update route error:",
                error
            );


            showMessage(
                error.message ||
                (
                    isEditMode
                        ? "Unable to update route."
                        : "Unable to save route."
                ),
                "error"
            );


            saveRouteBtn.disabled =
                false;

            saveRouteBtn.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                ${isEditMode
                    ? "Update Route"
                    : "Save Route"
                }
            `;

        }

    }
);


/* =========================================
   BACK BUTTON
========================================= */

backBtn.addEventListener(
    "click",
    function () {

        window.location.href =
            "/routes.html";

    }
);


/* =========================================
   RESET MEAL SELECTIONS
========================================= */

function resetMealSelections() {

    document
        .querySelectorAll(
            ".restaurant-select"
        )
        .forEach(
            select => {

                select.innerHTML = `
                    <option value="">
                        Select restaurant
                    </option>
                `;

                select.disabled =
                    true;

            }
        );


    document
        .querySelectorAll(
            ".food-selection"
        )
        .forEach(
            foodSelection => {

                foodSelection.innerHTML = `
                    <div class="food-placeholder">
                        Select a restaurant first
                    </div>
                `;

            }
        );


    const mealTypes = [
        "Breakfast",
        "Lunch",
        "Dinner"
    ];


    mealTypes.forEach(
        mealType => {

            selectedFoods[
                mealType
            ] = [];


            const priceElement =
                document.getElementById(
                    `${mealType.toLowerCase()}Price`
                );

            priceElement.textContent =
                "RM0.00";

        }
    );


    calculateTotal();
}


/* =========================================
   ENABLE RESTAURANT SELECTS
========================================= */

function enableRestaurantSelects() {

    document
        .querySelectorAll(
            ".restaurant-select"
        )
        .forEach(
            select => {

                select.disabled =
                    false;

            }
        );
}


/* =========================================
   DISABLE RESTAURANT SELECTS
========================================= */

function disableAllRestaurantSelects() {

    document
        .querySelectorAll(
            ".restaurant-select"
        )
        .forEach(
            select => {

                select.disabled =
                    true;

            }
        );
}


/* =========================================
   RESET FOOD SELECTION
========================================= */

function resetFoodSelection(
    foodSelection,
    priceElement
) {

    foodSelection.innerHTML = `
        <div class="food-placeholder">
            Select a restaurant first
        </div>
    `;

    priceElement.textContent =
        "RM0.00";
}


/* =========================================
   MESSAGE
========================================= */

function showMessage(
    message,
    type
) {

    plannerMessage.textContent =
        message;

    plannerMessage.className =
        `planner-message ${type}`;

}


function clearMessage() {

    plannerMessage.textContent =
        "";

    plannerMessage.className =
        "planner-message";

}


/* =========================================
   INITIALIZE PAGE
========================================= */

async function initializePage() {

    if (!isEditMode) {

        setTodayDate();

        calculateTotal();

        await loadRestaurants();

        return;
    }


    /* -------------------------
       EDIT MODE
    ------------------------- */

    const loaded =
        await loadRestaurants();

    if (!loaded) {
        return;
    }

    await loadRouteForEdit();

}


/* =========================================
   START PAGE
========================================= */

initializePage();