const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    rating: {
        type: Number,
        required: true
    },

    comment: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model("Review", reviewSchema);