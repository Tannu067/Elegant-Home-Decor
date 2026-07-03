import { Heart, LogIn, Menu, Search, ShoppingBag, UserPlus, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { logout } from "../features/authSlice.js";
import TopBanner from "./TopBanner.jsx";

const CATEGORIES = [
  { label: "All", path: "/products" },
  { label: "Table Covers", path: "/products?category=table-covers" },
  { label: "Cushions", path: "/products?category=cushion-covers" },
  { label: "Aprons", path: "/products?category=aprons" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartCount = useSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0));
  const wishlistCount = useSelector((state) => state.wishlist.items.length);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const search = (event) => {
    event.preventDefault();
    if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  const requireLogin = (event, destination) => {
    if (user) return;
    event.preventDefault();
    localStorage.setItem("redirectAfterLogin", destination);
    navigate("/login", { state: { from: destination } });
  };

  const close = () => setOpen(false);

  return (
    <>
      <header className="site-header">
        <TopBanner />
        <nav className="navbar container">
          <button className="icon-button menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle Navigation">
            {open ? <X /> : <Menu />}
          </button>
          <Link to="/" className="brand" onClick={close}>
            <img
              src="https://res.cloudinary.com/djligggal/image/upload/v1782812327/ChatGPT_Image_Jun_30_2026_03_08_25_PM_drkks8.png"
              alt="Elegant Home Decor"
              className="brand-logo"
            />
            <span className="brand-name">Elegant Home Decor</span>
          </Link>
          <div className="nav-menu">
            <NavLink to="/products">Shop</NavLink>
            <NavLink to="/products?category=table-covers">Table Covers</NavLink>
            <NavLink to="/products?category=cushion-covers">Cushions</NavLink>
            <NavLink to="/products?category=aprons">Aprons</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            {user?.role === "admin" && <NavLink to="/admin">Admin Dashboard</NavLink>}
          </div>
          <form className="nav-search" onSubmit={search}>
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
          </form>
          <div className="nav-actions">
            <Link className="icon-link" to="/dashboard" title="Account">
              <UserRound />
            </Link>
            <Link className="icon-link counter" to="/dashboard#wishlist" title="Wishlist" onClick={(event) => requireLogin(event, "/dashboard#wishlist")}>
              <Heart />
              {user && wishlistCount > 0 && <span>{wishlistCount}</span>}
            </Link>
            <Link className="icon-link counter" to="/cart" title="Cart">
              <ShoppingBag />
              {cartCount > 0 && <span>{cartCount}</span>}
            </Link>
            {user ? (
              <button className="text-button" onClick={() => dispatch(logout())}>
                Logout
              </button>
            ) : (
              <Link className="text-button" to="/login">
                Login
              </Link>
            )}
          </div>
          <div className="mobile-nav-icons">
            <Link className="icon-link counter" to="/dashboard#wishlist" title="Wishlist" onClick={(event) => requireLogin(event, "/dashboard#wishlist")}>
              <Heart size={20} />
              {wishlistCount > 0 && <span>{wishlistCount}</span>}
            </Link>
            <Link className="icon-link counter" to="/cart" title="Cart">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span>{cartCount}</span>}
            </Link>
            <Link className="icon-link" to="/dashboard" title="Account" onClick={(event) => requireLogin(event, "/dashboard")}>
              <UserRound size={20} />
            </Link>
          </div>
        </nav>
        <div className="mobile-navbar">
          <form className="mobile-search" onSubmit={search}>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search table covers, cushions, aprons..." />
          </form>
          <div className="category-chips">
            {CATEGORIES.map((cat) => (
              <Link key={cat.label} className="chip" to={cat.path} onClick={close}>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={close}
            />
            <motion.div
              className="nav-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="nav-drawer-header">
                <span>Menu</span>
                <button className="icon-button" onClick={close} aria-label="Close Menu">
                  <X />
                </button>
              </div>
              {user ? (
                <div className="drawer-user">
                  <UserRound size={18} />
                  <span>{user.name || "My Account"}</span>
                </div>
              ) : (
                <div className="drawer-auth">
                  <Link className="drawer-auth-btn" to="/login" onClick={close}>
                    <LogIn size={18} /> Login
                  </Link>
                  <Link className="drawer-auth-btn" to="/register" onClick={close}>
                    <UserPlus size={18} /> Register
                  </Link>
                </div>
              )}
              <NavLink to="/products" onClick={close}>Shop</NavLink>
              <NavLink to="/products?category=table-covers" onClick={close}>Table Covers</NavLink>
              <NavLink to="/products?category=cushion-covers" onClick={close}>Cushions</NavLink>
              <NavLink to="/products?category=aprons" onClick={close}>Aprons</NavLink>
              <NavLink to="/about" onClick={close}>About</NavLink>
              <NavLink to="/contact" onClick={close}>Contact</NavLink>
              {user?.role === "admin" && <NavLink to="/admin" onClick={close}>Admin Dashboard</NavLink>}
              {user && (
                <button className="drawer-logout" onClick={() => { dispatch(logout()); close(); }}>
                  Logout
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
