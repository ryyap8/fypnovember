const router = require("express").Router();
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const SupportRequest = require("../models/SupportRequest");
const nodemailer = require("nodemailer");

// Admin authentication
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
}

router.use(requireAdmin);


// =======================
// GENERATE RESTAURANT ID
// =======================
async function generateRestaurantId() {

    const lastRestaurant = await Restaurant
        .findOne()
        .sort({ createdAt: -1 });

    if (!lastRestaurant) {
        return "R0001";
    }

    const number = parseInt(
        lastRestaurant.restaurantId.replace("R", "")
    );

    return "R" + String(number + 1).padStart(4, "0");
}

// =======================
// EMAIL TRANSPORTER
// =======================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "foodrouteplanner@gmail.com",
        pass: "kewi wftl qfyy iazj"
    }
});


// =======================
// GET ALL RESTAURANT APPLICATIONS
// =======================
router.get("/restaurants", async (req, res) => {

    try {

        const users = await User.find({
            role: "restaurant",
            isVerified: true
        }).lean();

        const restaurants = await Promise.all(

            users.map(async (user) => {

                const restaurant = await Restaurant.findOne({
                    owner: user._id
                }).lean();

                return {
                    ...user,

                    restaurantId: restaurant
                        ? restaurant.restaurantId
                        : null
                };

            })

        );

        res.json({
            success: true,
            restaurants
        });

    } catch (err) {

        console.error("GET RESTAURANTS ERROR:", err);

        res.json({
            success: false,
            message: err.message
        });

    }

});


router.get("/stats", async (req, res) => {

    try {

        const totalUsers = await User.countDocuments({
            role: "user",
            isVerified: true
        });

        const totalApplications = await User.countDocuments({
            role: "restaurant",
            isVerified: true
        });

        const pending = await User.countDocuments({
            role: "restaurant",
            isVerified: true,
            restaurantStatus: "pending"
        });

        const approved = await User.countDocuments({
            role: "restaurant",
            isVerified: true,
            restaurantStatus: "approved"
        });

        const rejected = await User.countDocuments({
            role: "restaurant",
            isVerified: true,
            restaurantStatus: "rejected"
        });

        res.json({
            success: true,
            totalUsers,
            totalApplications,
            pending,
            approved,
            rejected
        });

    } catch (err) {

        res.json({
            success: false,
            message: err.message
        });

    }
});


// =======================
// APPROVE RESTAURANT
// =======================
router.post("/approve/:id", async (req, res) => {

    try {

        const restaurant = await User.findById(req.params.id);

        if (!restaurant) {
            return res.json({
                success: false,
                message: "Restaurant not found"
            });
        }

        // Update user status
        restaurant.restaurantStatus = "approved";
        await restaurant.save();

        // Check if Restaurant record already exists
        const existingRestaurant = await Restaurant.findOne({
            owner: restaurant._id
        });

        if (!existingRestaurant) {

            const restaurantId = await generateRestaurantId();

            await Restaurant.create({

                restaurantId,

                owner: restaurant._id,

                restaurantName: restaurant.restaurantName,

                branch: restaurant.branch,

                image: "",

                location: "",

                openingHours: "",

                fullAddress: restaurant.address,

                googleMapsLink: "",

                averageRating: 0,

                totalRatings: 0

            });

        }

        // Send approval email
        await transporter.sendMail({
            from: "foodrouteplanner@gmail.com",
            to: restaurant.email,
            subject: "Restaurant Application Approved",
            html: `
                <h2>Congratulations!</h2>
                <p>Your restaurant <b>${restaurant.restaurantName}</b> has been approved.</p>
                <p>You can now login to access your dashboard.</p>
                <p>
                    <a href="http://localhost:3000/login.html">
                        Click here to login
                    </a>
                </p>
            `
        });

        res.json({
            success: true,
            message: "Restaurant approved successfully"
        });

    } catch (err) {

        res.json({
            success: false,
            message: err.message
        });

    }

});


// =======================
// REJECT RESTAURANT
// =======================
router.post("/reject/:id", async (req, res) => {

    try {

        const restaurant = await User.findById(req.params.id);

        if (!restaurant) {
            return res.json({
                success: false,
                message: "Restaurant not found"
            });
        }

        const reason = req.body.reason || "No reason provided";

        restaurant.restaurantStatus = "rejected";
        restaurant.rejectReason = reason;

        await restaurant.save();

        // =======================
        // EMAIL (REJECTED)
        // =======================
        await transporter.sendMail({
            from: "foodrouteplanner@gmail.com",
            to: restaurant.email,
            subject: "Restaurant Application Rejected",
            html: `
                <h2>Application Update</h2>
                <p>Sorry, your restaurant <b>${restaurant.restaurantName}</b> was rejected.</p>
                <p><b>Reason:</b> ${reason}</p>
                <p>You may update your application and try again.</p>
            `
        });

        res.json({
            success: true,
            message: "Restaurant rejected successfully"
        });

    } catch (err) {

        res.json({
            success: false,
            message: err.message
        });

    }

});


// =======================
// GET ALL USERS
// =======================
router.get("/users", async (req, res) => {

    try {

        const users = await User.find({
            role: "user",
            isVerified: true
        });

        res.json({
            success: true,
            users
        });

    } catch (err) {

        res.json({
            success: false,
            message: err.message
        });

    }

});


// =======================
// DELETE USER OR RESTAURANT
// =======================
router.delete("/delete/:id", async (req, res) => {

    try {

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (err) {

        res.json({
            success: false,
            message: err.message
        });

    }

});

router.delete("/deleteRestaurant/:id", async (req, res) => {

    try {

        // Find the restaurant owner/user
        const restaurant = await User.findById(req.params.id);

        if (!restaurant) {
            return res.json({
                success: false,
                message: "Restaurant not found"
            });
        }

        // Delete the Restaurant record
        await Restaurant.findOneAndDelete({
            owner: restaurant._id
        });

        // Delete the User record
        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Restaurant deleted successfully"
        });

    } catch (err) {

        console.log("DELETE RESTAURANT ERROR:", err);

        res.json({
            success: false,
            message: err.message
        });

    }
});


/* ===============================
   CONTACT SUPPORT MANAGEMENT
================================ */

// Get all support requests
router.get("/support-requests", async (req, res) => {
    try {
        const requests = await SupportRequest.find()
            .populate("senderId", "username email restaurantName")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            requests
        });
    } catch (err) {
        console.error("Load support requests error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to load support requests."
        });
    }
});

// Admin replies to a support request

router.patch("/support-requests/:id/reply", async (req, res) => {
    try {
        const adminReply = (req.body.adminReply || "").trim();

        if (!adminReply) {
            return res.status(400).json({
                success: false,
                message: "Please enter a reply."
            });
        }

        if (adminReply.length > 3000) {
            return res.status(400).json({
                success: false,
                message: "Your reply cannot exceed 3000 characters."
            });
        }

        const request = await SupportRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Support request not found."
            });
        }

        request.messages.push({
            senderId: req.session.user._id,
            senderRole: "admin",
            message: adminReply
        });

        // Keep the latest reply in the legacy field too
        request.adminReply = adminReply;

        await request.save();

        res.json({
            success: true,
            message: "Reply saved successfully."
        });

    } catch (error) {
        console.error("Save support reply error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to save reply."
        });
    }
});


// Update support request status
router.patch("/support-requests/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["Pending", "In Progress", "Resolved"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid support request status."
            });
        }

        const request = await SupportRequest.findByIdAndUpdate(
            req.params.id,
            { status },
            { returnDocument: 'after', runValidators: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Support request not found."
            });
        }

        res.json({
            success: true,
            message: "Support request status updated.",
            request
        });
    } catch (err) {
        console.error("Update support status error:", err);

        if (err.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid support request ID."
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update support request status."
        });
    }
});


module.exports = router;

