import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.role !== role) return res.status(401).json({ message: "Incorrect role" });
    if (user.password !== password) return res.status(401).json({ message: "Incorrect password" });

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/signup", async (req, res) => {
  const { name, email, phone, username, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already taken" });

    const newUser = new User({ name, email, phone, username, password, role });
    await newUser.save();

    res.status(201).json({ message: "Signup successful", user: newUser });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// FORGOT PASSWORD - send reset code (mock)
router.post("/forgot-password", async (req, res) => {
  const { emailOrPhone } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate a simple reset code (mock logic)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    await user.save();

    // In production: send resetCode to email/phone
    console.log(`Reset code for ${user.username}: ${resetCode}`);

    res.json({ message: "Reset code sent to your email/phone" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  const { emailOrPhone, code, newPassword } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!user || user.resetCode !== code) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    user.password = newPassword;
    user.resetCode = null; // clear the code after use
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
