import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset Password | Elegant Home Decor</title>
      </Helmet>
      <section className="auth-page">
        <div className="auth-image-panel" aria-hidden="true">
          <div>
            <span>Elegant Home Decor</span>
            <p>Soft Layers, Crafted Textures, and Warm Homes.</p>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-panel">
            <Link to="/" className="auth-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
              <img 
                src="https://res.cloudinary.com/djligggal/image/upload/v1782812327/ChatGPT_Image_Jun_30_2026_03_08_25_PM_drkks8.png" 
                alt="Elegant Home Decor" 
                style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
              />
              <span>Elegant</span> Home Decor
            </Link>
            <span className="eyebrow auth-kicker">Password Reset</span>
            <h1>Reset Password</h1>
            <p className="auth-subtitle">
              Enter your new password below.
            </p>
            <ErrorMessage message={error} />
            {success && <div className="error-message" style={{ background: '#e8f5e9', color: '#2e7d32' }}>{success}</div>}
            <form onSubmit={submit}>
              <PasswordInput placeholder="New Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <PasswordInput placeholder="Confirm New Password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              <button className="button primary full auth-submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
            <Link to="/login" className="auth-continue">Back to Login</Link>
          </div>
        </div>
      </section>
    </>
  );
}
