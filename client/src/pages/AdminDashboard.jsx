import { Helmet } from "react-helmet-async";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, Edit3, FolderTree, MessageSquare, Plus, Power, RotateCcw, Ruler, Search, ThumbsDown, ThumbsUp, Trash2, Upload, X, Loader2, Star } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api.js";
import DashboardSidebar from "../components/DashboardSidebar.jsx";
import OrderStatusBadge from "../components/OrderStatusBadge.jsx";
import DiwaliDecoration from "../components/decorations/DiwaliDecoration.jsx";
import { useFestiveTheme } from "../context/FestiveThemeContext.jsx";
import { formatCurrency } from "../utils/format.js";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  discountPrice: "",
  colors: "",
  sizes: "",
  fabric: "",
  stock: "",
  description: "",
  care: "",
  featured: false,
  bestSeller: false
};

const emptyThemeForm = {
  name: "",
  startDate: "",
  endDate: "",
  topBannerText: "",
  heroBannerText: "",
  heroBannerSubtext: "",
  primary: "#a86445",
  secondary: "#bd9359",
  background: "#fffdfa",
  isActive: true
};

const LOW_STOCK_THRESHOLD = 5;

export default function AdminDashboard() {
  const [active, setActive] = useState("overview");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [festiveThemes, setFestiveThemes] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const loadAdminData = () => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {});
    api.get("/admin/orders").then(({ data }) => setOrders(data)).catch(() => {});
    api.get("/admin/users").then(({ data }) => setUsers(data)).catch(() => {});
    api.get("/admin/products").then(({ data }) => setProducts(data)).catch(() => {});
    api.get("/admin/low-stock").then(({ data }) => setLowStockProducts(data)).catch(() => {});
    api.get("/categories").then(({ data }) => setCategories(data)).catch(() => {});
    api.get("/admin/festive/all").then(({ data }) => setFestiveThemes(data)).catch(() => {});
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Elegant Home Decor</title>
      </Helmet>
      <section className="container dashboard-layout">
        <DashboardSidebar active={active} setActive={setActive} admin />
        <div className="dashboard-content">
          {active === "overview" && (
            <section className="dashboard-panel">
              <h1>Dashboard Overview</h1>
              <div className="stat-grid">
                <Stat label="Total Sales" value={formatCurrency(stats?.totalSales || 0)} />
                <Stat label="Orders" value={stats?.totalOrders || 0} />
                <Stat label="Users" value={stats?.totalUsers || 0} />
                <Stat label="Products" value={stats?.totalProducts || 0} />
              </div>
              <h2>Recent Orders</h2>
              <OrderTable orders={stats?.recentOrders || orders.slice(0, 6)} />
            </section>
          )}
          {active === "products" && (
            <ProductManager
              categories={categories}
              products={products}
              onProductsChange={(nextProducts) => {
                setProducts(nextProducts);
                loadAdminData();
              }}
              onCategoriesChange={setCategories}
            />
          )}
          {active === "categories" && (
            <CategoryManager categories={categories} onCategoriesChange={setCategories} />
          )}
          {active === "reviews" && (
            <ReviewManager />
          )}
          {active === "returns" && (
            <ReturnManagerAdmin />
          )}
          {active === "festive" && (
            <FestiveThemeManager
              themes={festiveThemes}
              onThemesChange={(nextThemes) => {
                setFestiveThemes(nextThemes);
                loadAdminData();
              }}
            />
          )}
          {active === "orders" && (
            <section className="dashboard-panel">
              <h1>Order Management</h1>
              <OrderTable orders={orders} />
            </section>
          )}
          {active === "users" && (
            <section className="dashboard-panel">
              <h1>Registered Users</h1>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                  <tbody>{users.map((user) => <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          )}
          {active === "inventory" && (
            <section className="dashboard-panel">
              <h1>Inventory Alerts</h1>
              {lowStockProducts.length === 0 && <p style={{ color: "var(--muted)" }}>All products are well-stocked.</p>}
              {lowStockProducts.map((product) => (
                <div className="inventory-line" key={product._id}>
                  <span>{product.name}</span>
                  <strong className={product.stock === 0 ? "stock-out" : "stock-low"}>{product.stock} Left</strong>
                </div>
              ))}
            </section>
          )}
          {active === "sizecharts" && (
            <SizeChartManager categories={categories} />
          )}
        </div>
      </section>
    </>
  );
}

const formatDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const getThemeStatus = (theme) => {
  const today = new Date();
  const start = new Date(theme.startDate);
  const end = new Date(theme.endDate);
  if (theme.isActive && start <= today && end >= today) return { label: "Active", className: "badge-success" };
  if (start > today) return { label: "Upcoming", className: "badge-warning" };
  if (end < today) return { label: "Expired", className: "badge-info" };
  return { label: "Disabled", className: "badge-danger" };
};

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProductManager({ categories, products, onProductsChange, onCategoriesChange }) {
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [catSaving, setCatSaving] = useState(false);

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setFiles([]);
    setEditing(null);
  };

  const editProduct = (product) => {
    setEditing(product);
    setFiles([]);
    setForm({
      name: product.name || "",
      category: product.category?._id || product.category || "",
      price: product.price || "",
      discountPrice: product.discountPrice || "",
      colors: (product.colors || []).join(", "),
      sizes: (product.sizes || []).join(", "),
      fabric: product.fabric || "",
      stock: product.stock ?? "",
      description: product.description || "",
      care: product.care || "",
      featured: Boolean(product.featured),
      bestSeller: Boolean(product.bestSeller)
    });
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    if (!form.category) return toast.error("Please Select A Category");
    if (!editing && files.length === 0) return toast.error("Please Upload At Least One Product Image");

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    files.forEach((file) => payload.append("images", file));

    try {
      setSaving(true);
      const request = editing
        ? api.put(`/admin/products/${editing._id}`, payload)
        : api.post("/admin/products", payload);
      const { data } = await request;
      const nextProducts = editing
        ? products.map((product) => (product._id === data._id ? data : product))
        : [data, ...products];
      onProductsChange(nextProducts);
      toast.success(editing ? "Product Updated Successfully" : "Product Added Successfully");
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could Not Save Product");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Delete This Product?")) return;
    try {
      await api.delete(`/admin/products/${productId}`);
      onProductsChange(products.filter((product) => product._id !== productId));
      toast.success("Product Deleted Successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could Not Delete Product");
    }
  };

  const createCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return toast.error("Category name is required");
    setCatSaving(true);
    try {
      const { data } = await api.post("/categories", { name: catForm.name, description: catForm.description });
      setForm((f) => ({ ...f, category: data._id }));
      setShowCatModal(false);
      setCatForm({ name: "", description: "" });
      if (onCategoriesChange) {
        const { data: updated } = await api.get("/categories");
        onCategoriesChange(updated);
      }
      toast.success("Category created");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create category");
    } finally {
      setCatSaving(false);
    }
  };

  return (
    <section className="dashboard-panel">
      <div className="section-heading inline">
        <h1>Product Management</h1>
        <button className="button primary" type="button" onClick={resetForm}><Plus size={18} /> Add Product</button>
      </div>
      <form className="admin-form" onSubmit={submitProduct}>
        <div className="form-grid">
          <input placeholder="Product Name" value={form.name} onChange={(event) => setField("name", event.target.value)} required />
          <div className="category-field-wrap">
            <select value={form.category} onChange={(event) => setField("category", event.target.value)} required>
              <option value="">Select Category</option>
              {categories.map((category) => <option value={category._id} key={category._id}>{category.name}</option>)}
            </select>
            <button type="button" className="add-cat-btn" onClick={() => setShowCatModal(true)} title="Add Category">
              <Plus size={16} />
            </button>
          </div>
          <input placeholder="Price" type="number" min="0" value={form.price} onChange={(event) => setField("price", event.target.value)} required />
          <input placeholder="Discount Price" type="number" min="0" value={form.discountPrice} onChange={(event) => setField("discountPrice", event.target.value)} />
          <input placeholder="Colors, Comma Separated" value={form.colors} onChange={(event) => setField("colors", event.target.value)} />
          <input placeholder="Sizes, Comma Separated" value={form.sizes} onChange={(event) => setField("sizes", event.target.value)} />
          <input placeholder="Fabric" value={form.fabric} onChange={(event) => setField("fabric", event.target.value)} />
          <input placeholder="Stock" type="number" min="0" value={form.stock} onChange={(event) => setField("stock", event.target.value)} required />
        </div>
        <textarea placeholder="Product Description" rows="4" value={form.description} onChange={(event) => setField("description", event.target.value)} required />
        <textarea placeholder="Care Instructions" rows="3" value={form.care} onChange={(event) => setField("care", event.target.value)} />
        <div className="admin-checks">
          <label><input type="checkbox" checked={form.featured} onChange={(event) => setField("featured", event.target.checked)} /> Featured</label>
          <label><input type="checkbox" checked={form.bestSeller} onChange={(event) => setField("bestSeller", event.target.checked)} /> Best Seller</label>
        </div>
        <label className="upload-drop">
          <Upload />
          {files.length ? `${files.length} Image${files.length > 1 ? "s" : ""} Selected` : editing ? "Upload New Images To Replace Current Images" : "Upload Multiple Product Images"}
          <input type="file" multiple accept="image/*" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
        </label>
        <div className="button-row">
          <button className="button primary" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update Product" : "Save Product"}</button>
          {editing && <button className="button ghost" type="button" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>

      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Category</h3>
              <button className="icon-button" onClick={() => setShowCatModal(false)}><X size={20} /></button>
            </div>
            <form className="modal-body" onSubmit={createCategory}>
              <div className="form-field">
                <label>Category Name</label>
                <input value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Diya Decor" required />
              </div>
              <div className="form-field">
                <label>Description (optional)</label>
                <textarea rows={3} value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of the category" />
              </div>
              <div className="modal-footer">
                <button className="button primary" type="submit" disabled={catSaving}>{catSaving ? "Saving..." : "Save Category"}</button>
                <button className="button ghost" type="button" onClick={() => setShowCatModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ProductTable products={products} onEdit={editProduct} onDelete={deleteProduct} />
    </section>
  );
}

function ProductTable({ products, onEdit, onDelete }) {
  const stockClass = (stock) => {
    if (stock === 0) return "stock-out";
    if (stock <= LOW_STOCK_THRESHOLD) return "stock-low";
    return "";
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id} className={stockClass(product.stock) ? `stock-row-${stockClass(product.stock)}` : ""}>
              <td>{product.images?.[0]?.url && <img className="admin-product-thumb" src={product.images[0].url} alt={product.name} />}</td>
              <td>{product.name}</td>
              <td>{product.category?.name || "Uncategorized"}</td>
              <td>{formatCurrency(product.discountPrice || product.price)}</td>
              <td className={stockClass(product.stock)}>{product.stock}</td>
              <td>
                <div className="table-actions">
                  <button type="button" className="icon-button" onClick={() => onEdit(product)} aria-label="Edit Product"><Edit3 size={17} /></button>
                  <button type="button" className="icon-button" onClick={() => onDelete(product._id)} aria-label="Delete Product"><Trash2 size={17} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FestiveThemeManager({ themes, onThemesChange }) {
  const { refreshTheme } = useFestiveTheme();
  const [form, setForm] = useState(emptyThemeForm);
  const [topBannerImage, setTopBannerImage] = useState(null);
  const [heroBannerImage, setHeroBannerImage] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState(false);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (name === "startDate" || name === "endDate") {
      setDateError(false);
    }
  };

  const resetForm = () => {
    setForm(emptyThemeForm);
    setTopBannerImage(null);
    setHeroBannerImage(null);
    setEditing(null);
  };

  const editTheme = (theme) => {
    setEditing(theme);
    setTopBannerImage(null);
    setHeroBannerImage(null);
    setForm({
      name: theme.name || "",
      startDate: formatDateInput(theme.startDate),
      endDate: formatDateInput(theme.endDate),
      topBannerText: theme.topBannerText || "",
      heroBannerText: theme.heroBannerText || "",
      heroBannerSubtext: theme.heroBannerSubtext || "",
      primary: theme.themeColors?.primary || "#a86445",
      secondary: theme.themeColors?.secondary || "#bd9359",
      background: theme.themeColors?.background || "#fffdfa",
      isActive: Boolean(theme.isActive)
    });
  };

  const submitTheme = async (event) => {
    event.preventDefault();
    if (!editing && !heroBannerImage) return toast.error("Please Upload A Hero Banner Image");

    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      setDateError(true);
      return toast.error("End date must be after start date");
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (topBannerImage) payload.append("topBannerImage", topBannerImage);
    if (heroBannerImage) payload.append("heroBannerImage", heroBannerImage);

    try {
      setSaving(true);
      const { data } = editing
        ? await api.put(`/admin/festive/edit/${editing._id}`, payload)
        : await api.post("/admin/festive/add", payload);
      const nextThemes = editing
        ? themes.map((theme) => (theme._id === data._id ? data : theme))
        : [data, ...themes];
      onThemesChange(nextThemes);
      await refreshTheme();
      toast.success(editing ? "Festive Theme Updated Successfully" : "Festive Theme Added Successfully");
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could Not Save Festive Theme");
    } finally {
      setSaving(false);
    }
  };

  const deleteTheme = async (themeId) => {
    if (!window.confirm("Delete This Festive Theme?")) return;
    try {
      await api.delete(`/admin/festive/delete/${themeId}`);
      onThemesChange(themes.filter((theme) => theme._id !== themeId));
      await refreshTheme();
      toast.success("Festive Theme Deleted Successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could Not Delete Festive Theme");
    }
  };

  const toggleTheme = async (themeId) => {
    try {
      const { data } = await api.patch(`/admin/festive/toggle/${themeId}`);
      onThemesChange(themes.map((theme) => (theme._id === data._id ? data : theme)));
      await refreshTheme();
      toast.success("Festive Theme Status Updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could Not Toggle Festive Theme");
    }
  };

  return (
    <section className="dashboard-panel">
      <div className="section-heading inline">
        <h1>Festive Themes</h1>
        <button className="button primary" type="button" onClick={resetForm}><Plus size={18} /> Add New Festive Theme</button>
      </div>
      <div className="festive-form-layout">
        <form className="admin-form" onSubmit={submitTheme}>
          <div className="form-section">
            <h4 className="form-section-title">Campaign Details</h4>
            <div className="form-grid">
              <input placeholder="Campaign Name" value={form.name} onChange={(event) => setField("name", event.target.value)} required />
              <input type="date" value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} required />
              <div style={{ gridColumn: "span 1" }}>
                <input type="date" value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} required />
                {dateError && <span className="field-error">End date must be after start date</span>}
              </div>
            </div>
            <div className="form-toggle">
              <label className="toggle-switch">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setField("isActive", event.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Active</span>
            </div>
          </div>

          <div className="form-section">
            <h4 className="form-section-title">Banner Content</h4>
            <div className="form-grid">
              <input placeholder="Top Banner Text" value={form.topBannerText} onChange={(event) => setField("topBannerText", event.target.value)} />
              <input placeholder="Hero Banner Text" value={form.heroBannerText} onChange={(event) => setField("heroBannerText", event.target.value)} />
              <input placeholder="Hero Banner Subtext" value={form.heroBannerSubtext} onChange={(event) => setField("heroBannerSubtext", event.target.value)} />
            </div>
          </div>

          <div className="form-section">
            <h4 className="form-section-title">Theme Colors</h4>
            <div className="color-grid">
              <label>
                Primary
                <div className="color-picker-row">
                  <input type="color" value={form.primary} onChange={(event) => setField("primary", event.target.value)} />
                  <input type="text" value={form.primary} onChange={(event) => setField("primary", event.target.value.toUpperCase())} placeholder="#000000" />
                </div>
              </label>
              <label>
                Secondary
                <div className="color-picker-row">
                  <input type="color" value={form.secondary} onChange={(event) => setField("secondary", event.target.value)} />
                  <input type="text" value={form.secondary} onChange={(event) => setField("secondary", event.target.value.toUpperCase())} placeholder="#000000" />
                </div>
              </label>
              <label>
                Background
                <div className="color-picker-row">
                  <input type="color" value={form.background} onChange={(event) => setField("background", event.target.value)} />
                  <input type="text" value={form.background} onChange={(event) => setField("background", event.target.value.toUpperCase())} placeholder="#000000" />
                </div>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h4 className="form-section-title">Banner Images</h4>
            <div className="form-grid">
              <label className="upload-drop">
                {topBannerImage ? (
                  <div className="upload-preview">
                    <img src={URL.createObjectURL(topBannerImage)} alt="Top Banner Preview" />
                    <button type="button" className="remove-image" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTopBannerImage(null); }} aria-label="Remove top banner image">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload />
                    {editing ? "Replace Top Banner Image" : "Top Banner Image Optional"}
                  </>
                )}
                <input type="file" accept="image/*" onChange={(event) => setTopBannerImage(event.target.files?.[0] || null)} />
              </label>
              <label className="upload-drop">
                {heroBannerImage ? (
                  <div className="upload-preview">
                    <img src={URL.createObjectURL(heroBannerImage)} alt="Hero Banner Preview" />
                    <button type="button" className="remove-image" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHeroBannerImage(null); }} aria-label="Remove hero banner image">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload />
                    {editing ? "Replace Hero Banner Image" : "Hero Banner Image Required"}
                  </>
                )}
                <input type="file" accept="image/*" onChange={(event) => setHeroBannerImage(event.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <div className="button-row">
            <button className="button primary" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update Festive Theme" : "Save Festive Theme"}</button>
            {editing && <button className="button ghost" type="button" onClick={resetForm}>Cancel Edit</button>}
          </div>
        </form>
        <div className="festive-preview">
          <h3>Live Preview</h3>
          <div className="preview-top-banner" style={topBannerImage ? { backgroundImage: `url(${URL.createObjectURL(topBannerImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: form.primary }}>
            <div className="preview-top-banner-overlay">
              {form.topBannerText && <span>{form.topBannerText}</span>}
            </div>
          </div>
          <div className="preview-hero-banner">
            {heroBannerImage ? (
              <div className="preview-hero-with-image" style={{ backgroundImage: `url(${URL.createObjectURL(heroBannerImage)})` }}>
                {form.decorationStyle === "diwali" && <DiwaliDecoration />}
                <div className="preview-hero-overlay">
                  {form.heroBannerText && <h2>{form.heroBannerText}</h2>}
                  {form.heroBannerSubtext && <p>{form.heroBannerSubtext}</p>}
                </div>
              </div>
            ) : (
              <div className="preview-hero-placeholder">
                {form.decorationStyle === "diwali" && <DiwaliDecoration />}
                <span>Hero banner image will appear here</span>
                {form.heroBannerText && <h2>{form.heroBannerText}</h2>}
                {form.heroBannerSubtext && <p>{form.heroBannerSubtext}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {themes.map((theme) => {
              const status = getThemeStatus(theme);
              return (
                <tr key={theme._id}>
                  <td>{theme.name}</td>
                  <td>{formatDateInput(theme.startDate)}</td>
                  <td>{formatDateInput(theme.endDate)}</td>
                  <td><span className={`status-badge ${status.className}`}>{status.label}</span></td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="icon-button" onClick={() => editTheme(theme)} aria-label="Edit Theme"><Edit3 size={17} /></button>
                      <button type="button" className="icon-button" onClick={() => toggleTheme(theme._id)} aria-label="Toggle Theme"><Power size={17} /></button>
                      <button type="button" className="icon-button" onClick={() => deleteTheme(theme._id)} aria-label="Delete Theme"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReviewManager() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, title: "", review: "" });

  const loadReviews = () => {
    const url = filter ? `/admin/reviews?status=${filter}` : "/admin/reviews";
    api.get(url).then(({ data }) => setReviews(data)).catch(() => {});
  };

  useEffect(() => { loadReviews(); }, [filter]);

  const approve = async (id) => {
    try {
      await api.put(`/admin/reviews/${id}/approve`);
      toast.success("Review approved");
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
    }
  };

  const reject = async (id) => {
    try {
      await api.put(`/admin/reviews/${id}/reject`);
      toast.success("Review rejected");
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    }
  };

  const openEdit = (review) => {
    setEditing(review);
    setEditForm({ rating: review.rating, title: review.title || "", review: review.review });
  };

  const saveEdit = async () => {
    try {
      await api.put(`/admin/reviews/${editing._id}`, editForm);
      toast.success("Review updated");
      setEditing(null);
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.success("Review deleted");
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const getStatusBadge = (status) => {
    const map = { pending: "badge-warning", approved: "badge-success", rejected: "badge-danger" };
    return `status-badge ${map[status] || "badge-info"}`;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} color="currentColor" />
    ));
  };

  return (
    <section className="dashboard-panel">
      <div className="section-heading inline">
        <h1>Product Reviews Management</h1>
      </div>
      <div className="review-filters">
        {["", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            className={`button small ${filter === f ? "primary" : "ghost"}`}
            onClick={() => setFilter(f)}
          >
            {f ? f.charAt(0).toUpperCase() + f.slice(1) : "All"}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Product</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>No reviews found</td></tr>
            )}
            {reviews.map((review) => (
              <tr key={review._id}>
                <td>{review.user?.name || "Unknown"}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {review.product?.images?.[0]?.url && (
                      <img src={review.product.images[0].url} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover" }} />
                    )}
                    <span>{review.product?.name || "Deleted Product"}</span>
                  </div>
                </td>
                <td><div className="review-stars">{renderStars(review.rating)}</div></td>
                <td>
                  <div className="review-cell">
                    {review.title && <strong>{review.title}</strong>}
                    <p>{review.review}</p>
                  </div>
                </td>
                <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                <td><span className={getStatusBadge(review.status)}>{review.status}</span></td>
                <td>
                  <div className="table-actions">
                    {review.status === "pending" && (
                      <>
                        <button type="button" className="icon-button success" onClick={() => approve(review._id)} aria-label="Approve" title="Approve">
                          <ThumbsUp size={16} />
                        </button>
                        <button type="button" className="icon-button danger" onClick={() => reject(review._id)} aria-label="Reject" title="Reject">
                          <ThumbsDown size={16} />
                        </button>
                      </>
                    )}
                    <button type="button" className="icon-button" onClick={() => openEdit(review)} aria-label="Edit" title="Edit">
                      <Edit3 size={16} />
                    </button>
                    <button type="button" className="icon-button danger" onClick={() => remove(review._id)} aria-label="Delete" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Review</h3>
              <button className="icon-button" onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="edit-rating">
                <label>Rating</label>
                <div className="star-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setEditForm((f) => ({ ...f, rating: star }))}>
                      <Star size={24} fill={star <= editForm.rating ? "currentColor" : "none"} color="currentColor" />
                    </button>
                  ))}
                </div>
              </div>
              <label>
                Review Title
                <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} placeholder="Review title" />
              </label>
              <label>
                Review Message
                <textarea rows={4} value={editForm.review} onChange={(e) => setEditForm((f) => ({ ...f, review: e.target.value }))} placeholder="Review message" />
              </label>
            </div>
            <div className="modal-footer">
              <button className="button primary" onClick={saveEdit}>Save Changes</button>
              <button className="button ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CategoryManager({ categories, onCategoriesChange }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setEditing(null);
  };

  const editCategory = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || "" });
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Category name is required");
    setSaving(true);
    try {
      const { data } = editing
        ? await api.put(`/categories/${editing._id}`, form)
        : await api.post("/categories", form);
      const next = editing
        ? categories.map((c) => (c._id === data._id ? data : c))
        : [...categories, data];
      onCategoriesChange(next);
      toast.success(editing ? "Category updated" : "Category created");
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      onCategoriesChange(categories.filter((c) => c._id !== id));
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  const toggleActive = async (cat) => {
    try {
      const { data } = await api.put(`/categories/${cat._id}`, { isActive: !cat.isActive });
      onCategoriesChange(categories.map((c) => (c._id === data._id ? data : c)));
      toast.success(data.isActive ? "Category enabled" : "Category disabled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle category");
    }
  };

  return (
    <section className="dashboard-panel">
      <div className="section-heading inline">
        <h1>Category Management</h1>
        <button className="button primary" type="button" onClick={resetForm}><Plus size={18} /> Add Category</button>
      </div>
      <form className="admin-form" onSubmit={submitCategory}>
        <div className="form-grid two-col">
          <input placeholder="Category Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="button-row">
          <button className="button primary" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update Category" : "Save Category"}</button>
          {editing && <button className="button ghost" type="button" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No categories yet</td></tr>
            )}
            {categories.map((cat) => (
              <tr key={cat._id}>
                <td><strong>{cat.name}</strong></td>
                <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{cat.description || "-"}</td>
                <td>
                  <span className={`status-badge ${cat.isActive === false ? "badge-danger" : "badge-success"}`}>
                    {cat.isActive === false ? "Inactive" : "Active"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="icon-button" onClick={() => editCategory(cat)} aria-label="Edit"><Edit3 size={17} /></button>
                    <button type="button" className={`icon-button ${cat.isActive === false ? "success" : ""}`} onClick={() => toggleActive(cat)} aria-label="Toggle Active">
                      <Power size={17} />
                    </button>
                    <button type="button" className="icon-button danger" onClick={() => deleteCategory(cat._id)} aria-label="Delete"><Trash2 size={17} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const returnStatuses = [
  "Requested", "Under Review", "Approved", "Pickup Scheduled",
  "Picked Up", "Received at Warehouse", "Refund Initiated", "Refunded", "Rejected"
];

const statusColors = {
  "Requested": "badge-warning",
  "Under Review": "badge-warning",
  "Approved": "badge-success",
  "Pickup Scheduled": "badge-info",
  "Picked Up": "badge-info",
  "Received at Warehouse": "badge-info",
  "Refund Initiated": "badge-info",
  "Refunded": "badge-success",
  "Rejected": "badge-danger"
};

function ReturnManagerAdmin() {
  const [returns, setReturns] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState("");
  const [notes, setNotes] = useState("");
  const [refundForm, setRefundForm] = useState({ refundAmount: "", refundMethod: "Original Payment Method", transactionId: "" });

  const loadReturns = () => {
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (search.trim()) params.set("search", search.trim());
    api.get(`/admin/returns?${params}`).then(({ data }) => setReturns(data)).catch(() => {});
  };

  useEffect(() => { loadReturns(); }, [filter]);

  const searchTimer = useRef(null);
  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadReturns(), 400);
  };

  const updateStatus = async (id, status, restock) => {
    try {
      setStatusUpdating(id);
      await api.put(`/admin/returns/${id}/status`, { status, restock });
      toast.success(`Status updated to "${status}"`);
      loadReturns();
      if (selected?._id === id) {
        const { data } = await api.get(`/admin/returns/${id}`);
        setSelected(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdating("");
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    try {
      await api.put(`/admin/returns/${selected._id}/notes`, { adminNotes: notes });
      toast.success("Notes saved");
      setSelected((prev) => ({ ...prev, adminNotes: notes }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save notes");
    }
  };

  const initiateRefund = async () => {
    if (!selected) return;
    if (!refundForm.refundAmount) return toast.error("Enter refund amount");
    try {
      const { data } = await api.post(`/admin/returns/${selected._id}/refund`, refundForm);
      toast.success("Refund initiated");
      setSelected(data);
      loadReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate refund");
    }
  };

  const completeRefundAction = async () => {
    if (!selected) return;
    try {
      const { data } = await api.put(`/admin/returns/${selected._id}/refund/complete`, { transactionId: refundForm.transactionId });
      toast.success("Refund completed");
      setSelected(data);
      loadReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete refund");
    }
  };

  const viewDetail = async (ret) => {
    const { data } = await api.get(`/admin/returns/${ret._id}`);
    setSelected(data);
    setNotes(data.adminNotes || "");
    setRefundForm({
      refundAmount: data.refund?.refundAmount || "",
      refundMethod: data.refund?.refundMethod || "Original Payment Method",
      transactionId: data.refund?.transactionId || ""
    });
  };

  const canInitiateRefund = selected && ["Received at Warehouse", "Refund Initiated"].includes(selected.status) && (!selected.refund || selected.refund.refundStatus !== "Completed");

  return (
    <section className="dashboard-panel">
      <div className="section-heading inline">
        <h1>Returns Management</h1>
      </div>

      <div className="return-admin-toolbar">
        <div className="review-filters">
          {["", "Requested", "Under Review", "Approved", "Pickup Scheduled", "Picked Up", "Received at Warehouse", "Refund Initiated", "Refunded", "Rejected"].map((f) => (
            <button key={f} className={`button small ${filter === f ? "primary" : "ghost"}`} onClick={() => setFilter(f)}>
              {f || "All"}
            </button>
          ))}
        </div>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search by Order ID, Customer, Product, Return ID..." value={search} onChange={(e) => handleSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Return ID</th><th>Customer</th><th>Product</th><th>Reason</th><th>Qty</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {returns.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No return requests found</td></tr>
            )}
            {returns.map((ret) => (
              <tr key={ret._id}>
                <td className="return-id-cell">{ret.returnId}</td>
                <td>{ret.user?.name || "Unknown"}</td>
                <td>
                  <div className="return-product-cell">
                    {ret.product?.images?.[0]?.url && <img src={ret.product.images[0].url} alt="" />}
                    <span>{ret.product?.name || "Deleted"}</span>
                  </div>
                </td>
                <td className="return-reason-cell">{ret.returnReason}</td>
                <td>{ret.quantity}</td>
                <td><span className={`status-badge ${statusColors[ret.status]}`}>{ret.status}</span></td>
                <td>{new Date(ret.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="button small ghost" onClick={() => viewDetail(ret)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Return Details - {selected.returnId}</h3>
              <button className="icon-button" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="modal-body return-detail-body">
              <div className="return-detail-grid">
                <div className="detail-section">
                  <h4>Customer Info</h4>
                  <p><span>Name:</span> {selected.user?.name}</p>
                  <p><span>Email:</span> {selected.user?.email}</p>
                </div>
                <div className="detail-section">
                  <h4>Order Info</h4>
                  <p><span>Order:</span> {selected.order?.orderNumber}</p>
                  <p><span>Product:</span> {selected.product?.name}</p>
                  <p><span>Quantity:</span> {selected.quantity}</p>
                </div>
                <div className="detail-section">
                  <h4>Return Reason</h4>
                  <p>{selected.returnReason}</p>
                  {selected.comments && <p className="return-comments">{selected.comments}</p>}
                </div>
                <div className="detail-section">
                  <h4>Current Status</h4>
                  <p><span className={`status-badge ${statusColors[selected.status]}`}>{selected.status}</span></p>
                </div>
              </div>

              {selected.images?.length > 0 && (
                <div className="detail-section">
                  <h4>Uploaded Images</h4>
                  <div className="image-grid">
                    {selected.images.map((img, i) => <img key={i} src={img} alt="" className="detail-image" />)}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>Update Status</h4>
                <div className="status-update-row">
                  <select value={selected.status} onChange={(e) => {
                    const newStatus = e.target.value;
                    const needsRestock = ["Received at Warehouse", "Refunded"].includes(newStatus);
                    if (needsRestock) {
                      updateStatus(selected._id, newStatus, true);
                    } else {
                      updateStatus(selected._id, newStatus);
                    }
                  }} className="status-select">
                    {returnStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {statusUpdating === selected._id && <Loader2 size={18} className="spin" />}
                </div>
              </div>

              <div className="detail-section">
                <h4>Restock Product</h4>
                <label className="checkbox-line">
                  <input type="checkbox" checked={selected.restock !== false} onChange={async (e) => {
                    await api.put(`/admin/returns/${selected._id}/status`, { status: selected.status, restock: e.target.checked });
                    loadReturns();
                    setSelected((prev) => ({ ...prev, restock: e.target.checked }));
                  }} />
                  Restock item when received
                </label>
              </div>

              {canInitiateRefund && (
                <div className="detail-section refund-section">
                  <h4>{selected.refund?.refundStatus === "Completed" ? "Refund Details" : "Initiate Refund"}</h4>
                  <div className="refund-form-row">
                    <input type="number" placeholder="Refund Amount" value={refundForm.refundAmount} onChange={(e) => setRefundForm((f) => ({ ...f, refundAmount: e.target.value }))} />
                    <select value={refundForm.refundMethod} onChange={(e) => setRefundForm((f) => ({ ...f, refundMethod: e.target.value }))}>
                      <option value="Original Payment Method">Original Payment Method</option>
                      <option value="Store Wallet">Store Wallet</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                    <input placeholder="Transaction ID" value={refundForm.transactionId} onChange={(e) => setRefundForm((f) => ({ ...f, transactionId: e.target.value }))} />
                  </div>
                  <div className="refund-actions">
                    {(!selected.refund || selected.refund.refundStatus === "Pending") && (
                      <button className="button primary" onClick={initiateRefund}>Initiate Refund</button>
                    )}
                    {selected.refund?.refundStatus === "Initiated" && (
                      <button className="button secondary" onClick={completeRefundAction}>Mark as Completed</button>
                    )}
                  </div>
                  {selected.refund && (
                    <div className="refund-status-info">
                      <p><span>Amount:</span> {formatCurrency(selected.refund.refundAmount)}</p>
                      <p><span>Method:</span> {selected.refund.refundMethod}</p>
                      <p><span>Transaction ID:</span> {selected.refund.transactionId || "N/A"}</p>
                      <p><span>Status:</span> <span className={`status-badge ${selected.refund.refundStatus === "Completed" ? "badge-success" : "badge-warning"}`}>{selected.refund.refundStatus}</span></p>
                    </div>
                  )}
                </div>
              )}

              {selected.refund?.refundStatus === "Completed" && (
                <div className="detail-section">
                  <h4>Refund Completed</h4>
                  <p><span>Amount:</span> {formatCurrency(selected.refund.refundAmount)}</p>
                  <p><span>Method:</span> {selected.refund.refundMethod}</p>
                  <p><span>Transaction ID:</span> {selected.refund.transactionId || "N/A"}</p>
                  <p><span>Completed:</span> {new Date(selected.refund.completedAt).toLocaleDateString()}</p>
                </div>
              )}

              <div className="detail-section">
                <h4>Admin Notes</h4>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add internal notes..." />
                <button className="button small primary" onClick={saveNotes} style={{ marginTop: 8 }}>Save Notes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function OrderTable({ orders = [] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order.orderNumber || order._id?.slice(-8).toUpperCase()}</td>
              <td>{order.user?.name || order.guestInfo?.fullName || "Customer"}</td>
              <td>{formatCurrency(order.totalPrice)}</td>
              <td><OrderStatusBadge status={order.orderStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SizeChartManager({ categories }) {
  const [charts, setCharts] = useState([]);
  const [form, setForm] = useState({ category: "", title: "", chartImage: "", rows: [] });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCharts = async () => {
    try {
      const { data } = await api.get("/size-charts");
      setCharts(data);
    } catch {
      toast.error("Failed to load size charts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCharts(); }, []);

  const resetForm = () => {
    setForm({ category: "", title: "", chartImage: "", rows: [] });
    setEditing(null);
  };

  const addRow = () => {
    setForm((f) => ({ ...f, rows: [...f.rows, { sizeLabel: "", width: "", length: "", height: "", notes: "" }] }));
  };

  const removeRow = (idx) => {
    setForm((f) => ({ ...f, rows: f.rows.filter((_, i) => i !== idx) }));
  };

  const updateRow = (idx, field, value) => {
    setForm((f) => {
      const rows = [...f.rows];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...f, rows };
    });
  };

  const editChart = (chart) => {
    setEditing(chart);
    setForm({
      category: chart.category?._id || "",
      title: chart.title || "",
      chartImage: chart.chartImage || "",
      rows: chart.rows.length ? chart.rows.map((r) => ({ ...r })) : [{ sizeLabel: "", width: "", length: "", height: "", notes: "" }]
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error("Please select a category");
    setSaving(true);
    try {
      const payload = {
        category: form.category,
        title: form.title,
        chartImage: form.chartImage,
        rows: form.rows.filter((r) => r.sizeLabel.trim())
      };
      if (editing) {
        const { data } = await api.put(`/size-charts/${editing._id}`, payload);
        setCharts(charts.map((c) => (c._id === data._id ? data : c)));
        toast.success("Size chart updated");
      } else {
        const { data } = await api.post("/size-charts", payload);
        setCharts([...charts, data]);
        toast.success("Size chart created");
      }
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save size chart");
    } finally {
      setSaving(false);
    }
  };

  const deleteChart = async (id) => {
    if (!window.confirm("Delete this size chart?")) return;
    try {
      await api.delete(`/size-charts/${id}`);
      setCharts(charts.filter((c) => c._id !== id));
      toast.success("Size chart deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const toggleActive = async (chart) => {
    try {
      const { data } = await api.put(`/size-charts/${chart._id}/toggle`);
      setCharts(charts.map((c) => (c._id === data._id ? data : c)));
      toast.success(data.isActive ? "Size chart enabled" : "Size chart disabled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle");
    }
  };

  if (loading) return <section className="dashboard-panel"><h1>Size Charts</h1><p style={{ color: "var(--muted)" }}>Loading...</p></section>;

  return (
    <section className="dashboard-panel">
      <div className="section-heading inline">
        <h1>Size Charts</h1>
        <button className="button primary" type="button" onClick={resetForm}><Plus size={18} /> Add Size Chart</button>
      </div>

      <form className="admin-form" onSubmit={submit}>
        <div className="form-grid two-col">
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
            <option value="">-- Select Category --</option>
            {categories.filter((c) => c.isActive !== false).map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <input placeholder="Title (e.g. Table Cover Size Guide)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="form-field">
          <label>Size Chart Image URL (optional — leave blank to use table below)</label>
          <input placeholder="https://res.cloudinary.com/..." value={form.chartImage} onChange={(e) => setForm((f) => ({ ...f, chartImage: e.target.value }))} />
        </div>

        {!form.chartImage && (
          <div className="size-rows-section">
            <div className="section-heading inline" style={{ marginTop: 16 }}>
              <h3>Size Dimensions</h3>
              <button className="button ghost" type="button" onClick={addRow}><Plus size={16} /> Add Row</button>
            </div>
            {form.rows.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>No rows yet. Click "Add Row" to add size dimensions.</p>
            )}
            {form.rows.map((row, idx) => (
              <div className="size-row-inputs" key={idx}>
                <input placeholder="Label (e.g. 4 Seater)" value={row.sizeLabel} onChange={(e) => updateRow(idx, "sizeLabel", e.target.value)} required />
                <input placeholder="Width (e.g. 60)" value={row.width} onChange={(e) => updateRow(idx, "width", e.target.value)} />
                <input placeholder="Length (e.g. 90)" value={row.length} onChange={(e) => updateRow(idx, "length", e.target.value)} />
                <input placeholder="Height (optional)" value={row.height} onChange={(e) => updateRow(idx, "height", e.target.value)} />
                <input placeholder="Notes" value={row.notes} onChange={(e) => updateRow(idx, "notes", e.target.value)} />
                <button type="button" className="icon-button danger" onClick={() => removeRow(idx)} aria-label="Remove row"><X size={17} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="button-row" style={{ marginTop: 16 }}>
          <button className="button primary" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update Size Chart" : "Save Size Chart"}</button>
          {editing && <button className="button ghost" type="button" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>

      <div className="table-wrap" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr><th>Category</th><th>Title</th><th>Type</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {charts.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No size charts yet</td></tr>
            )}
            {charts.map((chart) => (
              <tr key={chart._id}>
                <td><strong>{chart.category?.name || "—"}</strong></td>
                <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{chart.title || "—"}</td>
                <td>{chart.chartImage ? "Image" : `Table (${chart.rows.length} rows)`}</td>
                <td>
                  <span className={`status-badge ${chart.isActive === false ? "badge-danger" : "badge-success"}`}>
                    {chart.isActive === false ? "Disabled" : "Active"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="icon-button" onClick={() => editChart(chart)} aria-label="Edit"><Edit3 size={17} /></button>
                    <button type="button" className={`icon-button ${chart.isActive === false ? "success" : ""}`} onClick={() => toggleActive(chart)} aria-label="Toggle Active">
                      <Power size={17} />
                    </button>
                    <button type="button" className="icon-button danger" onClick={() => deleteChart(chart._id)} aria-label="Delete"><Trash2 size={17} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
