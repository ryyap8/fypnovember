const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({

    restaurantId: {
        type: String,
        unique: true
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    restaurantName: {
        type: String,
        required: true
    },

    branch: {
        type: String,
        default: ""
    },

    image: {
        type: String,
        default: ""
    },

    imageOriginalName: {
        type: String,
        default: ""
    },

    fullAddress: {
        type: String,
        default: ""
    },

    location: {
        type: String,
        default: ""
    },

    openingHours: {
        monday: {
            isOpen: { type: Boolean, default: true },

            open1: { type: String, default: "" },
            close1: { type: String, default: "" },

            open2: { type: String, default: "" },
            close2: { type: String, default: "" }
        },

        tuesday: {
            isOpen: { type: Boolean, default: true },

            open1: { type: String, default: "" },
            close1: { type: String, default: "" },

            open2: { type: String, default: "" },
            close2: { type: String, default: "" }
        },

        wednesday: {
            isOpen: { type: Boolean, default: true },

            open1: { type: String, default: "" },
            close1: { type: String, default: "" },

            open2: { type: String, default: "" },
            close2: { type: String, default: "" }
        },

        thursday: {
            isOpen: { type: Boolean, default: true },

            open1: { type: String, default: "" },
            close1: { type: String, default: "" },

            open2: { type: String, default: "" },
            close2: { type: String, default: "" }
        },

        friday: {
            isOpen: { type: Boolean, default: true },

            open1: { type: String, default: "" },
            close1: { type: String, default: "" },

            open2: { type: String, default: "" },
            close2: { type: String, default: "" }
        },

        saturday: {
            isOpen: { type: Boolean, default: true },

            open1: { type: String, default: "" },
            close1: { type: String, default: "" },

            open2: { type: String, default: "" },
            close2: { type: String, default: "" }
        },

        sunday: {
            isOpen: { type: Boolean, default: true },

            open1: { type: String, default: "" },
            close1: { type: String, default: "" },

            open2: { type: String, default: "" },
            close2: { type: String, default: "" }
        }
    },

    cuisine: {
        type: String,
        default: ""
    },

    halalStatus: {
        type: String,
        enum: ["Halal", "Non-Halal"],
        default: undefined
    },

    restaurantDescription: {
        type: String,
        default: ""
    },

     restaurantHistory: {
        type: String,
        default: ""
    },

    contactNumber: {
        type: String,
        default: ""
    },

    profileCompleted: {
        type: Boolean,
        default: false
    },

    googleMapsLink: {
        type: String,
        default: ""
    },

    socialMedia: {
        facebook: {
            type: String,
            default: ""
        },

        instagram: {
            type: String,
            default: ""
        },

        tiktok: {
            type: String,
            default: ""
        }
    },

    announcements: [
        {
            title: {
                type: String,
                required: true,
                trim: true
            },

            description: {
                type: String,
                required: true,
                trim: true
            },

            startDate: {
                type: Date,
                required: true
            },

            endDate: {
                type: Date,
                required: true
            }
        }
    ],

    averageRating: {
        type: Number,
        default: 0
    },

    totalRatings: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Restaurant", restaurantSchema);