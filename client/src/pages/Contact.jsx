import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useState } from "react";
import api from "../services/api.js";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const formVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.5 },
  },
};

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post("/content/contact", form);
      setMessage(data.message);
      setForm({ name: "", email: "", message: "" });
      setSubmitted(true);
    } catch {
      setMessage("Unable to Send Message Right Now.");
      setSubmitted(true);
    }
  };

  return (
    <>
      <Helmet><title>Contact Us | Elegant Home Decor</title></Helmet>
      <section className="container contact-layout">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.span className="eyebrow" variants={itemVariants}>Contact Us</motion.span>
          <motion.h1 variants={itemVariants}>We Are Here to Help Style Your Home</motion.h1>
          <motion.p variants={itemVariants}>Email: hello@eleganthomedecor.com</motion.p>
          <motion.p variants={itemVariants}>Phone: +91 90000 00000</motion.p>
          <motion.p variants={itemVariants}>Address: Jaipur, Rajasthan, India</motion.p>
          <motion.p variants={itemVariants}>Instagram: @eleganthomedecor</motion.p>
        </motion.div>
        <motion.form
          className="contact-form"
          onSubmit={submit}
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="floating-input" variants={formVariants}>
            <input
              id="contact-name"
              placeholder=" "
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
            <label htmlFor="contact-name">Name</label>
          </motion.div>
          <motion.div className="floating-input" variants={formVariants}>
            <input
              id="contact-email"
              type="email"
              placeholder=" "
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              required
            />
            <label htmlFor="contact-email">Email</label>
          </motion.div>
          <motion.div className="floating-input" variants={formVariants}>
            <textarea
              id="contact-message"
              rows="5"
              placeholder=" "
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              required
            />
            <label htmlFor="contact-message">Message</label>
          </motion.div>
          <motion.button className="button primary" variants={formVariants}>
            Send Message
          </motion.button>
          {submitted && (
            <motion.small
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {message}
            </motion.small>
          )}
        </motion.form>
      </section>
    </>
  );
}
