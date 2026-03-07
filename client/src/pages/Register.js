import { useState } from "react";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", formData);
      alert("Registration Successful");
      navigate("/login");
    } catch {
      alert("Registration Failed");
    }
  };

  return (

    <div className="register-container">

      <div className="register-card">

        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>

          <label>Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter full name"
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter email"
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            onChange={handleChange}
            required
          />

          <label>Role</label>
          <select name="role" onChange={handleChange} required>
            <option value="">Select Role</option>
            <option value="viewer">Viewer</option>
            <option value="officer">Officer</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit">Register</button>

        </form>

      </div>

    </div>

  );
}

export default Register;