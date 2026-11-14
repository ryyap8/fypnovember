const express = require("express");
const router = express.Router();

const SupportRequest = require("../models/SupportRequest");

// Check whether the user is logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }

    next();
}

// Submit a support request (user or restaurant)
router.post("/", requireLogin, async (req, res) => {
    try {
        const { category, subject, description } = req.body;
        const role = req.session.user.role;

        if (!["user", "restaurant"].includes(role)) {
            return res.status(403).json({
                success: false,
                message: "Only users and restaurants can submit support requests."
            });
        }

        if (
            typeof category !== "string" ||
            typeof subject !== "string" ||
            typeof description !== "string" ||
            !category.trim() ||
            !subject.trim() ||
            !description.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }

        const supportRequest = await SupportRequest.create({
            senderId: req.session.user._id,
            senderRole: role,
            category: category.trim(),
            subject: subject.trim(),
            description: description.trim()
        });

        res.status(201).json({
            success: true,
            message: "Support request submitted successfully.",
            supportRequest
        });
    } catch (err) {
        console.error("Submit support request error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to submit support request."
        });
    }
});

// View the logged-in sender's own support requests
router.get("/my-requests", requireLogin, async (req, res) => {
    try {
        const requests = await SupportRequest.find({
            senderId: req.session.user._id
        }).sort({ createdAt: -1 });

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


/* USER / RESTAURANT REPLY TO A SUPPORT REQUEST */
router.post("/:id/messages", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please log in first."
            });
        }

        const role = req.session.user.role;

        if (!["user", "restaurant"].includes(role)) {
            return res.status(403).json({
                success: false,
                message: "Only users and restaurants can reply."
            });
        }

        const message = (req.body.message || "").trim();

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Please enter a message."
            });
        }

        if (message.length > 3000) {
            return res.status(400).json({
                success: false,
                message: "Your message cannot exceed 3000 characters."
            });
        }

        const request = await SupportRequest.findOne({
            _id: req.params.id,
            senderId: req.session.user._id
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Support request not found."
            });
        }

        request.messages.push({
            senderId: req.session.user._id,
            senderRole: role,
            message
        });

        await request.save();

        res.json({
            success: true,
            message: "Reply sent successfully."
        });

    } catch (error) {
        console.error("User support reply error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to send your reply."
        });
    }
});


module.exports = router;
