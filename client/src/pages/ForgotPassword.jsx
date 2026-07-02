import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password | Elegant Home Decor</title>
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
            <h1>Forgot Password</h1>
            <p className="auth-subtitle">
              Enter your email address and we will send you a link to reset your password.
            </p>
            <ErrorMessage message={error} />
            {success && <div className="error-message" style={{ background: '#e8f5e9', color: '#2e7d32' }}>{success}</div>}
            <form onSubmit={submit}>
              <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <button className="button primary full auth-submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <Link to="/login" className="auth-continue">Back to Login</Link>
          </div>
        </div>
      </section>
    </>
  );
}
