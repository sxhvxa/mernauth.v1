const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const router = require("./routes/user-routes");
require("dotenv").config();
const cors = require("cors");
const app = express();
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieParser());
app.use(express.json());
app.use("/api", router);
mongoose
  .connect(
    `mongodb+srv://users:users123@users.hi7cf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(3001);
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log(err);
  });
