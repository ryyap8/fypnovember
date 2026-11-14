const express = require("express");
const router = express.Router();

const Review = require("../models/Review");
const Restaurant = require("../models/Restaurant");
const Notification = require("../models/notification");


// ==========================
// Post Review
// ==========================
router.post("/", async (req, res) => {

    try {

        // Check login
        if (
            !req.session.user ||
            req.session.user.role !== "user"
        ) {

            return res.status(401).json({
                success: false,
                message: "Only logged-in users can write reviews."
            });

        }


        const {
            restaurantId,
            rating,
            comment
        } = req.body;


        // ==========================
        // Find Restaurant
        // ==========================

        const restaurant =
            await Restaurant.findById(restaurantId);

        if (!restaurant) {

            return res.status(404).json({
                success: false,
                message: "Restaurant not found."
            });

        }


        // ==========================
        // Check Existing Review
        // ==========================

        const existingReview =
            await Review.findOne({
                restaurantId,
                userId: req.session.user._id
            });

        if (existingReview) {

            return res.status(400).json({
                success: false,
                message: "You have already reviewed this restaurant."
            });

        }


        // Create review
        const review = new Review({
            restaurantId,
            userId: req.session.user._id,
            rating,
            comment
        });


        await review.save();


        // ==========================
        // Create Notification
        // ==========================

        await Notification.create({

            restaurantId: restaurant.owner,

            message:
                `<strong><em>${req.session.user.username}</em> added a review for your restaurant!</strong>`
        });


        // Update restaurant rating
        await updateRestaurantRating(restaurantId);


        res.json({

            success: true,

            message: "Review added successfully"

        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

});


// ==========================
// Edit Review
// ==========================
router.put("/:reviewId", async (req, res) => {

    try {

        // Check login
        if (
            !req.session.user ||
            req.session.user.role !== "user"
        ) {

            return res.status(401).json({
                success: false,
                message: "Only logged-in users can edit reviews."
            });

        }


        const {
            rating,
            comment
        } = req.body;


        // ==========================
        // Find Review
        // ==========================

        const review =
            await Review.findById(req.params.reviewId);

        if (!review) {

            return res.status(404).json({
                success: false,
                message: "Review not found."
            });

        }


        // ==========================
        // Check Review Owner
        // ==========================

        if (
            String(review.userId) !==
            String(req.session.user._id)
        ) {

            return res.status(403).json({
                success: false,
                message: "You can only edit your own review."
            });

        }


        // ==========================
        // Update Review
        // ==========================

        review.rating = rating;
        review.comment = comment;
        review.updatedAt = new Date();

        await review.save();


        // ==========================
        // Create Notification
        // ==========================

        const restaurant =
            await Restaurant.findById(review.restaurantId);

        await Notification.create({

            restaurantId: restaurant.owner,

            message:
                `<strong><em>${req.session.user.username}</em> edited their review for your restaurant!</strong>`
        });


        // ==========================
        // Update Restaurant Rating
        // ==========================

        await updateRestaurantRating(
            review.restaurantId
        );


        res.json({

            success: true,

            message: "Review updated successfully"

        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

});


// ==========================
// Delete Review
// ==========================
router.delete("/:reviewId", async (req, res) => {

    try {

        // Check login
        if (
            !req.session.user ||
            req.session.user.role !== "user"
        ) {

            return res.status(401).json({
                success: false,
                message: "Only logged-in users can delete reviews."
            });

        }


        // ==========================
        // Find Review
        // ==========================

        const review =
            await Review.findById(req.params.reviewId);

        if (!review) {

            return res.status(404).json({
                success: false,
                message: "Review not found."
            });

        }


        // ==========================
        // Check Review Owner
        // ==========================

        if (
            String(review.userId) !==
            String(req.session.user._id)
        ) {

            return res.status(403).json({
                success: false,
                message: "You can only delete your own review."
            });

        }


        const restaurantId =
            review.restaurantId;


        // ==========================
        // Delete Review
        // ==========================

        await Review.findByIdAndDelete(
            req.params.reviewId
        );


        // ==========================
        // Create Notification
        // ==========================

        const restaurant =
            await Restaurant.findById(restaurantId);

        await Notification.create({

            restaurantId: restaurant.owner,

            message:
                `<strong><em>${req.session.user.username}</em> deleted their review for your restaurant!</strong>`
        });


        // ==========================
        // Update Restaurant Rating
        // ==========================

        await updateRestaurantRating(
            restaurantId
        );


        res.json({

            success: true,

            message: "Review deleted successfully"

        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

});


// ==========================
// Update Restaurant Rating
// ==========================
async function updateRestaurantRating(restaurantId) {

    const reviews =
        await Review.find({
            restaurantId
        });


    let sum = 0;


    reviews.forEach(review => {

        sum += Number(review.rating);

    });


    const averageRating =
        reviews.length
            ? sum / reviews.length
            : 0;


    await Restaurant.findByIdAndUpdate(
        restaurantId,
        {
            averageRating,
            totalRatings: reviews.length
        }
    );

}


// ==========================
// Get All Reviews
// ==========================
router.get("/", async (req, res) => {

    try {

        const reviews = await Review.find({})
            .populate(
                "restaurantId",
                "restaurantName branch image cuisine category"
            )
            .populate(
                "userId",
                "username profileImage"
            )
            .sort({
                createdAt: -1
            });


        res.json(reviews);

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

});


// ==========================
// Get Reviews
// ==========================
router.get("/:restaurantId", async (req, res) => {

    try {

        const reviews =
            await Review.find({
                restaurantId: req.params.restaurantId
            })
            .populate(
                "userId",
                "username profileImage"
            )
            .sort({
                createdAt: -1
            });


        res.json(reviews);

    }
    catch (err) {

        console.error(err);

        res.status(500).json({

            error: err.message

        });

    }

});


module.exports = router;