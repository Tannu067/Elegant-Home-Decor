import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, MapPin, ShoppingBag } from "lucide-react";

const steps = [
  { label: "Cart", icon: ShoppingBag },
  { label: "Shipping", icon: MapPin },
  { label: "Payment", icon: CreditCard },
  { label: "Success", icon: CheckCircle2 },
];

export default function CheckoutProgress({ currentStep }) {
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="checkout-progress">
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </div>
      <div className="progress-steps">
        {steps.map((step, i) => {
          const status = i < currentStep ? "done" : i === currentStep ? "active" : "pending";
          return (
            <div key={step.label} className={`progress-step ${status}`}>
              <motion.div
                className="step-circle"
                initial={false}
                animate={{
                  scale: status === "active" ? 1.12 : 1,
                  backgroundColor: status !== "pending" ? "var(--primary-color)" : "var(--line)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {status === "done" ? <CheckCircle2 size={16} /> : <step.icon size={16} />}
              </motion.div>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
