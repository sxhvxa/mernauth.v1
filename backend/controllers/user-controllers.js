const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signup = async (req, res, next) => {
  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    console.log(error);
  }
  if (existingUser) {
    return res.status(400).json({
      error: "Email is taken",
    });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    name,
    email,
    password: hashedPassword,
  });

  try {
    await user.save();
  } catch (err) {
    console.log(err);
    return res.status(422).json({ error: err.message });
  }
  res.status(201).json({ message: user });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return new Error(err);
  }
  if (!existingUser) {
    return res.status(400).json({
      error: "Invalid credentials",
    });
  }
  const isMatch = await bcrypt.compare(password, existingUser.password);
  if (!isMatch) {
    return res.status(400).json({
      error: "Invalid Email or Password",
    });
  }
  const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
    expiresIn: "35s",
  });
  if (req.cookies[`${existingUser._id}`]) {
    req.cookies[`${existingUser._id}`] = "";
  }
  res.cookie(String(existingUser._id), token, {
    origin: "http://localhost:3000",
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 30000),
    sameSite: "lax",
  });
  res
    .status(200)
    .json({ message: "Logged in successfully", user: existingUser });
};
const verifyToken = async (req, res, next) => {
  // const header = req.headers["authorization"];
  // const token = header.split(" ")[1];
  const cookie = req.headers.cookie;

  const token = cookie.split("=")[1];
  console.log("ini", token);
  if (!token) {
    return res.status(401).json({
      error: "No token provided",
    });
  }
  jwt.verify(String(token), process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        error: "Invalid token",
      });
    }
    console.log(user.id);
    req.id = user.id;
  });
  next();
};
const getUser = async (req, res, next) => {
  const userId = req.id;
  let user;
  try {
    user = await User.findById(userId, "-password");
  } catch (err) {
    return new Error(err);
  }
  if (!user) {
    return res.status(404).json({ message: "user not found" });
  }
  res.status(200).json({ user });
};
const refreshToken = (req, res, next) => {
  const cookies = req.headers.cookie;
  const prevToken = cookies.split("=")[1];
  if (!prevToken) {
    return res.status(400).json({ message: "No token provided" });
  }
  jwt.verify(String(prevToken), process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log(err);
      return res.status(403).json({ message: "Invalid Auth" });
    }
    res.clearCookie(`${user.id}`);
    req.cookies[`${user.id}`] = "";
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "35s",
    });
    console.log("regenerated token \n", token);

    res.cookie(String(user.id), token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 30),
      sameSite: "lax",
    });
    req.id = user.id;
    next();
  });
};
const logout = (req, res, next) => {
  const cookies = req.headers.cookie;
  const prevToken = cookies.split("=")[1];
  if (!prevToken) {
    return res.status(400).json({ message: "No token provided" });
  }
  jwt.verify(String(prevToken), process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log(err);
      return res.status(403).json({ message: "Invalid Auth" });
    }
    res.clearCookie(`${user.id}`);
    req.cookies[`${user.id}`] = "";
    return res.status(200).json({ message: "Logged out" });
  });
};
exports.logout = logout;
exports.verifyToken = verifyToken;
exports.signup = signup;
exports.login = login;
exports.getUser = getUser;
exports.refreshToken = refreshToken;
