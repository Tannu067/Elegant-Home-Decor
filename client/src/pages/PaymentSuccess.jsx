import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo } from "react";
import CheckoutProgress from "../components/CheckoutProgress.jsx";

const CONFETTI_COLORS = ["#bd9359", "#7a9c7a", "#c17a5e", "#fbbf24", "#f472b6", "#818cf8"];

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 5 + Math.random() * 9,
      rotation: Math.random() * 720 - 360,
      delay: Math.random() * 0.6,
      duration: 2 + Math.random() * 2,
      isCircle: Math.random() > 0.5,
    })),
  []);

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.isCircle ? p.size : p.size * 0.5,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : "2px",
          }}
          initial={{ y: -20, rotate: 0, opacity: 0 }}
          animate={{
            y: "110vh",
            rotate: p.rotation,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
            opacity: { times: [0, 0.05, 0.7, 1], duration: p.duration, delay: p.delay },
          }}
        />
      ))}
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 1.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function PaymentSuccess() {
  const [params] = useSearchParams();

  return (
    <>
      <Helmet>
        <title>Order Confirmed | Elegant Home Decor</title>
      </Helmet>
      <Confetti />
      <section className="container success-page">
        <CheckoutProgress currentStep={3} />
        <motion.svg
          viewBox="0 0 64 64"
          className="success-checkmark"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.path
            d="M32 4a28 28 0 1 1 0 56 28 28 0 0 1 0-56z"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M20 32l8 8 16-16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.5, ease: "easeInOut" }}
          />
        </motion.svg>
        <motion.div
          className="success-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.span className="eyebrow" variants={itemVariants}>
            Payment Success
          </motion.span>
          <motion.h1 variants={itemVariants}>
            Thank You for Your Order
          </motion.h1>
          <motion.p className="success-message" variants={itemVariants}>
            Your Order Has Been Confirmed and Will Be Shipped Shortly.
          </motion.p>
          <motion.p variants={itemVariants}>
            Order ID: {params.get("orderId") || "EHD-ORDER"}
          </motion.p>
          <motion.p variants={itemVariants}>
            Payment ID: {params.get("paymentId") || "Processing"}
          </motion.p>
          {params.get("guest") === "true" && (
            <motion.p variants={itemVariants}>
              Track This Order With Your Order ID and Email Address.
            </motion.p>
          )}
          <motion.p variants={itemVariants}>
            Estimated Delivery: 4-7 Business Days
          </motion.p>
          <motion.div variants={itemVariants} className="success-actions">
            <Link className="button primary" to="/products">
              Continue Shopping
            </Link>
            {params.get("guest") === "true" && (
              <Link className="button secondary" to={`/track-order?orderId=${params.get("orderId") || ""}`}>
                Track Order
              </Link>
            )}
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
