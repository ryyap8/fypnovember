/* =========================================
   SAVED ROUTES
========================================= */

const savedRoutesContainer =
    document.getElementById("savedRoutesContainer");

const routeCount =
    document.getElementById("routeCount");


/* =========================================
   LOAD SAVED ROUTES
========================================= */

async function loadSavedRoutes() {

    try {

        const response =
            await fetch("/routes/my-routes");

        if (!response.ok) {

            throw new Error(
                "Unable to load saved routes."
            );

        }

        const data =
            await response.json();

        const routes =
            data.routes || [];

        routeCount.textContent =
            `${routes.length} ${routes.length === 1 ? "route" : "routes"}`;


        if (routes.length === 0) {

            savedRoutesContainer.innerHTML = `
                <div class="empty-box">
                    <i class="fa-solid fa-route"></i>
                    <p>Start planning routes to see them here</p>
                </div>
            `;

            return;
        }


        savedRoutesContainer.innerHTML =
            routes
                .map(route => createRouteCard(route))
                .join("");

        attachEditEvents();
        attachDeleteEvents();

    }
    catch (error) {

        console.error(
            "Load saved routes error:",
            error
        );

        savedRoutesContainer.innerHTML = `
            <div class="empty-box">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Unable to load your saved routes.</p>
            </div>
        `;

    }
}


/* =========================================
   CREATE ROUTE CARD
========================================= */

function createRouteCard(route) {

    const routeDate =
        new Date(route.date);

    const formattedDate =
        routeDate.toLocaleDateString(
            "en-MY",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );


    const mealsHTML =
        route.meals
            .map(meal => {

                const restaurant =
                    meal.restaurantId;

                const items =
                    meal.items || [];


                let restaurantName =
                    restaurant?.restaurantName ||
                    "Restaurant";


                if (restaurant?.branch) {

                    restaurantName +=
                        ` - ${restaurant.branch}`;

                }


                /* -------------------------
                   FOOD ITEMS
                ------------------------- */

                const foodItemsHTML =
                    items
                        .map(item => {

                            const food =
                                item.menuId;

                            const quantity =
                                Number(
                                    item.quantity || 1
                                );

                            const price =
                                Number(
                                    item.price || 0
                                );

                            const itemTotal =
                                price * quantity;


                            return `
                                <div class="saved-food-item">

                                    <span class="saved-food-name">

                                        ${escapeHTML(
                                            food?.name ||
                                            "Food"
                                        )}

                                        ${
                                            quantity > 1
                                                ? `<small>× ${quantity}</small>`
                                                : ""
                                        }

                                    </span>

                                    <span class="saved-food-price">
                                        RM${itemTotal.toFixed(2)}
                                    </span>

                                </div>
                            `;

                        })
                        .join("");


                /* -------------------------
                   MEAL TOTAL
                ------------------------- */

                const mealTotal =
                    items.reduce(
                        (total, item) => {

                            const price =
                                Number(
                                    item.price || 0
                                );

                            const quantity =
                                Number(
                                    item.quantity || 1
                                );

                            return total +
                                (price * quantity);

                        },
                        0
                    );


                return `
                    <div class="saved-meal">

                        <div class="meal-icon">
                            ${getMealIcon(meal.mealType)}
                        </div>

                        <div class="meal-info">

                            <span class="meal-type">
                                ${escapeHTML(
                                    meal.mealType
                                )}
                            </span>

                            <div class="saved-food-list">

                                ${foodItemsHTML}

                            </div>

                            <small>
                                ${escapeHTML(
                                    restaurantName
                                )}
                            </small>

                        </div>

                        <span class="meal-price">
                            RM${mealTotal.toFixed(2)}
                        </span>

                    </div>
                `;

            })
            .join("");


    /* =========================================
       REMAINING BUDGET
    ========================================= */

    const remaining =
        Number(route.budget) -
        Number(route.totalCost);


    return `
        <div class="saved-route-card">

            <div class="route-card-header">

                <div>

                    <h3>
                        ${escapeHTML(
                            route.routeName
                        )}
                    </h3>

                    <div class="route-meta">

                        <span>
                            <i class="fa-regular fa-calendar"></i>
                            ${formattedDate}
                        </span>

                        <span>
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapeHTML(
                                route.location
                            )}
                        </span>

                    </div>

                </div>

                <span class="route-type ${
                    route.routeType === "generated"
                        ? "system-generated"
                        : "user-planned"
                }">
                    ${
                        route.routeType === "generated"
                            ? "System Generated"
                            : "User Planned"
                    }
                </span>

            </div>


            <div class="saved-meals">

                ${mealsHTML}

            </div>


            <div class="route-summary">

                <div>

                    <span>
                        Budget
                    </span>

                    <strong>
                        RM${Number(
                            route.budget
                        ).toFixed(2)}
                    </strong>

                </div>


                <div>

                    <span>
                        Total Food Cost
                    </span>

                    <strong>
                        RM${Number(
                            route.totalCost
                        ).toFixed(2)}
                    </strong>

                </div>


                <div>

                    <span>
                        Remaining
                    </span>

                    <strong
                        class="${
                            remaining < 0
                                ? "over-budget"
                                : "within-budget"
                        }"
                    >
                        RM${remaining.toFixed(2)}
                    </strong>

                </div>

            </div>


            <div class="route-card-actions">

                <button
                    class="edit-route-btn"
                    data-id="${route._id}"
                    data-type="${route.routeType || "planned"}"
                >
                    <i class="fa-solid fa-pen"></i>
                    Edit
                </button>

                <button
                    class="delete-route-btn"
                    data-id="${route._id}"
                >
                    <i class="fa-regular fa-trash-can"></i>
                    Delete
                </button>

            </div>

        </div>
    `;
}


/* =========================================
   MEAL ICON
========================================= */

function getMealIcon(mealType) {

    if (mealType === "Breakfast") {

        return `
            <i class="fa-solid fa-mug-hot"></i>
        `;

    }


    if (mealType === "Lunch") {

        return `
            <i class="fa-solid fa-bowl-food"></i>
        `;

    }


    if (mealType === "Dinner") {

        return `
            <i class="fa-solid fa-moon"></i>
        `;

    }


    return `
        <i class="fa-solid fa-utensils"></i>
    `;
}


/* =========================================
   EDIT ROUTE
========================================= */

function attachEditEvents() {

    document.querySelectorAll(".edit-route-btn")
        .forEach(btn => {

            btn.addEventListener("click", () => {

                const routeId =
                    btn.dataset.id;

                const routeType =
                    btn.dataset.type;

                if (routeType === "generated") {

                    window.location.href =
                        `/routes-generated.html?edit=${routeId}`;

                } else {

                    window.location.href =
                        `/routes-planner.html?edit=${routeId}`;

                }

            });

        });
}


/* =========================================
   DELETE ROUTE
========================================= */

function attachDeleteEvents() {

    document
        .querySelectorAll(
            ".delete-route-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async function () {

                        const routeId =
                            this.dataset.id;


                        const confirmed =
                            confirm(
                                "Are you sure you want to delete this route?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        try {

                            const response =
                                await fetch(
                                    `/routes/${routeId}`,
                                    {
                                        method:
                                            "DELETE"
                                    }
                                );


                            const data =
                                await response.json();


                            if (!response.ok) {

                                throw new Error(
                                    data.message ||
                                    "Unable to delete route."
                                );

                            }


                            loadSavedRoutes();

                        }
                        catch (error) {

                            console.error(
                                "Delete route error:",
                                error
                            );

                            alert(
                                error.message
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}


/* =========================================
   INITIALIZE
========================================= */

loadSavedRoutes();