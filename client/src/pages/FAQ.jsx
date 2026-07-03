import { Helmet } from "react-helmet-async";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const faqs = [
  ["How Long Does Shipping Take?", "Most Orders Are Dispatched in 1-2 Business Days and Delivered Within 4-7 Business Days."],
  ["What Is Your Return Policy?", "Unused Products in Original Condition Can Be Returned or Exchanged Within 7 Days of Delivery."],
  ["Which Payment Methods Are Supported?", "The Backend Supports Razorpay, Stripe, and Cash on Delivery Order Capture."],
  ["How Should I Care for Fabric Products?", "Use Mild Detergent, Wash Dark Colors Separately, and Dry in Shade Unless a Product Recommends Dry Cleaning."]
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  const toggle = (index) => setOpen(open === index ? null : index);

  return (
    <>
      <Helmet><title>FAQ | Elegant Home Decor</title></Helmet>
      <section className="container faq-page">
        <span className="eyebrow">Help Center</span>
        <h1>Frequently Asked Questions</h1>
        <div className="faq-list">
          {faqs.map(([question, answer], i) => (
            <motion.div
              key={i}
              layout
              className="faq-item"
              onClick={() => toggle(i)}
            >
              <div className="faq-question">
                <span>{question}</span>
                <motion.span
                  className="faq-chevron"
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <ChevronDown size={18} />
                </motion.span>
              </div>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="answer"
                    initial={{ opacity: 0, translateY: -6 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{ opacity: 0, translateY: -6 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <p className="faq-answer">{answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
