const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        default: ""
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    profileImage: {
        type: String,
        default: ""
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    verificationToken: {
        type: String
    },

    role: {
        type: String,
        enum: ["user", "restaurant", "admin"],
        default: "user"
    },

    restaurantStatus: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none"
    },

    rejectReason: {
        type: String,
        default: ""
    },

    restaurantName: {
        type: String,
        default: ""
    },

    branch: {
        type: String,
        default: ""
    },

    address: {
        type: String,
        default: ""
    },

    ssmNumber: {
        type: String,
        default: ""
    },

    ssmDocument: {
        type: String, // file path or URL
        default: ""
    }

}, {
    timestamps: true
});

module.exports=mongoose.model("User",userSchema);