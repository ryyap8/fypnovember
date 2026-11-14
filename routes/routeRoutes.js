const express = require("express");
const router = express.Router();

const Route = require("../models/Route");
const Restaurant = require("../models/Restaurant");
const Menu = require("../models/menu");
const Favourite = require("../models/Favourite");


// =========================================
// CREATE PLANNED ROUTE
// =========================================

router.post("/create", async (req, res) => {
    try {

        // Check login
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login."
            });
        }

        const {
            routeName,
            date,
            location,
            budget,
            meals
        } = req.body;

        // Basic validation
        if (
            !routeName ||
            !date ||
            !location ||
            budget === undefined ||
            !meals ||
            meals.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }

        // =========================================
        // VALIDATE EACH MEAL
        // =========================================

        let totalCost = 0;
        const validatedMeals = [];

        for (const meal of meals) {

            const {
                mealType,
                restaurantId,
                items
            } = meal;

            // Check meal information
            if (
                !mealType ||
                !restaurantId ||
                !Array.isArray(items) ||
                items.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Please complete your ${mealType || "meal"} selection.`
                });
            }

            // Check restaurant
            const restaurant = await Restaurant.findOne({
                _id: restaurantId,
                profileCompleted: true
            });

            if (!restaurant) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${mealType}: Restaurant not found.`
                });
            }

            // =========================================
            // VALIDATE EACH FOOD ITEM
            // =========================================

            const validatedItems = [];

            for (const item of items) {

                const {
                    menuId,
                    quantity
                } = item;

                // Validate quantity
                const itemQuantity =
                    Number(quantity);

                if (
                    !menuId ||
                    !Number.isInteger(itemQuantity) ||
                    itemQuantity < 1
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `${mealType}: Invalid food quantity.`
                    });
                }

                // Check menu belongs to selected restaurant
                const food = await Menu.findOne({
                    _id: menuId,
                    restaurantId: restaurant.owner
                });

                if (!food) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `${mealType}: Food not found for this restaurant.`
                    });
                }

                // =========================================
                // CHECK FOOD MEAL TYPE
                // =========================================

                const foodMealTypes =
                    Array.isArray(food.mealType)
                        ? food.mealType.map(type =>
                            String(type)
                                .trim()
                                .toLowerCase()
                        )
                        : [];

                const selectedMealType =
                    String(mealType)
                        .trim()
                        .toLowerCase();

                if (
                    !foodMealTypes.includes(
                        selectedMealType
                    ) &&
                    !foodMealTypes.includes(
                        "all day"
                    ) &&
                    !foodMealTypes.includes(
                        "all-day"
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `${food.name} is not available for ${mealType}.`
                    });
                }

                // =========================================
                // CALCULATE PRICE
                // =========================================

                const foodPrice =
                    Number(food.price);

                const itemTotal =
                    foodPrice * itemQuantity;

                totalCost += itemTotal;

                validatedItems.push({
                    menuId: food._id,
                    price: foodPrice,
                    quantity: itemQuantity
                });
            }

            // =========================================
            // ADD VALIDATED MEAL
            // =========================================

            validatedMeals.push({
                mealType: mealType,
                restaurantId: restaurant._id,
                items: validatedItems
            });
        }

        // =========================================
        // CREATE ROUTE
        // =========================================

        const newRoute = new Route({
            userId: req.session.user._id,
            routeName: routeName,
            date: date,
            location: location,
            budget: Number(budget),

            routeType:
            req.body.routeType === "generated"
                ? "generated"
                : "planned",

            meals: validatedMeals,
            totalCost: totalCost
        });

        await newRoute.save();

        // =========================================
        // SUCCESS
        // =========================================

        res.json({
            success: true,
            message: "Food route saved successfully.",
            route: newRoute
        });

    }

    catch (err) {

        console.error(
            "Create route error:",
            err
        );

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


// =========================================
// GENERATE SYSTEM FOOD ROUTE
// =========================================

router.post("/generate", async (req, res) => {
    try {

        // =========================================
        // CHECK LOGIN
        // =========================================

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login."
            });
        }


        // =========================================
        // GET USER INPUT
        // =========================================

        const {
            routeName,
            date,
            location,
            budget,
            meals,
            cuisine,
            halalStatus
        } = req.body;


        // =========================================
        // BASIC VALIDATION
        // =========================================

        if (
            !routeName ||
            !date ||
            !location ||
            budget === undefined ||
            !Array.isArray(meals) ||
            meals.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please complete all required fields."
            });
        }


        const dailyBudget =
            Number(budget);


        if (
            !Number.isFinite(dailyBudget) ||
            dailyBudget <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid daily budget."
            });
        }


        // =========================================
        // VALID MEALS
        // =========================================

        const validMeals = [
            "Breakfast",
            "Lunch",
            "Dinner"
        ];


        const selectedMeals =
            meals.filter(meal =>
                validMeals.includes(meal)
            );


        if (selectedMeals.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select at least one meal."
            });
        }


        // =========================================
        // FIND SUITABLE RESTAURANTS
        // =========================================

        const restaurantQuery = {
            profileCompleted: true,
            location: location
        };


        // Optional cuisine filter
        if (cuisine) {
            restaurantQuery.cuisine =
                cuisine;
        }


        // Optional halal filter
        if (halalStatus) {
            restaurantQuery.halalStatus =
                halalStatus;
        }


        const restaurants =
            await Restaurant.find(
                restaurantQuery
            );


        if (restaurants.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "No suitable restaurants were found for your selected preferences."
            });
        }


        // =========================================
        // GET FAVOURITE COUNTS
        // =========================================

        const restaurantIds =
            restaurants.map(
                restaurant =>
                    restaurant._id
            );


        const favouriteCounts =
            await Favourite.aggregate([
                {
                    $match: {
                        restaurantId: {
                            $in: restaurantIds
                        }
                    }
                },

                {
                    $group: {
                        _id: "$restaurantId",
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]);


        const favouriteMap =
            new Map();


        favouriteCounts.forEach(item => {

            favouriteMap.set(
                String(item._id),
                item.count
            );

        });


        // =========================================
        // MAX REVIEW / FAVOURITE VALUES
        // =========================================

        const maxReviews =
            Math.max(
                ...restaurants.map(
                    restaurant =>
                        Number(
                            restaurant.totalRatings || 0
                        )
                ),
                0
            );


        const maxFavourites =
            Math.max(
                ...restaurants.map(
                    restaurant =>
                        favouriteMap.get(
                            String(
                                restaurant._id
                            )
                        ) || 0
                ),
                0
            );


        // =========================================
        // PREPARE ALL MEAL RECOMMENDATIONS
        // =========================================

        const recommendations = [];

        /*
         * Restaurants already selected for another
         * meal will be avoided when another suitable
         * restaurant is available.
         */

        const usedRestaurantIds = new Set();

        const previousRecommendationsByMeal =
            req.body.previousRecommendationsByMeal || {};

        const excludedRestaurantIds = new Set(
            Array.isArray(req.body.excludeRestaurantIds)
                ? req.body.excludeRestaurantIds.map(String)
                : []
        );

        for (const mealType of selectedMeals) {

            const candidates = [];


            // =========================================
            // CHECK EACH RESTAURANT
            // =========================================

            for (const restaurant of restaurants) {

                // =========================================
                // GET RESTAURANT FOODS
                // =========================================

                const foods =
                    await Menu.find({
                        restaurantId:
                            restaurant.owner
                    });


                // =========================================
                // FILTER FOODS BY MEAL TYPE
                // =========================================

                const mealFoods =
                    foods.filter(food => {

                        if (
                            !Array.isArray(
                                food.mealType
                            )
                        ) {
                            return false;
                        }


                        const foodMealTypes =
                            food.mealType.map(
                                type =>
                                    String(type)
                                        .trim()
                                        .toLowerCase()
                            );


                        const selectedMealType =
                            String(mealType)
                                .trim()
                                .toLowerCase();


                        return (
                            foodMealTypes.includes(
                                selectedMealType
                            ) ||
                            foodMealTypes.includes(
                                "all day"
                            ) ||
                            foodMealTypes.includes(
                                "all-day"
                            )
                        );

                    });


                /*
                 * Restaurant must have at least
                 * one suitable food.
                 */

                if (
                    mealFoods.length === 0
                ) {
                    continue;
                }


                // =========================================
                // CALCULATE AVERAGE MENU PRICE
                // =========================================

                const totalMenuPrice =
                    mealFoods.reduce(
                        (sum, food) =>
                            sum +
                            Number(
                                food.price || 0
                            ),
                        0
                    );


                const averageMealPrice =
                    totalMenuPrice /
                    mealFoods.length;


                // =========================================
                // RATING SCORE
                // =========================================

                const averageRating =
                    Number(
                        restaurant.averageRating || 0
                    );


                const ratingScore =
                    averageRating / 5;


                // =========================================
                // REVIEW SCORE
                // =========================================

                const reviewCount =
                    Number(
                        restaurant.totalRatings || 0
                    );


                const reviewScore =
                    maxReviews > 0
                        ? reviewCount /
                          maxReviews
                        : 0;


                // =========================================
                // FAVOURITE SCORE
                // =========================================

                const favouriteCount =
                    favouriteMap.get(
                        String(
                            restaurant._id
                        )
                    ) || 0;


                const favouriteScore =
                    maxFavourites > 0
                        ? favouriteCount /
                          maxFavourites
                        : 0;


                // =========================================
                // POPULARITY SCORE
                // =========================================

                const popularityScore =
                    (
                        reviewScore * 0.5
                    ) +
                    (
                        favouriteScore * 0.5
                    );


                // =========================================
                // FINAL SCORE
                // =========================================

                const recommendationScore =
                    (
                        ratingScore * 0.6
                    ) +
                    (
                        popularityScore * 0.4
                    );


                candidates.push({

                    restaurant,

                    foods:
                        mealFoods,

                    averageMealPrice,

                    ratingScore,

                    reviewScore,

                    favouriteScore,

                    popularityScore,

                    recommendationScore,

                    favouriteCount

                });

            }


            // =========================================
            // NO CANDIDATE
            // =========================================

            if (
                candidates.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        `No suitable restaurant was found for ${mealType}. Please try another location or meal preference.`
                });
            }


            // =========================================
            // SORT BY SCORE
            // =========================================

            candidates.sort(
                (a, b) =>
                    b.recommendationScore -
                    a.recommendationScore
            );


            // Prefer a different restaurant for this specific meal
            const previousRestaurantId =
                String(previousRecommendationsByMeal[mealType] || "");

            let best = candidates.find(candidate => {
                const restaurantId = String(candidate.restaurant._id);

                return (
                    restaurantId !== previousRestaurantId &&
                    !usedRestaurantIds.has(restaurantId)
                );
            });

            // Fallback: use a restaurant not already assigned
            if (!best) {
                best = candidates.find(candidate =>
                    !usedRestaurantIds.has(
                        String(candidate.restaurant._id)
                    )
                );
            }

            // Final fallback
            if (!best) {
                best = candidates[0];
            }

            if (best) {
                usedRestaurantIds.add(
                    String(best.restaurant._id)
                );
            }


            // =========================================
            // ADD RECOMMENDATION
            // =========================================

            recommendations.push({

                mealType: mealType,

                restaurant: {

                    _id:
                        best.restaurant._id,

                    restaurantId:
                        best.restaurant.restaurantId,

                    restaurantName:
                        best.restaurant.restaurantName,

                    branch:
                        best.restaurant.branch,

                    location:
                        best.restaurant.location,

                    fullAddress:
                        best.restaurant.fullAddress,

                    image:
                        best.restaurant.image,

                    cuisine:
                        best.restaurant.cuisine,

                    halalStatus:
                        best.restaurant.halalStatus,

                    averageRating:
                        best.restaurant.averageRating,

                    totalRatings:
                        best.restaurant.totalRatings,

                    googleMapsLink:
                        best.restaurant.googleMapsLink

                },

                foods:
                    best.foods.map(
                        food => ({

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
                                food.description

                        })
                    ),

                averageMealPrice:
                    Number(
                        best.averageMealPrice
                            .toFixed(2)
                    ),

                recommendationScore:
                    Number(
                        best.recommendationScore
                            .toFixed(4)
                    )

            });

        }


        // =========================================
        // CALCULATE ESTIMATED TOTAL
        // =========================================

        const estimatedTotal =
            recommendations.reduce(
                (sum, recommendation) =>
                    sum +
                    recommendation.averageMealPrice,
                0
            );


        // =========================================
        // BUDGET CHECK
        // =========================================

        if (
            estimatedTotal >
            dailyBudget
        ) {
            return res.status(400).json({

                success: false,

                message:
                    `No suitable route was found within your RM${dailyBudget.toFixed(2)} daily budget. Please increase your budget or adjust your preferences.`

            });
        }


        // =========================================
        // SUCCESS
        // =========================================

        res.json({

            success: true,

            message:
                "Food route generated successfully.",

            route: {

                routeName:
                    routeName,

                date:
                    date,

                location:
                    location,

                budget:
                    dailyBudget,

                meals:
                    selectedMeals,

                routeType:
                    "generated",

                estimatedTotal:
                    Number(
                        estimatedTotal.toFixed(2)
                    ),

                recommendations:
                    recommendations

            }

        });

    }

    catch (err) {

        console.error(
            "Generate route error:",
            err
        );

        res.status(500).json({

            success: false,

            message:
                err.message

        });

    }
});


// =========================================
// GET USER'S SAVED ROUTES
// =========================================

router.get("/my-routes", async (req, res) => {
    try {

        // Check login
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login."
            });
        }

        const routes =
            await Route.find({
                userId:
                    req.session.user._id
            })
            .populate(
                "meals.restaurantId",
                "restaurantName branch location"
            )
            .populate(
                "meals.items.menuId",
                "name price image mealType"
            )
            .sort({
                createdAt: -1
            });

        res.json({
            success: true,
            routes
        });

    }

    catch (err) {

        console.error(
            "Get saved routes error:",
            err
        );

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
});


// =========================================
// GET ONE SAVED ROUTE
// =========================================

router.get("/:id", async (req, res) => {

    try {

        // =========================================
        // CHECK LOGIN
        // =========================================

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }


        // =========================================
        // GET SAVED ROUTE
        // =========================================

        const route =
            await Route.findOne({
                _id: req.params.id,
                userId: req.session.user._id
            })
            .populate(
                "meals.restaurantId",
                "restaurantName branch location fullAddress cuisine halalStatus averageRating totalRatings googleMapsLink owner"
            )
            .populate(
                "meals.items.menuId",
                "name price image category mealType description culturalInfo"
            );


        // =========================================
        // ROUTE NOT FOUND
        // =========================================

        if (!route) {

            return res.status(404).json({
                success: false,
                message: "Route not found."
            });

        }


        // =========================================
        // CONVERT MONGOOSE DOCUMENT
        // TO NORMAL JAVASCRIPT OBJECT
        // =========================================

        const routeData =
            route.toObject();


        // =========================================
        // GET ALL SUITABLE FOODS
        // FOR EACH RESTAURANT
        // =========================================

        for (const meal of routeData.meals) {

            const restaurant =
                meal.restaurantId;


            // -----------------------------------------
            // Make sure restaurant exists
            // -----------------------------------------

            if (!restaurant) {

                meal.allFoods = [];

                continue;
            }


            // -----------------------------------------
            // GET ALL FOODS FROM THIS RESTAURANT
            // -----------------------------------------

            const foods =
                await Menu.find({
                    restaurantId:
                        restaurant.owner
                })
                .select(
                    "name price image category mealType description culturalInfo"
                )
                .lean();


            // -----------------------------------------
            // FILTER BY MEAL TYPE
            // Same logic as /routes/generate
            // -----------------------------------------

            const selectedMealType =
                String(
                    meal.mealType
                )
                    .trim()
                    .toLowerCase();


            const suitableFoods =
                foods.filter(food => {

                    if (
                        !Array.isArray(
                            food.mealType
                        )
                    ) {
                        return false;
                    }


                    const foodMealTypes =
                        food.mealType.map(
                            type =>
                                String(type)
                                    .trim()
                                    .toLowerCase()
                        );


                    return (
                        foodMealTypes.includes(
                            selectedMealType
                        ) ||
                        foodMealTypes.includes(
                            "all day"
                        ) ||
                        foodMealTypes.includes(
                            "all-day"
                        )
                    );

                });


            // -----------------------------------------
            // ADD ALL FOODS TO MEAL
            // -----------------------------------------

            meal.allFoods =
                suitableFoods;

        }


        // =========================================
        // RETURN ROUTE
        // =========================================

        res.json({
            success: true,
            route: routeData
        });

    }

    catch (error) {

        console.error(
            "Get route error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load route."
        });

    }

});


// =========================================
// UPDATE SAVED ROUTE
// =========================================

router.put("/:id", async (req, res) => {
    try {

        // Check login
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login."
            });
        }

        const {
            routeName,
            date,
            location,
            budget,
            meals
        } = req.body;

        // =========================================
        // BASIC VALIDATION
        // =========================================

        if (
            !routeName ||
            !date ||
            !location ||
            budget === undefined ||
            !meals ||
            meals.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please complete all required fields."
            });
        }

        // =========================================
        // FIND EXISTING ROUTE
        // =========================================

        const route =
            await Route.findOne({
                _id:
                    req.params.id,
                userId:
                    req.session.user._id
            });

        if (!route) {
            return res.status(404).json({
                success: false,
                message:
                    "Route not found."
            });
        }

        // =========================================
        // VALIDATE EACH MEAL
        // =========================================

        let totalCost = 0;
        const validatedMeals = [];

        for (const meal of meals) {

            const {
                mealType,
                restaurantId,
                items
            } = meal;

            // Check meal information
            if (
                !mealType ||
                !restaurantId ||
                !Array.isArray(items) ||
                items.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Please complete your ${mealType || "meal"} selection.`
                });
            }

            // Check restaurant
            const restaurant =
                await Restaurant.findOne({
                    _id:
                        restaurantId,
                    profileCompleted:
                        true
                });

            if (!restaurant) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${mealType}: Restaurant not found.`
                });
            }

            // =========================================
            // VALIDATE EACH FOOD ITEM
            // =========================================

            const validatedItems = [];

            for (const item of items) {

                const {
                    menuId,
                    quantity
                } = item;

                // Validate quantity
                const itemQuantity =
                    Number(quantity);

                if (
                    !menuId ||
                    !Number.isInteger(itemQuantity) ||
                    itemQuantity < 1
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `${mealType}: Invalid food quantity.`
                    });
                }

                // Check menu belongs to selected restaurant
                const food =
                    await Menu.findOne({
                        _id:
                            menuId,
                        restaurantId:
                            restaurant.owner
                    });

                if (!food) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `${mealType}: Food not found for this restaurant.`
                    });
                }

                // =========================================
                // CHECK FOOD MEAL TYPE
                // =========================================

                const foodMealTypes =
                    Array.isArray(
                        food.mealType
                    )
                        ? food.mealType.map(
                            type =>
                                String(type)
                                    .trim()
                                    .toLowerCase()
                        )
                        : [];

                const selectedMealType =
                    String(mealType)
                        .trim()
                        .toLowerCase();

                if (
                    !foodMealTypes.includes(
                        selectedMealType
                    ) &&
                    !foodMealTypes.includes(
                        "all day"
                    ) &&
                    !foodMealTypes.includes(
                        "all-day"
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `${food.name} is not available for ${mealType}.`
                    });
                }

                // =========================================
                // CALCULATE PRICE
                // =========================================

                const foodPrice =
                    Number(
                        food.price
                    );

                const itemTotal =
                    foodPrice *
                    itemQuantity;

                totalCost +=
                    itemTotal;

                validatedItems.push({
                    menuId:
                        food._id,
                    price:
                        foodPrice,
                    quantity:
                        itemQuantity
                });
            }

            // =========================================
            // ADD VALIDATED MEAL
            // =========================================

            validatedMeals.push({
                mealType:
                    mealType,
                restaurantId:
                    restaurant._id,
                items:
                    validatedItems
            });
        }

        // =========================================
        // UPDATE ROUTE
        // =========================================

        route.routeName =
            routeName;

        route.date =
            date;

        route.location =
            location;

        route.budget =
            Number(budget);

        route.meals =
            validatedMeals;

        route.totalCost =
            totalCost;

        await route.save();

        // =========================================
        // SUCCESS
        // =========================================

        res.json({
            success: true,
            message:
                "Food route updated successfully.",
            route:
                route
        });

    }

    catch (err) {

        console.error(
            "Update route error:",
            err
        );

        res.status(500).json({
            success: false,
            message:
                err.message
        });

    }
});


// =========================================
// DELETE SAVED ROUTE
// =========================================

router.delete("/:id", async (req, res) => {
    try {

        // Check login
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login."
            });
        }

        const route =
            await Route.findOneAndDelete({
                _id:
                    req.params.id,
                userId:
                    req.session.user._id
            });

        if (!route) {
            return res.status(404).json({
                success: false,
                message:
                    "Route not found."
            });
        }

        res.json({
            success: true,
            message:
                "Route deleted successfully."
        });

    }

    catch (err) {

        console.error(
            "Delete route error:",
            err
        );

        res.status(500).json({
            success: false,
            message:
                err.message
        });

    }
});


module.exports = router;