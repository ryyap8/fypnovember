const router = require("express").Router();
const Restaurant = require("../models/Restaurant");
const Notification = require("../models/notification");
const multer = require("multer");
const path = require("path");


// ==========================
// Multer Storage
// ==========================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads/restaurant/");

    },

    filename: (req, file, cb) => {

        cb(
            null,
            Date.now() + path.extname(file.originalname)
        );

    }

});

const upload = multer({ storage });


// ==========================
// GET Restaurant Profile
// ==========================

router.get("/profile", async (req, res) => {

    try {

        if (!req.session.user) {

            return res.json({
                success: false,
                message: "Not logged in"
            });

        }


        const restaurant = await Restaurant.findOne({

            owner: req.session.user._id

        });


        if (!restaurant) {

            return res.json({
                success: false,
                message: "Restaurant not found"
            });

        }


        // ==========================
        // Generate Google Maps Link
        // ==========================

        if (
            !restaurant.googleMapsLink &&
            restaurant.fullAddress
        ) {

            const query =
                `${restaurant.restaurantName}, ${restaurant.fullAddress}`;

            restaurant.googleMapsLink =
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

            await restaurant.save();

        }


        res.json({

            success: true,
            restaurant

        });


    }
    catch (err) {

        res.json({

            success: false,
            message: err.message

        });

    }

});


// ==========================
// UPDATE Restaurant Profile
// ==========================

router.put(
    "/profile",
    upload.single("image"),
    async (req, res) => {

        try {

            // ==========================
            // Check Login
            // ==========================

            if (!req.session.user) {

                return res.json({

                    success: false,
                    message: "Not logged in"

                });

            }


            // ==========================
            // Find Restaurant
            // ==========================

            const restaurant =
                await Restaurant.findOne({

                    owner: req.session.user._id

                });


            if (!restaurant) {

                return res.json({

                    success: false,
                    message: "Restaurant not found"

                });

            }


            // ==========================
            // Store OLD information
            // ==========================

            const oldProfile = {

                fullAddress:
                    restaurant.fullAddress || "",

                location:
                    restaurant.location || "",

                openingHours:
                    restaurant.openingHours
                        ? JSON.parse(JSON.stringify(restaurant.openingHours))
                        : null,
                
                cuisine:
                    restaurant.cuisine || "",

                halalStatus:
                    restaurant.halalStatus || "",

                restaurantDescription:
                    restaurant.restaurantDescription || "",

                restaurantHistory:
                    restaurant.restaurantHistory || "",

                contactNumber:
                    restaurant.contactNumber || "",

                socialMedia:
                    restaurant.socialMedia
                        ? JSON.parse(JSON.stringify(restaurant.socialMedia))
                        : {
                            facebook: "",
                            instagram: "",
                            tiktok: ""
                        },

                image:
                    restaurant.image || ""

            };


            // ==========================
            // Check FIRST profile completion
            // ==========================

            const isFirstProfileUpdate =
                !restaurant.profileCompleted;


            // ==========================
            // Update Profile Information
            // ==========================

            restaurant.fullAddress =
                req.body.fullAddress || "";

            restaurant.location =
                req.body.location || "";

            try {
                restaurant.openingHours =
                    JSON.parse(req.body.openingHours);
            }
            catch (err) {
                return res.json({
                    success: false,
                    message:
                        "Invalid opening hours format."
                });
            }

            restaurant.cuisine =
                req.body.cuisine || "";

            restaurant.halalStatus =
                req.body.halalStatus || "";

            restaurant.restaurantDescription =
                req.body.restaurantDescription || "";

            restaurant.restaurantHistory =
                req.body.restaurantHistory || "";

            restaurant.contactNumber =
                req.body.contactNumber || "";

            restaurant.socialMedia = {
                facebook:
                    req.body.facebookLink || "",

                instagram:
                    req.body.instagramLink || "",

                tiktok:
                    req.body.tiktokLink || ""
            };


            // ==========================
            // Update Google Maps Link
            // ==========================

            if (
                oldProfile.fullAddress !==
                restaurant.fullAddress
            ) {

                const query =
                    `${restaurant.restaurantName}, ${restaurant.fullAddress}`;

                restaurant.googleMapsLink =
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

            }


            // ==========================
            // Update Restaurant Image
            // ==========================

            if (req.file) {

                restaurant.image =
                    "/uploads/restaurant/" +
                    req.file.filename;

                restaurant.imageOriginalName =
                    req.file.originalname;

            }


            // ==========================
            // Mark Profile as Completed
            // ==========================

            if (isFirstProfileUpdate) {

                restaurant.profileCompleted = true;

            }


            // ==========================
            // Save Restaurant
            // ==========================

            await restaurant.save();


            // ==================================================
            // FIRST PROFILE COMPLETION
            // ==================================================

            if (isFirstProfileUpdate) {

                await Notification.create({

                    restaurantId:
                        req.session.user._id,

                    message:
                        `<strong>Welcome Restaurant ${restaurant.restaurantName}${restaurant.branch ? " " + restaurant.branch : ""}! 🎉</strong>\n\n` +

                        "You have successfully completed " +
                        "your restaurant profile.\n\n" +

                        "Your restaurant information is now " +
                        "ready to be displayed on the " +
                        "Malaysia Food Route Planner System. " +

                        "You can update your profile anytime " +
                        "if your restaurant information changes."

                });

            }


            // ==================================================
            // PROFILE UPDATE
            // ==================================================

            else {

                let changes = [];


                // ==========================
                // Compare Location
                // ==========================

                const oldLocation =
                    oldProfile.location
                        ? oldProfile.location.split(", ")
                        : ["", ""];


                const newLocation =
                    restaurant.location
                        ? restaurant.location.split(", ")
                        : ["", ""];


                const oldDistrict =
                    oldLocation[0] || "";

                const oldState =
                    oldLocation[1] || "";


                const newDistrict =
                    newLocation[0] || "";

                const newState =
                    newLocation[1] || "";


                // ==========================
                // State Changed
                // ==========================

                if (oldState !== newState) {

                    changes.push(

                        `State changed from "${oldState}" ` +
                        `to "${newState}".`

                    );

                }


                // ==========================
                // District Changed
                // ==========================

                if (oldDistrict !== newDistrict) {

                    changes.push(

                        `District changed from "${oldDistrict}" ` +
                        `to "${newDistrict}".`

                    );

                }


                // ==========================
                // Address Changed
                // ==========================

                if (
                    oldProfile.fullAddress !==
                    restaurant.fullAddress
                ) {

                    changes.push(
                        "Full Address was updated."

                    );

                }


                // ==========================
                // Opening Hours Changed
                // ==========================

                if (
                    JSON.stringify(oldProfile.openingHours) !==
                    JSON.stringify(restaurant.openingHours)
                ) {

                    changes.push(
                        "Opening hours were updated."
                    );

                }

                
                // ==========================
                // Cuisine Changed
                // ==========================

                if (
                    oldProfile.cuisine !==
                    restaurant.cuisine
                ) {

                    changes.push(

                        `Cuisine type changed from ` +
                        `"${oldProfile.cuisine}" ` +
                        `to "${restaurant.cuisine}".`

                    );

                }


                // ==========================
                // Halal Status Changed
                // ==========================

                if (
                    oldProfile.halalStatus !==
                    restaurant.halalStatus
                ) {

                    changes.push(

                        `Halal status changed from ` +
                        `"${oldProfile.halalStatus}" ` +
                        `to "${restaurant.halalStatus}".`

                    );

                }


                // ==========================
                // Restaurant Description Changed
                // ==========================

                if (
                    oldProfile.restaurantDescription !==
                    restaurant.restaurantDescription
                ) {

                    changes.push(
                        "Restaurant description was updated."
                    );

                }


                // ==========================
                // Restaurant History Changed
                // ==========================

                if (
                    oldProfile.restaurantHistory !==
                    restaurant.restaurantHistory
                ) {

                    changes.push(
                        "Restaurant history was updated."
                    );

                }


                // ==========================
                // Contact Number Changed
                // ==========================

                if (
                    oldProfile.contactNumber !==
                    restaurant.contactNumber
                ) {

                    changes.push(
                        "Contact number was updated."
                    );

                }


                // ==========================
                // Image Changed
                // ==========================

                if (req.file) {

                    changes.push(
                        "Restaurant image was updated."
                    );

                }


                // ==========================
                // Social Media Changed
                // ==========================

                if (
                    JSON.stringify(oldProfile.socialMedia) !==
                    JSON.stringify(restaurant.socialMedia)
                ) {

                    changes.push(
                        "Social media links were updated."
                    );

                }


                // ==========================
                // Create Notification
                // ==========================

                if (changes.length > 0) {

                    await Notification.create({

                        restaurantId:
                            req.session.user._id,

                        message:
                            "<strong>Restaurant profile has been updated.</strong>\n" +
                            changes.join("\n")

                    });

                }

            }


            // ==========================
            // Success Response
            // ==========================

            res.json({

                success: true,

                message:
                    isFirstProfileUpdate
                        ? "Profile completed successfully."
                        : "Profile updated successfully."

            });

        }
        catch (err) {

            console.error(
                "Restaurant profile update error:",
                err
            );


            res.json({

                success: false,

                message:
                    err.message

            });

        }

    }
);

// ==========================
// GET Announcements
// ==========================

router.get("/announcements", async (req, res) => {

    try {

        // ==========================
        // Check Login
        // ==========================

        if (!req.session.user) {

            return res.json({
                success: false,
                message: "Not logged in"
            });

        }


        // ==========================
        // Find Restaurant
        // ==========================

        const restaurant =
            await Restaurant.findOne({
                owner: req.session.user._id
            });


        if (!restaurant) {

            return res.json({
                success: false,
                message: "Restaurant not found"
            });

        }


        // ==========================
        // Return Announcements
        // ==========================

        res.json({

            success: true,

            announcements:
                restaurant.announcements || []

        });

    }
    catch (err) {

        console.error(
            "Get announcements error:",
            err
        );

        res.json({

            success: false,

            message: err.message

        });

    }

});


// ==========================
// ADD Announcement
// ==========================

router.post("/announcements", async (req, res) => {

    try {

        // ==========================
        // Check Login
        // ==========================

        if (!req.session.user) {

            return res.json({
                success: false,
                message: "Not logged in"
            });
        }


        // ==========================
        // Find Restaurant
        // ==========================

        const restaurant =
            await Restaurant.findOne({
                owner: req.session.user._id
            });


        if (!restaurant) {

            return res.json({
                success: false,
                message: "Restaurant not found"
            });

        }


        // ==========================
        // Get Data
        // ==========================

        const {
            title,
            description,
            startDate,
            endDate
        } = req.body;


        // ==========================
        // Validation
        // ==========================

        if (
            !title ||
            !description ||
            !startDate ||
            !endDate
        ) {

            return res.json({

                success: false,

                message:
                    "Please fill in all announcement fields."

            });

        }


        // ==========================
        // Date Validation
        // ==========================

        if (
            new Date(endDate) <
            new Date(startDate)
        ) {

            return res.json({

                success: false,

                message:
                    "End date cannot be earlier than start date."

            });

        }


        // ==========================
        // Add Announcement
        // ==========================

        restaurant.announcements.push({

            title: title.trim(),

            description:
                description.trim(),

            startDate:
                new Date(startDate),

            endDate:
                new Date(endDate)

        });


        // ==========================
        // Save
        // ==========================

        await restaurant.save();


        // ==========================
        // Create Notification
        // ==========================

        await Notification.create({

            restaurantId:
                req.session.user._id,

            message:
                `<strong>Announcement created.</strong>\n` +
                `The announcement "${title.trim()}" ` +
                `has been created successfully.`

        });


        res.json({

            success: true,

            message:
                "Announcement added successfully."

        });

    }
    catch (err) {

        console.error(
            "Add announcement error:",
            err
        );

        res.json({

            success: false,

            message: err.message

        });

    }

});


// ==========================
// UPDATE Announcement
// ==========================

router.put(
    "/announcements/:announcementId",
    async (req, res) => {

        try {

            // ==========================
            // Check Login
            // ==========================

            if (!req.session.user) {

                return res.json({

                    success: false,

                    message:
                        "Not logged in"

                });

            }


            // ==========================
            // Find Restaurant
            // ==========================

            const restaurant =
                await Restaurant.findOne({

                    owner:
                        req.session.user._id

                });


            if (!restaurant) {

                return res.json({

                    success: false,

                    message:
                        "Restaurant not found"

                });

            }


            // ==========================
            // Find Announcement
            // ==========================

            const announcement =
                restaurant.announcements.id(
                    req.params.announcementId
                );


            if (!announcement) {

                return res.json({

                    success: false,

                    message:
                        "Announcement not found."

                });

            }


            const oldAnnouncementTitle =
                announcement.title;


            // ==========================
            // Get Data
            // ==========================

            const {
                title,
                description,
                startDate,
                endDate
            } = req.body;


            // ==========================
            // Validation
            // ==========================

            if (
                !title ||
                !description ||
                !startDate ||
                !endDate
            ) {

                return res.json({

                    success: false,

                    message:
                        "Please fill in all announcement fields."

                });

            }


            // ==========================
            // Date Validation
            // ==========================

            if (
                new Date(endDate) <
                new Date(startDate)
            ) {

                return res.json({

                    success: false,

                    message:
                        "End date cannot be earlier than start date."

                });

            }


            // ==========================
            // Update
            // ==========================

            announcement.title =
                title.trim();

            announcement.description =
                description.trim();

            announcement.startDate =
                new Date(startDate);

            announcement.endDate =
                new Date(endDate);


            // ==========================
            // Save
            // ==========================

            await restaurant.save();

            // ==========================
            // Create Notification
            // ==========================

            await Notification.create({

                restaurantId:
                    req.session.user._id,

                message:
                    `<strong>Announcement updated.</strong>\n` +
                    `The announcement "${oldAnnouncementTitle}" ` +
                    `has been updated.`

            });


            res.json({

                success: true,

                message:
                    "Announcement updated successfully."

            });

        }
        catch (err) {

            console.error(
                "Update announcement error:",
                err
            );

            res.json({

                success: false,

                message:
                    err.message

            });

        }

    }
);


// ==========================
// DELETE Announcement
// ==========================

router.delete(
    "/announcements/:announcementId",
    async (req, res) => {

        try {

            // ==========================
            // Check Login
            // ==========================

            if (!req.session.user) {

                return res.json({

                    success: false,

                    message:
                        "Not logged in"

                });

            }


            // ==========================
            // Find Restaurant
            // ==========================

            const restaurant =
                await Restaurant.findOne({

                    owner:
                        req.session.user._id

                });


            if (!restaurant) {

                return res.json({

                    success: false,

                    message:
                        "Restaurant not found"

                });

            }


            // ==========================
            // Find Announcement
            // ==========================

            const announcement =
                restaurant.announcements.id(
                    req.params.announcementId
                );


            if (!announcement) {

                return res.json({

                    success: false,

                    message:
                        "Announcement not found."

                });

            }

            const deletedAnnouncementTitle =
                announcement.title;


            // ==========================
            // Delete
            // ==========================

            announcement.deleteOne();


            // ==========================
            // Save
            // ==========================

            await restaurant.save();

            // ==========================
            // Create Notification
            // ==========================

            await Notification.create({

                restaurantId:
                    req.session.user._id,

                message:
                    `<strong>Announcement deleted.</strong>\n` +
                    `The announcement "${deletedAnnouncementTitle}" ` +
                    `has been deleted.`

            });


            res.json({

                success: true,

                message:
                    "Announcement deleted successfully."

            });

        }
        catch (err) {

            console.error(
                "Delete announcement error:",
                err
            );

            res.json({

                success: false,

                message:
                    err.message

            });

        }

    }
);


module.exports = router;