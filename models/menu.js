const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({

    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    name: {
        type: String,
        required: true
    },

    image: {
        type: String,
        default: ""
    },

    price: {
        type: Number,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    mealType: {
        type: [String],
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    culturalInfo: {
        type: String,
        default: ""
    },

    isPopular: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model("Menu", menuSchema);