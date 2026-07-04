import { Bookmark, Heart, LayoutDashboard, LogOut, Megaphone, MessageSquare, Package, RotateCcw, Ruler, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "../features/authSlice.js";
import { useNavigate } from "react-router-dom";

const items = [
  ["profile", UserRound, "Profile"],
  ["orders", Package, "Orders"],
  ["returns", RotateCcw, "Returns & Refunds"],
  ["wishlist", Heart, "Wishlist"],
  ["addresses", ShieldCheck, "Addresses"]
];

export default function DashboardSidebar({ active, setActive, admin = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login");
  };

  const handleReturnsClick = () => {
    navigate("/my-returns");
  };

  const nav = admin
    ? [
        ["overview", LayoutDashboard, "Overview"],
        ["products", Package, "Products"],
        ["categories", Bookmark, "Categories"],
        ["reviews", MessageSquare, "Reviews"],
        ["returns", RotateCcw, "Returns"],
        ["festive", Sparkles, "Festive Themes"],
        ["announcements", Megaphone, "Announcements"],
        ["orders", Package, "Orders"],
        ["users", UserRound, "Users"],
        ["inventory", ShieldCheck, "Inventory"],
        ["sizecharts", Ruler, "Size Charts"]
      ]
    : items;

  return (
    <aside className="dashboard-sidebar">
      {nav.map(([id, Icon, label]) => (
        <button
          key={id}
          className={active === id ? "active" : ""}
          onClick={() => {
            if (!admin && id === "returns") {
              handleReturnsClick();
            } else {
              setActive(id);
            }
          }}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
      {admin && (
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      )}
    </aside>
  );
}
