const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    routeName: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    budget: {
        type: Number,
        required: true
    },

    routeType: {
        type: String,
        enum: ["planned", "generated"],
        default: "planned"
    },

    meals: [
        {
            mealType: {
                type: String,
                enum: ["Breakfast", "Lunch", "Dinner"],
                required: true
            },

            restaurantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Restaurant",
                required: true
            },

            items: [
                {
                    menuId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Menu",
                        required: true
                    },

                    price: {
                        type: Number,
                        required: true
                    },

                    quantity: {
                        type: Number,
                        required: true,
                        min: 1,
                        default: 1
                    }
                }
            ]
        }
    ],

    totalCost: {
        type: Number,
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Route", routeSchema);