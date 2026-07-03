import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api.js";
import CheckoutForm from "../components/CheckoutForm.jsx";
import StripeCheckoutForm from "../components/StripeCheckoutForm.jsx";
import { clearCart } from "../features/cartSlice.js";
import { formatCurrency, getImage } from "../utils/format.js";
import CheckoutProgress from "../components/CheckoutProgress.jsx";

export default function Checkout({ forceGuestMode = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { items, coupon } = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user);
  const [guestMode, setGuestMode] = useState(forceGuestMode || searchParams.get("guest") === "true");
  const [stripePayment, setStripePayment] = useState(null);
  const [guestInfo, setGuestInfo] = useState({ fullName: "", email: "", phone: "" });
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    paymentMethod: "Razorpay"
  });
  const subtotal = items.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const shipping = subtotal > 2500 ? 0 : 99;
  const discount = coupon ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + tax + shipping - discount;

  const checkoutItems = items.map((item) => ({
    product: item._id,
    name: item.name,
    quantity: item.quantity,
    image: getImage(item),
    price: item.discountPrice || item.price,
    color: item.color,
    size: item.size,
    fabric: item.fabric
  }));

  const updateGuestInfo = (key, value) => setGuestInfo((current) => ({ ...current, [key]: value }));

  const validateShippingAddress = () => {
    const requiredFields = [
      { key: "fullName", label: "Full Name" },
      { key: "phone", label: "Phone" },
      { key: "addressLine1", label: "Address Line 1" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "postalCode", label: "Postal Code" }
    ];
    const missing = requiredFields.filter((field) => !form[field.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return false;
    }
    // Format validation
    const phone = form.phone?.trim();
    if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      toast.error("Phone number must be 10 digits");
      return false;
    }
    const pincode = form.postalCode?.trim();
    if (pincode && !/^\d{6}$/.test(pincode)) {
      toast.error("Postal code must be a 6-digit number");
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    if (!items.length) return toast.error("Your Cart Is Empty");
    if (!validateShippingAddress()) return;
    try {
      const payload = {
        orderItems: checkoutItems,
        shippingAddress: form,
        paymentMethod: form.paymentMethod,
        couponCode: coupon?.code
      };
      console.log("[Checkout] COD Order Payload:", JSON.stringify(payload, null, 2));
      const { data } = await api.post("/orders", payload);
      console.log("[Checkout] Order created:", data);
      if (form.paymentMethod === "Stripe") {
        setStripePayment({
          amount: total,
          orderId: data._id,
          returnUrl: `/payment-success?orderId=${data._id}&paymentId=pending`
        });
        dispatch(clearCart());
        toast.success("Order Created. Complete Your Card Payment.");
        return;
      }
      dispatch(clearCart());
      navigate(`/payment-success?orderId=${data._id}&paymentId=${form.paymentMethod === "COD" ? "COD" : "pending"}`);
    } catch (error) {
      console.error("[Checkout] Order error:", error);
      toast.error(error.response?.data?.message || "Could Not Place Order");
    }
  };

  const placeGuestOrder = async () => {
    if (!items.length) return toast.error("Your Cart Is Empty");
    if (!guestInfo.fullName || !guestInfo.email || !guestInfo.phone || !form.addressLine1 || !form.city || !form.state || !form.postalCode) {
      toast.error("Please Complete Guest Checkout Details");
      return;
    }
    // Validate guest shipping address format
    const requiredFields = [
      { key: "addressLine1", label: "Address Line 1", value: form.addressLine1 },
      { key: "city", label: "City", value: form.city },
      { key: "state", label: "State", value: form.state },
      { key: "postalCode", label: "Postal Code", value: form.postalCode }
    ];
    const missing = requiredFields.filter((field) => !field.value?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    const pincode = form.postalCode?.trim();
    if (pincode && !/^\d{6}$/.test(pincode)) {
      toast.error("Postal code must be a 6-digit number");
      return;
    }
    const phone = guestInfo.phone?.trim();
    if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      toast.error("Phone number must be 10 digits");
      return;
    }
    const email = guestInfo.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      const payload = {
        orderItems: checkoutItems,
        guestInfo,
        shippingAddress: form,
        paymentMethod: form.paymentMethod,
        couponCode: coupon?.code
      };
      console.log("[Checkout] Guest COD Order Payload:", JSON.stringify(payload, null, 2));
      const { data } = await api.post("/orders/guest", payload);
      console.log("[Checkout] Guest Order response data:", data);
      console.log("[Checkout] Guest Order data keys:", Object.keys(data));
      if (form.paymentMethod === "Stripe") {
        setStripePayment({
          amount: total,
          orderId: data._id,
          returnUrl: `/payment-success?orderId=${data.orderNumber}&email=${encodeURIComponent(guestInfo.email)}&guest=true&paymentId=pending`
        });
        dispatch(clearCart());
        toast.success("Guest Order Created. Complete Your Card Payment.");
        return;
      }
      dispatch(clearCart());
      toast.success("Guest Order Placed Successfully");
      navigate(`/payment-success?orderId=${data.orderNumber}&email=${encodeURIComponent(guestInfo.email)}&guest=true`);
    } catch (error) {
      console.error("[Checkout] Guest Order error:", error);
      toast.error(error.response?.data?.message || "Could Not Place Guest Order");
    }
  };

  if (!user && !guestMode) {
    return (
      <>
        <Helmet>
          <title>Checkout | Elegant Home Decor</title>
        </Helmet>
        <section className="container success-page">
          <CheckoutProgress currentStep={1} />
          <span className="eyebrow">Checkout Options</span>
          <h1>Choose How to Checkout</h1>
          <Link className="button primary" to="/login" onClick={() => localStorage.setItem("redirectAfterLogin", "/checkout")}>
            Login
          </Link>
          <button className="button secondary" onClick={() => {
            setGuestMode(true);
            navigate("/checkout/guest");
          }}>
            Continue as Guest
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout | Elegant Home Decor</title>
      </Helmet>
      <section className="container page-layout">
        <div className="checkout-form">
          <CheckoutProgress currentStep={1} />
          {guestMode && !user && (
            <div className="guest-checkout-form">
              <h2>Guest Details</h2>
              <div className="form-grid">
                <input placeholder="Full Name" value={guestInfo.fullName} onChange={(event) => updateGuestInfo("fullName", event.target.value)} />
                <input type="email" placeholder="Email Address" value={guestInfo.email} onChange={(event) => updateGuestInfo("email", event.target.value)} />
                <input placeholder="Phone Number" value={guestInfo.phone} onChange={(event) => updateGuestInfo("phone", event.target.value)} />
              </div>
            </div>
          )}
          <CheckoutForm form={form} setForm={setForm} />
        </div>
        <aside className="summary-card">
          <h2>Order Summary</h2>
          {items.map((item) => (
            <div className="mini-line" key={item.cartId}>
              <span>{item.name} x {item.quantity}</span>
              <strong>{formatCurrency((item.discountPrice || item.price) * item.quantity)}</strong>
            </div>
          ))}
          <p><span>Tax</span><strong>{formatCurrency(tax)}</strong></p>
          <p><span>Shipping</span><strong>{shipping ? formatCurrency(shipping) : "Free"}</strong></p>
          <p className="total"><span>Total</span><strong>{formatCurrency(total)}</strong></p>
          {stripePayment ? (
            <StripeCheckoutForm
              amount={stripePayment.amount}
              orderId={stripePayment.orderId}
              returnUrl={stripePayment.returnUrl}
            />
          ) : guestMode && !user ? (
            <button className="button primary full" onClick={placeGuestOrder}>
              Place Guest Order
            </button>
          ) : (
            <button className="button primary full" onClick={placeOrder}>
              Place Order
            </button>
          )}
        </aside>
      </section>
    </>
  );
}
