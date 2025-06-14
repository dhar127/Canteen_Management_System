import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    console.log("🔍 Login attempt:", { username, role });
    
    const user = await User.findOne({ username });

    if (!user) {
      console.log("❌ User not found:", username);
      return res.status(401).json({ message: "User not found" });
    }
    
    if (user.role !== role) {
      console.log("❌ Role mismatch. Expected:", role, "Got:", user.role);
      return res.status(401).json({ message: "Incorrect role" });
    }
    
    if (user.password !== password) {
      console.log("❌ Password incorrect for user:", username);
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log("❌ User account deactivated:", username);
      return res.status(401).json({ message: "Account is deactivated" });
    }

    // Prepare clean user data (exclude sensitive info)
    const userData = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: user.role,
      isActive: user.isActive
    };

    console.log("✅ Login successful for user:", userData._id);

    // Return response with multiple userId formats for frontend compatibility
    res.status(200).json({ 
      message: "Login successful", 
      success: true,
      user: userData,
      userId: user._id.toString(), // This is what your frontend expects
      _id: user._id.toString(),    // Alternative format
      role: user.role
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/signup", async (req, res) => {
  const { name, email, phone, username, password, role } = req.body;

  try {
    console.log("🔍 Signup attempt:", { username, email, role });
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("❌ Username already taken:", username);
      return res.status(400).json({ message: "Username already taken" });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log("❌ Email already registered:", email);
      return res.status(400).json({ message: "Email already registered" });
    }

    const newUser = new User({ name, email, phone, username, password, role });
    await newUser.save();

    console.log("✅ User created successfully:", newUser._id);

    // Return clean user data
    const userData = {
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      username: newUser.username,
      role: newUser.role,
      isActive: newUser.isActive
    };

    res.status(201).json({ 
      message: "Signup successful", 
      success: true,
      user: userData,
      userId: newUser._id.toString()
    });

  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// FORGOT PASSWORD - send reset code (mock)
router.post("/forgot-password", async (req, res) => {
  const { emailOrPhone } = req.body;

  try {
    console.log("🔍 Password reset request for:", emailOrPhone);
    
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!user) {
      console.log("❌ User not found for password reset:", emailOrPhone);
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a simple reset code (mock logic)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    await user.save();

    // In production: send resetCode to email/phone
    console.log(`✅ Reset code generated for ${user.username}: ${resetCode}`);

    res.json({ 
      message: "Reset code sent to your email/phone",
      success: true
    });

  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  const { emailOrPhone, code, newPassword } = req.body;

  try {
    console.log("🔍 Password reset attempt for:", emailOrPhone);
    
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!user || user.resetCode !== code) {
      console.log("❌ Invalid reset code for:", emailOrPhone);
      return res.status(400).json({ message: "Invalid reset code" });
    }

    user.password = newPassword;
    user.resetCode = null; // clear the code after use
    await user.save();

    console.log("✅ Password reset successful for user:", user.username);

    res.json({ 
      message: "Password reset successful",
      success: true
    });

  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;