import { Helmet } from "react-helmet-async";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Award, PackageCheck, RefreshCcw, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import api from "../services/api.js";
import { categories as fallbackCategories, products as fallbackProducts } from "../data/fallbackCatalog.js";
import HeroSection from "../components/HeroSection.jsx";
import CategoryCard from "../components/CategoryCard.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import NetflixCarousel from "../components/NetflixCarousel.jsx";
import TestimonialCard from "../components/TestimonialCard.jsx";
import MagneticButton from "../components/MagneticButton.jsx";

export default function Home() {
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const seasonalRef = useRef(null);
  const [seasonalInView, setSeasonalInView] = useState(false);
  const trustRef = useRef(null);
  const [trustInView, setTrustInView] = useState(false);
  const testimonialRef = useRef(null);
  const [testimonialInView, setTestimonialInView] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/products?limit=12")])
      .then(([categoryRes, productRes]) => {
        setCategories(categoryRes.data.length ? categoryRes.data : fallbackCategories);
        setProducts(productRes.data.products?.length ? productRes.data.products : fallbackProducts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = seasonalRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSeasonalInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = trustRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTrustInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = testimonialRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTestimonialInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bestSellers = products.filter((product) => product.bestSeller).slice(0, 8);
  const newArrivals = [...products].slice(0, 8);

  return (
    <>
      <Helmet>
        <title>Elegant Home Decor | Premium Table Covers, Cushion Covers and Aprons</title>
        <meta name="description" content="Shop Premium Handcrafted Table Covers, Cushion Covers, Aprons, and Home Decor Essentials." />
      </Helmet>
      <HeroSection />
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow">Curated Categories</span>
          <h2>Textiles That Change the Room</h2>
          <Link to="/products">View All</Link>
        </div>
        <div className="category-grid">
          {categories.slice(0, 3).map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </section>
      <section className="band">
        <div className="container section">
          <NetflixCarousel
            products={bestSellers.length ? bestSellers : products.slice(0, 8)}
            title="Customer-Loved Finishing Touches"
            eyebrow="Best Sellers"
          />
        </div>
      </section>
      <section ref={seasonalRef} className={`container section split-offer${seasonalInView ? " visible" : ""}`}>
        <div className="seasonal-text-col">
          <span className="eyebrow seasonal-line" style={{ transitionDelay: "0s" }}>Seasonal Edit</span>
          <h2 className="seasonal-line" style={{ transitionDelay: "0.15s" }}>Host-Ready Dining Layers</h2>
          <p className="seasonal-line" style={{ transitionDelay: "0.3s" }}>
            Pair Runners, Table Covers, and Cushion Sets in Tonal Palettes for Festive Meals, Housewarmings, and Intimate
            Family Evenings.
          </p>
          <Link className="button primary seasonal-line" style={{ transitionDelay: "0.45s" }} to="/products?category=table-covers">
            Shop Dining Decor
          </Link>
        </div>
        <img className="seasonal-img" style={{ transitionDelay: "0.1s" }} src="https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1000&q=80" alt="Seasonal Dining Decor" />
      </section>
      <section className="container section">
        <NetflixCarousel
          products={newArrivals}
          title="Fresh Fabrics for Everyday Beauty"
          eyebrow="New Arrivals"
        />
      </section>
      <section ref={trustRef} className={`trust-band${trustInView ? " visible" : ""}`}>
        <div className="container trust-grid">
          {[
            [Award, "Craft-Led Quality", "Small-Batch Textiles With Premium Fabric Selection."],
            [PackageCheck, "Secure Shipping", "Carefully Packed Orders With Trackable Delivery."],
            [RefreshCcw, "Easy Returns", "Transparent Exchange and Return Support."],
            [ShieldCheck, "Secure Payments", "Protected Checkout Using Trusted Gateways."]
          ].map(([Icon, title, text], i) => (
            <div key={title} className="trust-item" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="trust-icon-wrap" style={{ transitionDelay: `${i * 0.15}s` }}>
                <Icon />
              </div>
              <h3 className="trust-line" style={{ transitionDelay: `${i * 0.15 + 0.1}s` }}>{title}</h3>
              <p className="trust-line" style={{ transitionDelay: `${i * 0.15 + 0.2}s` }}>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section ref={testimonialRef} className={`container section testimonials-section${testimonialInView ? " visible" : ""}`}>
        <div className="section-heading">
          <span className="eyebrow testimonial-heading-line" style={{ transitionDelay: "0s" }}>Testimonials</span>
          <h2 className="testimonial-heading-line" style={{ transitionDelay: "0.15s" }}>Warm Words From Styled Homes</h2>
        </div>
        <div className="testimonial-grid">
          <div className="testimonial-card-wrap" style={{ transitionDelay: "0.35s" }}>
            <TestimonialCard quote="The Cushion Covers Instantly Made Our Living Room Look Finished and Elegant." name="Ananya S." location="Bengaluru" />
          </div>
          <div className="testimonial-card-wrap" style={{ transitionDelay: "0.5s" }}>
            <TestimonialCard quote="Beautiful Fabric, Thoughtful Packaging, and the Table Cover Survived a Full Family Dinner." name="Meera K." location="Pune" />
          </div>
          <div className="testimonial-card-wrap" style={{ transitionDelay: "0.65s" }}>
            <TestimonialCard quote="The Apron Set Was a Perfect Gift. It Feels Premium Without Being Delicate." name="Rhea M." location="Jaipur" />
          </div>
        </div>
      </section>
      <Newsletter />
    </>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    try {
      const { data } = await api.post("/content/newsletter", { email });
      setMessage(data.message);
      setEmail("");
      setStatus("success");
    } catch {
      setMessage("We Could Not Subscribe This Email Right Now.");
      setStatus("error");
    }
  };
  return (
    <section className="newsletter">
      <div className="container newsletter-inner">
        <div>
          <span className="eyebrow">Product Care and Offers</span>
          <h2>Join the Home Styling Letter</h2>
        </div>
        <form onSubmit={submit}>
          <input type="email" placeholder="Email Address" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={status === "loading" || status === "success"} />
          <MagneticButton>
            <button className="button primary" disabled={status === "loading" || status === "success"} type="submit">
              {status === "loading" ? (
                <span className="btn-spinner" />
              ) : status === "success" ? (
                <motion.span
                  className="btn-checkmark"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 14 }}
                >
                  <CheckCircle2 size={18} />
                </motion.span>
              ) : (
                "Subscribe"
              )}
            </button>
          </MagneticButton>
          <AnimatePresence>
            {message && (
              <motion.small
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {status === "success" ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    {message}
                  </motion.span>
                ) : (
                  message
                )}
              </motion.small>
            )}
          </AnimatePresence>
        </form>
      </div>
    </section>
  );
}
