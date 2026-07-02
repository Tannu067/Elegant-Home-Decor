import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login, register } from "../features/authSlice.js";
import { addToCart } from "../features/cartSlice.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import api from "../services/api.js";
import { clearPendingAction } from "../utils/pendingAction.js";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const { loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const action = mode === "login" ? login({ email: form.email, password: form.password }) : register(form);
    const result = await dispatch(action);
    if (result.error) return;

    const redirectAfterLogin = localStorage.getItem("redirectAfterLogin");
    const pendingAction = JSON.parse(localStorage.getItem("pendingAction") || "null");

    if (pendingAction) {
      try {
        if (pendingAction.type === "addToCart") {
          let product = pendingAction.product;
          if (!product && pendingAction.productId) {
            const { data } = await api.get(`/products/${pendingAction.productId}`);
            product = data;
          }

          if (product) {
            const options = pendingAction.options || {};
            dispatch(
              addToCart({
                ...product,
                quantity: options.quantity || 1,
                color: options.color || product.colors?.[0],
                size: options.size || product.sizes?.[0],
                fabric: options.fabric || product.fabric,
                cartId: `${product._id}-${Date.now()}`
              })
            );
            toast.success("Added to Cart");
          }
        }

        if (pendingAction.type === "addToWishlist" && pendingAction.productId) {
          await api.post(`/products/${pendingAction.productId}/like`);
          toast.success("Added to Wishlist");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Could Not Complete Saved Action");
      } finally {
        clearPendingAction();
      }

      navigate(redirectAfterLogin || "/products");
      return;
    }

    navigate(redirectAfterLogin || "/dashboard");
  };

  return (
    <>
      <Helmet>
        <title>{mode === "login" ? "Login" : "Create Account"} | Elegant Home Decor</title>
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
            <span className="eyebrow auth-kicker">Secure Account</span>
            <h1>{mode === "login" ? "Welcome Back" : "Create Your Account"}</h1>
            <p className="auth-subtitle">
              {mode === "login"
                ? "Sign in to Continue Styling Your Home With Curated Fabric Decor."
                : "Create an Account to Save Orders, Addresses, and Your Favorite Pieces."}
            </p>
            <ErrorMessage message={error} />
            <form onSubmit={submit}>
              {mode === "register" && (
                <>
                  <input placeholder="Full Name" value={form.name} onChange={(event) => update("name", event.target.value)} required />
                  <input placeholder="Phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
                </>
              )}
              <input type="email" placeholder="Email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
              <PasswordInput placeholder="Password" value={form.password} onChange={(event) => update("password", event.target.value)} required />
              {mode === "login" && <Link to="/forgot-password" className="auth-continue" style={{ justifySelf: "end", marginTop: "-14px" }}>Forgot Password?</Link>}
              <button className="button primary full auth-submit" disabled={loading}>
                {loading ? "Please Wait..." : mode === "login" ? "Login" : "Register"}
              </button>
            </form>
            <button className="text-button auth-switch" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Create a New Account" : "I Already Have an Account"}
            </button>
            <Link to="/products" className="auth-continue">Continue Shopping</Link>
          </div>
        </div>
      </section>
    </>
  );
}
