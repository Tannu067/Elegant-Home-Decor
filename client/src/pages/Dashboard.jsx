import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api.js";
import DashboardSidebar from "../components/DashboardSidebar.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import OrderStatusBadge from "../components/OrderStatusBadge.jsx";
import { formatCurrency } from "../utils/format.js";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: "easeIn" } },
};

export default function Dashboard() {
  const user = useSelector((state) => state.auth.user);
  const wishlist = useSelector((state) => state.wishlist.items);
  const [active, setActive] = useState(window.location.hash?.replace("#", "") || "profile");
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    api.get("/orders/my").then(({ data }) => setOrders(data)).catch(() => {});
    api.get("/users/addresses").then(({ data }) => setAddresses(data)).catch(() => {});
  }, []);

  return (
    <>
      <Helmet>
        <title>My Account | Elegant Home Decor</title>
      </Helmet>
      <section className="container dashboard-layout">
        <DashboardSidebar active={active} setActive={setActive} />
        <div className="dashboard-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {active === "profile" && (
                <Panel title="Profile Details">
                  <div className="profile-grid">
                    <p><span>Name</span><strong>{user?.name}</strong></p>
                    <p><span>Email</span><strong>{user?.email}</strong></p>
                    <p><span>Phone</span><strong>{user?.phone || "Add Phone Number"}</strong></p>
                  </div>
                  <PasswordForm />
                </Panel>
              )}
              {active === "orders" && (
                <Panel title="My Orders">
                  {orders.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr><th>Date</th><th>Order</th><th>Total</th><th>Status</th><th>Paid</th><th>Items</th></tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <Fragment key={order._id}>
                              <tr>
                                <td className="text-nowrap">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                                <td>{order.orderNumber || order._id.slice(-8).toUpperCase()}</td>
                                <td>{formatCurrency(order.totalPrice)}</td>
                                <td><OrderStatusBadge status={order.orderStatus} /></td>
                                <td>{order.isPaid ? "Paid" : "Pending"}</td>
                                <td>
                                  <button
                                    className="button ghost small"
                                    onClick={() => setExpandedOrders((prev) => ({ ...prev, [order._id]: !prev[order._id] }))}
                                  >
                                    {expandedOrders[order._id] ? "Hide" : `View (${order.orderItems.length})`}
                                  </button>
                                </td>
                              </tr>
                              {expandedOrders[order._id] && (
                                <tr className="order-items-row">
                                  <td colSpan={6}>
                                    <div className="order-items-list">
                                      {order.orderItems.map((item, idx) => {
                                        const slug = item.product?.slug;
                                        const productLink = slug ? `/products/${slug}` : "#";
                                        return (
                                          <div className="order-item-line" key={idx}>
                                            <img src={item.image} alt={item.name} className="order-item-thumb" />
                                            <div className="order-item-info">
                                              <strong>{item.name}</strong>
                                              <span>Qty: {item.quantity} &times; {formatCurrency(item.price)}</span>
                                              {item.color && <span>Color: {item.color}</span>}
                                              {item.size && <span>Size: {item.size}</span>}
                                            </div>
                                            {order.orderStatus === "Delivered" && (
                                              <Link to={productLink} state={{ writeReview: true }} className="button secondary small">
                                                Write Review
                                              </Link>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">No Orders Yet.</div>
                  )}
                </Panel>
              )}
              {active === "wishlist" && (
                <Panel title="Wishlist">
                  <ProductGrid products={wishlist} />
                </Panel>
              )}
              {active === "addresses" && (
                <Panel title="Saved Addresses">
                  <AddressManager addresses={addresses} setAddresses={setAddresses} />
                </Panel>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false
};

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New Password and Confirm Password Do Not Match");
      return;
    }

    setLoading(true);
    try {
      await api.put("/users/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      toast.success("Password Updated Successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could Not Update Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="dashboard-form" onSubmit={submit}>
      <h2>Update Password</h2>
      <div className="form-grid">
        <input
          type="password"
          placeholder="Current Password"
          value={form.currentPassword}
          onChange={(event) => update("currentPassword", event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          value={form.newPassword}
          onChange={(event) => update("newPassword", event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={form.confirmPassword}
          onChange={(event) => update("confirmPassword", event.target.value)}
          required
        />
      </div>
      <button className="button primary" disabled={loading}>
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}

function AddressManager({ addresses, setAddresses }) {
  const [form, setForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setForm(emptyAddress);
    setEditingId("");
  };

  const save = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        name: form.fullName,
        line1: form.addressLine1,
        line2: form.addressLine2,
        pincode: form.postalCode
      };
      const { data } = editingId
        ? await api.put(`/users/addresses/${editingId}`, payload)
        : await api.post("/users/addresses", payload);
      setAddresses(data);
      toast.success(editingId ? "Address Updated Successfully" : "Address Saved Successfully");
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could Not Save Address");
    } finally {
      setLoading(false);
    }
  };

  const edit = (address) => {
    setEditingId(address._id);
    setForm({
      fullName: address.fullName || address.name || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || address.line1 || "",
      addressLine2: address.addressLine2 || address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || address.pincode || "",
      country: address.country || "India",
      isDefault: Boolean(address.isDefault)
    });
  };

  const remove = async (id) => {
    try {
      const { data } = await api.delete(`/users/addresses/${id}`);
      setAddresses(data);
      toast.success("Address Deleted Successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could Not Delete Address");
    }
  };

  const setDefault = async (address) => {
    try {
      const { data } = await api.put(`/users/addresses/${address._id}/default`);
      setAddresses(data);
      toast.success("Default Address Updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could Not Set Default Address");
    }
  };

  return (
    <div className="address-manager">
      <form className="dashboard-form" onSubmit={save}>
        <h2>{editingId ? "Edit Address" : "Add Address"}</h2>
        <div className="form-grid">
          <input placeholder="Full Name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required />
          <input placeholder="Phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} required />
          <input placeholder="Address Line 1" value={form.addressLine1} onChange={(event) => update("addressLine1", event.target.value)} required />
          <input placeholder="Address Line 2" value={form.addressLine2} onChange={(event) => update("addressLine2", event.target.value)} />
          <input placeholder="City" value={form.city} onChange={(event) => update("city", event.target.value)} required />
          <input placeholder="State" value={form.state} onChange={(event) => update("state", event.target.value)} required />
          <input placeholder="Pincode" value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} required />
          <input placeholder="Country" value={form.country} onChange={(event) => update("country", event.target.value)} required />
        </div>
        <label className="checkbox-line">
          <input type="checkbox" checked={form.isDefault} onChange={(event) => update("isDefault", event.target.checked)} />
          Set as Default Address
        </label>
        <div className="form-actions">
          <button className="button primary" disabled={loading}>
            {loading ? "Saving..." : "Save Address"}
          </button>
          {editingId && (
            <button className="button ghost" type="button" onClick={reset}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="address-grid">
        {addresses.length ? (
          addresses.map((address) => (
            <article className="address-card" key={address._id}>
              <div>
                <h3>{address.fullName || address.name}</h3>
                {address.isDefault && <span className="status-badge badge-success">Default</span>}
              </div>
              <p>{address.phone}</p>
              <p>{address.addressLine1 || address.line1}</p>
              {(address.addressLine2 || address.line2) && <p>{address.addressLine2 || address.line2}</p>}
              <p>
                {[address.city, address.state, address.postalCode || address.pincode, address.country].filter(Boolean).join(", ")}
              </p>
              <div className="address-actions">
                <button className="button ghost" type="button" onClick={() => edit(address)}>
                  Edit
                </button>
                <button className="button ghost" type="button" onClick={() => remove(address._id)}>
                  Delete
                </button>
                {!address.isDefault && (
                  <button className="button secondary" type="button" onClick={() => setDefault(address)}>
                    Set as Default
                  </button>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">No Saved Addresses Yet.</div>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="dashboard-panel">
      <h1>{title}</h1>
      {children}
    </section>
  );
}
