import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import API from "../utils/api";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // Example: Call backend API (replace with your API code)
    const response = await API.post("/auth/login", {
      email,
      password
    });

    // Save token if backend sends it
    localStorage.setItem("token", response.data.token);

    // ✅ Redirect to dashboard
    navigate("/dashboard");
  } catch (err) {
    alert("Login failed. Please check your credentials.");
  }
};

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="text"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Login</button>
        </form>
        <p style={{ marginTop: "10px", textAlign: "center" }}>
  Don't have an account? 
  <span 
    style={{ color: "#2563eb", cursor: "pointer" }} 
    onClick={() => navigate("/register")}
  >
    Register
  </span>
</p>
      </div>
    </div>
    
  );
}

export default Login;