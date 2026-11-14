const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Menu = require("../models/menu");
const Notification = require("../models/notification");
const Restaurant = require("../models/Restaurant");

// ==========================
// Multer Storage
// ==========================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads/menu/");

    },

    filename: (req, file, cb) => {

        cb(null, file.originalname);

    }

});

const upload = multer({ storage });

// ==========================
// Get All Menu
// ==========================

router.get("/", async (req, res) => {

    try {

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login."
            });
        }

        const foods = await Menu.find({
            restaurantId: req.session.user._id
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            foods
        });

    }

    catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// ==========================
// Get Menu By Restaurant ID
// ==========================

router.get("/restaurant/:restaurantId", async (req, res) => {

    try {

        // Find the restaurant first
        const restaurant = await Restaurant.findById(
            req.params.restaurantId
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found."
            });
        }

        // Restaurant.owner = User._id
        const foods = await Menu.find({
            restaurantId: restaurant.owner
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            foods
        });

    }
    catch (err) {

        console.error("Get restaurant menu error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// ==========================
// Add Food
// ==========================

router.post("/add", upload.single("image"), async (req, res) => {

    try {

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login."
            });
        }

        const mealType = JSON.parse(req.body.mealType || "[]");

            const menu = new Menu({

                restaurantId: req.session.user._id,

                name: req.body.name,

                image: req.file
                    ? "/uploads/menu/" + req.file.filename
                    : "",

                price: req.body.price,

                category: req.body.category,

                mealType: mealType,

                description: req.body.description,

                culturalInfo: req.body.culturalInfo,

                isPopular: req.body.isPopular === "true"

            });

        await menu.save();

        await Notification.create({

            restaurantId: req.session.user._id,
            message: `<strong>Menu item "${menu.name}" has been added.</strong>`

        });

        res.json({
            success: true,
            menu
        });

    }

    catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ==========================
// Edit Food
// ==========================

router.put("/edit/:id", upload.single("image"), async (req, res) => {

    try {

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login."
            });
        }

        const food = await Menu.findOne({

            _id:req.params.id,

            restaurantId:req.session.user._id

        });

        if (!food) {

            return res.json({
                success: false,
                message: "Food not found."
            });

        }

        const oldFood = {

            name: food.name,
            price: food.price,
            category: food.category,
            mealType: food.mealType || [],
            description: food.description,
            culturalInfo: food.culturalInfo,
            isPopular: food.isPopular

        };

        food.name = req.body.name;
        food.price = req.body.price;
        food.category = req.body.category;
        food.mealType = JSON.parse(req.body.mealType || "[]");
        food.description = req.body.description;
        food.culturalInfo = req.body.culturalInfo;
        food.isPopular = req.body.isPopular === "true";

        if (req.file) {

            food.image = "/uploads/menu/" + req.file.filename;

        }

        await food.save();

        let changes = [];

        if (oldFood.name !== food.name) {
            changes.push(`Food Name changed from "${oldFood.name}" to "${food.name}"`);
        }

        if (oldFood.price != food.price) {
            changes.push(`Price changed from "RM${oldFood.price}" to "RM${food.price}"`);
        }

        if (oldFood.category !== food.category) {
            changes.push(`Category changed from "${oldFood.category}" to "${food.category}"`);
        }

        if (
            JSON.stringify(oldFood.mealType) !==
            JSON.stringify(food.mealType)
        ) {
            changes.push(
                `Meal Type changed from "${oldFood.mealType.join(", ")}" ` +
                `to "${food.mealType.join(", ")}"`
            );
        }

        if (oldFood.description !== food.description) {
            changes.push(`Description was updated`);
        }

        if (oldFood.culturalInfo !== food.culturalInfo) {
            changes.push(`Cultural Info was updated`);
        }

        if (oldFood.isPopular !== food.isPopular) {

            changes.push(
                food.isPopular
                    ? "Popular Food status changed to Popular"
                    : "Popular Food status changed to Not Popular"
            );

        }

        if (req.file) {
            changes.push("Image updated");
        }

        await Notification.create({

            restaurantId: req.session.user._id,

            message:
                `<strong>Menu item "${food.name}" has been updated.</strong>\n` +
                changes.join("\n")

        });

        res.json({
            success: true,
            food
        });

    }

    catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ==========================
// Delete Food
// ==========================
router.delete("/delete/:id", async (req, res) => {

    try {

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please login."
            });
        }

        const food = await Menu.findOne({
            _id: req.params.id,
            restaurantId: req.session.user._id
        });

        if (!food) {
            return res.json({
                success: false,
                message: "Food not found."
            });
        }

        await Notification.create({
            restaurantId: req.session.user._id,
            message: `<strong>Menu item "${food.name}" has been deleted.</strong>`
        });

        await food.deleteOne();

        res.json({
            success: true
        });

    }
    catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

router.get("/notifications", async (req,res)=>{

    if(!req.session.user){

        return res.status(401).json({
            success:false
        });

    }

    const notifications = await Notification.find({

        restaurantId:req.session.user._id

    }).sort({createdAt:-1});

    res.json({

        success:true,
        notifications

    });

});

router.put("/notifications/read", async(req,res)=>{

    try{

        await Notification.updateMany(

            {
                restaurantId:req.session.user._id,
                isRead:false
            },

            {
                isRead:true
            }

        );


        res.json({
            success:true
        });


    }
    catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

});

module.exports = router;