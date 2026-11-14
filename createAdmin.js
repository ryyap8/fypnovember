const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

// connect to MongoDB
mongoose.connect("mongodb://localhost:27017/foodroutes");

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash("ry123123$", 10);

        await User.create({
            username: "admin",
            email: "foodrouteplanner@gmail.com",
            password: hashedPassword,
            role: "admin",
            isVerified: true,
            ownerStatus: "none"
        });

        console.log("Admin created successfully");

        mongoose.disconnect();
    } catch (err) {
        console.log(err);
    }
}

createAdmin();