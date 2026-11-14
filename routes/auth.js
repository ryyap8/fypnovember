const router = require("express").Router();
const User = require("../models/User");
const Favourite = require("../models/Favourite");
const Route = require("../models/Route");
const Review = require("../models/Review");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// =======================
// MULTER SETUP
// =======================
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/ssm/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });


// =======================
// REGISTER
// =======================
router.post("/register", upload.single("ssmFile"), async (req, res) => {

    try {

        const {
            username,
            email,
            password,
            role,
            restaurantName,
            branch,
            address,
            ssmNumber
        } = req.body;

        // file path
        const ssmDocument = req.file
            ? "/uploads/ssm/" + req.file.filename
            : "";

        // ensure username is always valid
        const finalUsername =
            role === "restaurant"
                ? ""
                : username;

        // extra safety check
        if (role === "restaurant" && !restaurantName) {
            return res.json({
                success: false,
                message: "Restaurant name is required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.json({
                success: false,
                message: "Email already exists"
            });
        }

        const passwordRegex =
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.json({
                success: false,
                message: "Password must be at least 8 characters long and include letter, number, special character."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const token = crypto.randomBytes(32).toString("hex");

        const newUser = new User({
            username: finalUsername,   
            email,
            password: hashedPassword,
            verificationToken: token,
            isVerified: false,

            role: role || "user",

            restaurantStatus:
                role === "restaurant" ? "pending" : "none",

            restaurantName:
                role === "restaurant" ? restaurantName : "",
            
            branch: 
                role === "restaurant" ? branch : "",

            address: 
                role === "restaurant" ? address : "",

            ssmNumber: 
                role === "restaurant" ? ssmNumber : "",

            ssmDocument: 
                role === "restaurant" ? ssmDocument : ""
        });

        await newUser.save();

        // =======================
        // EMAIL VERIFICATION
        // =======================
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const verifyLink =
            `http://localhost:3000/auth/verify-email/${token}`;

        await transporter.sendMail({
            from: "foodrouteplanner@gmail.com",
            to: email,
            subject: "Verify your email",
            html: `
                <h2>Email Verification</h2>
                <p>Click below to verify your account:</p>
                <a href="${verifyLink}">Verify Email</a>
            `
        });

        res.json({
            success: true,
            message: "Registered successfully. Please verify your email."
        });

    } catch (err) {

        res.json({
            success: false,
            message: err.message
        });

    }
});


// =======================
// LOGIN
// =======================
router.post("/login", async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.json({
            success: false,
            message: "User not found"
        });
    }

    if (!user.isVerified) {
        return res.json({
            success: false,
            message: "Please verify your email before login"
        });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
        return res.json({
            success: false,
            message: "Wrong password"
        });
    }

    req.session.user = {
        _id: user._id,
        username: user.username,
        restaurantName: user.restaurantName,
        email: user.email,
        role: user.role
    };

    res.json({
        success: true,
        message: "Login successful",

        role: user.role,
        restaurantStatus: user.restaurantStatus,
        username: user.username,
        email: user.email
    });

});


// =======================
// VERIFY EMAIL
// =======================
router.get("/verify-email/:token", async (req, res) => {

    try {

        const user = await User.findOne({
            verificationToken: req.params.token
        });

        if (!user) {
            return res.redirect("/email-verification-error.html");
        }

        user.isVerified = true;
        user.verificationToken = undefined;

        await user.save();

        return res.redirect("/email-verified.html");

    } catch (err) {

        return res.redirect("/email-verification-error.html");

    }

});


// =======================
// CURRENT USER
// =======================
router.get("/currentUser", async (req, res) => {

    if (!req.session.user) {
        return res.json({
            loggedIn: false
        });
    }

    try {

        const user = await User.findById(req.session.user._id);

        if (!user) {
            return res.json({
                loggedIn: false
            });
        }

        // =========================
        // PROFILE STATISTICS
        // =========================

        const favouriteCount = await Favourite.countDocuments({
            userId: user._id
        });

        const routeCount = await Route.countDocuments({
            userId: user._id
        });

        const reviewCount = await Review.countDocuments({
            userId: user._id
        });


        res.json({
            loggedIn: true,
            userId: user._id,
            username: user.username,
            restaurantName: user.restaurantName,
            email: user.email,
            profileImage: user.profileImage,
            role: user.role,
            restaurantStatus: user.restaurantStatus,

            // Profile statistics
            favouriteCount: favouriteCount,
            routeCount: routeCount,
            reviewCount: reviewCount
        });

    } catch (err) {

        console.log(err);

        res.json({
            loggedIn: false
        });

    }

});


// =======================
// LOGOUT
// =======================
router.get("/logout", (req, res) => {

    req.session.destroy();

    res.json({
        success: true,
        message: "Logout successful"
    });

});


module.exports = router;