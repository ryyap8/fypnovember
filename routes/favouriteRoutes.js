const express = require("express");
const router = express.Router();
const Favourite = require("../models/Favourite");


// ==========================
// Add Favourite
// ==========================
router.post("/:restaurantId", async (req, res) => {

    try {

        if (
            !req.session.user ||
            req.session.user.role !== "user"
        ) {

            return res.status(401).json({
                success: false,
                message: "Only logged-in users can favourite restaurants."
            });

        }


        const userId = req.session.user._id;
        const restaurantId = req.params.restaurantId;


        // Check whether already favourited
        const exists = await Favourite.findOne({
            userId,
            restaurantId
        });


        if (exists) {

            return res.json({
                success: false,
                message: "Already favourited"
            });

        }


        await Favourite.create({
            userId,
            restaurantId
        });


        res.json({
            success: true,
            message: "Added to favourites"
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ==========================
// Remove Favourite
// ==========================
router.delete("/:restaurantId", async (req, res) => {

    try {

        if (
            !req.session.user ||
            req.session.user.role !== "user"
        ) {

            return res.status(401).json({
                success: false,
                message: "Only logged-in users can manage favourites."
            });

        }


        const userId = req.session.user._id;
        const restaurantId = req.params.restaurantId;


        await Favourite.deleteOne({
            userId,
            restaurantId
        });


        res.json({
            success: true,
            message: "Removed from favourites"
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});


// ==========================
// Check Favourite Status
// ==========================
router.get("/check/:restaurantId", async (req, res) => {

    try {

        if (
            !req.session.user ||
            req.session.user.role !== "user"
        ) {

            return res.json({
                isFavourite: false
            });

        }


        const userId = req.session.user._id;
        const restaurantId = req.params.restaurantId;


        const fav = await Favourite.findOne({
            userId,
            restaurantId
        });


        res.json({
            isFavourite: !!fav
        });

    }
    catch (err) {

        console.error(err);

        res.json({
            isFavourite: false
        });

    }

});


// ==========================
// Get Favourite Count
// FOR Restaurant Dashboard
// ==========================
router.get("/count/:restaurantId", async (req, res) => {

    try {

        const restaurantId = req.params.restaurantId;

        const totalFavourites = await Favourite.countDocuments({
            restaurantId
        });

        res.json({
            success: true,
            totalFavourites
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            totalFavourites: 0
        });

    }

});


// ==========================
// Get All Favourites
// FOR favourite.html
// ==========================
router.get("/", async (req, res) => {

    try {

        if (
            !req.session.user ||
            req.session.user.role !== "user"
        ) {

            return res.json([]);

        }


        const userId = req.session.user._id;


        const favourites =
            await Favourite.find({ userId })
                .populate("restaurantId");


        res.json(favourites);

    }
    catch (err) {

        console.error(err);

        res.status(500).json([]);

    }

});


module.exports = router;