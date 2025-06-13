import React, { useState } from "react";

const ForgotPasswordPage = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);

  const handleRequestCode = async () => {
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrPhone })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      setStep(2);
    } else {
      alert(data.message);
    }
  };

  const handleResetPassword = async () => {
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrPhone, code, newPassword })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      window.location.href = "/"; // redirect to login
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-slide">
        <h2 className="login-title">Forgot Password</h2>

        {step === 1 ? (
          <>
            <input
              placeholder="Enter Email or Phone"
              className="login-input"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
            />
            <button onClick={handleRequestCode} className="login-button">
              Send Reset Code
            </button>
          </>
        ) : (
          <>
            <input
              placeholder="Enter Reset Code"
              className="login-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              className="login-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button onClick={handleResetPassword} className="login-button">
              Reset Password
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
