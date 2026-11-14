require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(session({
    secret:"foodroutes123",
    resave:false,
    saveUninitialized:false
}));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

mongoose.connect("mongodb://127.0.0.1:27017/foodroutes")
.then(()=>{
    console.log("MongoDB Connected");
})
.catch(err=>{
    console.log(err);
});

app.use("/auth",require("./routes/auth"));
app.use("/profile", require("./routes/profile"));
app.use("/", require("./routes/restaurantRoutes"));
app.use("/reviews", require("./routes/reviewRoutes"));
app.use("/favourites", require("./routes/favouriteRoutes"));
app.use("/admin", require("./routes/admin"));
app.use("/restaurant", require("./routes/restaurant"));
app.use("/menu", require("./routes/menu"));
app.use("/routes", require("./routes/routeRoutes"));
app.use("/support", require("./routes/supportRoutes"));

app.listen(3000,()=>{
    console.log("Server running on port 3000");
});