const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("multer");
const path = require("path");


// =========================
// MULTER STORAGE
// =========================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "uploads/profiles");
    },

    filename: function (req, file, cb) {

        const extension = path.extname(file.originalname);

        cb(
            null,
            "profile-" +
            req.session.user._id +
            "-" +
            Date.now() +
            extension
        );
    }

});


const upload = multer({

    storage: storage,

    fileFilter: function (req, file, cb) {

        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }

    },

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});


// =========================
// UPDATE PROFILE
// =========================

router.put(
    "/updateProfile",
    upload.single("profileImage"),
    async (req, res) => {

        try {

            // Check login
            if (!req.session.user || !req.session.user._id) {
                return res.json({
                    success: false,
                    message: "Please login first"
                });
            }


            const { username } = req.body;


            // Username validation
            if (!username || username.trim() === "") {
                return res.json({
                    success: false,
                    message: "Username cannot be empty"
                });
            }


            // Data to update
            const updateData = {
                username: username.trim(),
            };


            // If user uploaded a new profile picture
            if (req.file) {

                updateData.profileImage =
                    "/uploads/profiles/" + req.file.filename;

            }


            const updatedUser = await User.findByIdAndUpdate(
                req.session.user._id,
                updateData,
                {
                    returnDocument: "after"
                }
            );


            if (!updatedUser) {
                return res.json({
                    success: false,
                    message: "User not found"
                });
            }


            // =========================
            // UPDATE SESSION
            // =========================

            req.session.user.username =
                updatedUser.username;

            req.session.user.profileImage =
                updatedUser.profileImage;


            res.json({
                success: true,
                user: updatedUser
            });


        } catch (error) {

            console.log(error);

            res.json({
                success: false,
                message: "Update failed"
            });

        }

    }
);


module.exports = router;