import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import GuestCheckout from "./pages/GuestCheckout.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyReturns from "./pages/MyReturns.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import FAQ from "./pages/FAQ.jsx";
import PolicyPage from "./pages/PolicyPage.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import NotFound from "./pages/NotFound.jsx";
import { FestiveThemeProvider } from "./context/FestiveThemeContext.jsx";

export default function App() {
  return (
    <FestiveThemeProvider>
      <Routes>
        <Route path="*" element={<SiteLayout />} />
      </Routes>
    </FestiveThemeProvider>
  );
}

function SiteLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/guest" element={<GuestCheckout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PolicyPage type="privacy" />} />
          <Route path="/terms" element={<PolicyPage type="terms" />} />
          <Route path="/return-refund-policy" element={<PolicyPage type="returns" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-returns" element={<MyReturns />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
