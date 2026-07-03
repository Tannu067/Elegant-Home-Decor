import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Award, PackageCheck, RefreshCcw, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../services/api.js";
import { categories as fallbackCategories, products as fallbackProducts } from "../data/fallbackCatalog.js";
import HeroSection from "../components/HeroSection.jsx";
import CategoryCard from "../components/CategoryCard.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import HorizontalScrollCarousel from "../components/HorizontalScrollCarousel.jsx";
import SlidingCarousel from "../components/SlidingCarousel.jsx";
import TestimonialCard from "../components/TestimonialCard.jsx";

export default function Home() {
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const seasonalRef = useRef(null);
  const [seasonalInView, setSeasonalInView] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/products?limit=8")])
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

  const bestSellers = products.filter((product) => product.bestSeller).slice(0, 4);
  const newArrivals = [...products].slice(0, 4);

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
          <HorizontalScrollCarousel
            products={bestSellers.length ? bestSellers : products.slice(0, 4)}
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
        <SlidingCarousel
          products={newArrivals}
          title="Fresh Fabrics for Everyday Beauty"
          eyebrow="New Arrivals"
        />
      </section>
      <section className="trust-band">
        <div className="container trust-grid">
          {[
            [Award, "Craft-Led Quality", "Small-Batch Textiles With Premium Fabric Selection."],
            [PackageCheck, "Secure Shipping", "Carefully Packed Orders With Trackable Delivery."],
            [RefreshCcw, "Easy Returns", "Transparent Exchange and Return Support."],
            [ShieldCheck, "Secure Payments", "Protected Checkout Using Trusted Gateways."]
          ].map(([Icon, title, text]) => (
            <div key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow">Testimonials</span>
          <h2>Warm Words From Styled Homes</h2>
        </div>
        <div className="testimonial-grid">
          <TestimonialCard quote="The Cushion Covers Instantly Made Our Living Room Look Finished and Elegant." name="Ananya S." location="Bengaluru" />
          <TestimonialCard quote="Beautiful Fabric, Thoughtful Packaging, and the Table Cover Survived a Full Family Dinner." name="Meera K." location="Pune" />
          <TestimonialCard quote="The Apron Set Was a Perfect Gift. It Feels Premium Without Being Delicate." name="Rhea M." location="Jaipur" />
        </div>
      </section>
      <Newsletter />
    </>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post("/content/newsletter", { email });
      setMessage(data.message);
      setEmail("");
    } catch {
      setMessage("We Could Not Subscribe This Email Right Now.");
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
          <input type="email" placeholder="Email Address" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <button className="button primary">Subscribe</button>
          {message && <small>{message}</small>}
        </form>
      </div>
    </section>
  );
}
