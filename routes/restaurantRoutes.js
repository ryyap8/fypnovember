const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant");
const Menu = require("../models/menu");


// GET all restaurants from MongoDB
router.get("/restaurants", async (req, res) => {
    try {

        const restaurants = await Restaurant.find({
            profileCompleted: true
        });

        const restaurantsWithPrice = await Promise.all(

            restaurants.map(async (restaurant) => {

                // Get all menu items belonging to this restaurant
                const foods = await Menu.find({
                    restaurantId: restaurant.owner
                }).select("price");


                let priceRange = "";


                // Check if restaurant has menu items
                if (foods.length > 0) {

                    const prices = foods
                        .map(food => Number(food.price))
                        .filter(price => !isNaN(price));


                    if (prices.length > 0) {

                        // Sort prices from lowest to highest
                        prices.sort((a, b) => a - b);


                        // Find middle position
                        const middle =
                            Math.floor(prices.length / 2);


                        let medianPrice;


                        // Calculate median
                        if (prices.length % 2 === 0) {

                            medianPrice =
                                (prices[middle - 1] +
                                 prices[middle]) / 2;

                        } else {

                            medianPrice =
                                prices[middle];

                        }


                        // Determine price level
                        if (medianPrice <= 15) {

                            priceRange = "$";

                        }
                        else if (medianPrice <= 30) {

                            priceRange = "$$";

                        }
                        else if (medianPrice <= 50) {

                            priceRange = "$$$";

                        }
                        else {

                            priceRange = "$$$$";

                        }

                    }

                }


                return {

                    ...restaurant.toObject(),

                    priceRange

                };

            })

        );


        res.json(restaurantsWithPrice);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
});


// GET restaurant by ID
router.get("/restaurants/:id", async (req, res) => {
    try {

        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                error: "Restaurant not found"
            });
        }


        // Get all menu items for this restaurant
        const foods = await Menu.find({
            restaurantId: restaurant.owner
        }).select("price");


        let priceRange = "";


        // Calculate price range
        if (foods.length > 0) {

            const prices = foods
                .map(food => Number(food.price))
                .filter(price => !isNaN(price));


            if (prices.length > 0) {

                // Sort prices from lowest to highest
                prices.sort((a, b) => a - b);


                // Find middle position
                const middle = Math.floor(prices.length / 2);


                let medianPrice;


                // Calculate median
                if (prices.length % 2 === 0) {

                    medianPrice =
                        (prices[middle - 1] + prices[middle]) / 2;

                } else {

                    medianPrice = prices[middle];

                }


                // Determine price level
                if (medianPrice <= 15) {

                    priceRange = "$";

                }
                else if (medianPrice <= 30) {

                    priceRange = "$$";

                }
                else if (medianPrice <= 50) {

                    priceRange = "$$$";

                }
                else {

                    priceRange = "$$$$";

                }

            }

        }


        // Return restaurant + calculated price range
        res.json({
            ...restaurant.toObject(),
            priceRange
        });


    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
});


module.exports = router;
