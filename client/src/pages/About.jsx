import { Helmet } from "react-helmet-async";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
} from "framer-motion";
import { Award, Heart, Shield, Sparkles } from "lucide-react";

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

function AnimatedNumber({ to, suffix }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 40, damping: 12 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (isInView) mv.set(to);
  }, [isInView, to, mv]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      setDisplay(v >= 1 ? Math.floor(v).toLocaleString() : "0");
    });
    return () => unsub();
  }, [spring]);

  return (
    <span ref={ref} className="about-stat-number">
      {display}{suffix}
    </span>
  );
}

function StatItem({ icon: Icon, number, suffix, label, children }) {
  return (
    <motion.div
      className="about-stat-item"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="about-stat-icon"><Icon size={28} strokeWidth={1.5} /></div>
      {number != null ? <AnimatedNumber to={number} suffix={suffix} /> : null}
      <p className="about-stat-label">{label}</p>
      {children}
    </motion.div>
  );
}

const storyCards = [
  {
    icon: Heart,
    title: "Our Story",
    text: "Elegant Home Decor Was Born From a Simple Belief — That Everyday Textiles Should Feel Special. What Started as a Small Collection of Handpicked Table Covers Has Grown Into a Curated Range of Fabric Decor for Every Room.",
  },
  {
    icon: Sparkles,
    title: "Our Craftsmanship",
    text: "From Stitch Tension to Drape, Every Detail Is Reviewed by Hand. We Work With Skilled Artisans Who Treat Fabric With the Same Care That Goes Into a Well-Made Garment.",
  },
  {
    icon: Award,
    title: "Premium Materials",
    text: "We Source Cotton Jacquard, Linen Blends, and Washed Cottons That Get Softer Over Time. Every Fabric Is Selected for Comfort, Durability, and That Lived-in Luxe Feel.",
  },
  {
    icon: Shield,
    title: "Customer Satisfaction",
    text: "Your Home Deserves Textiles That Last. We Stand Behind Every Product With Transparent Sizing, Care Instructions, and a Return Process Designed to Be Effortless.",
  },
];

export default function About() {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const textRef = useRef(null);
  const textInView = useInView(textRef, { once: true, margin: "-80px" });

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollHorizontally = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 340, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        updateScrollState();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState]);

  const textContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  return (
    <>
      <Helmet>
        <title>About Us | Elegant Home Decor</title>
        <meta name="description" content="Discover Premium Handcrafted Table Covers, Cushion Covers, and Fabric Decor Thoughtfully Designed for Indian Homes." />
      </Helmet>

      <section className="about-hero">
        <motion.div className="about-hero-bg" style={{ y: bgY }} />
        <div className="about-hero-overlay" />
        <div className="container about-hero-content">
          <motion.span
            className="eyebrow"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Our Story
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            Fabric Decor With a Quiet Sense of Occasion
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          >
            Elegant Home Decor Creates Thoughtfully Designed Table Covers, Cushion Covers,
            Aprons, and Kitchen Textiles for Homes That Value Comfort, Craft, and Graceful
            Everyday Living.
          </motion.p>
        </div>
      </section>

      <section className="about-stats">
        <div className="container about-stats-grid">
          <StatItem icon={Award} number={5000} suffix="+" label="Happy Customers" />
          <StatItem icon={Sparkles} number={200} suffix="+" label="Unique Designs" />
          <StatItem icon={Heart} label="Premium Quality Fabrics" />
        </div>
      </section>

      <section className="about-scroll-section">
        <div className="container">
          <motion.div
            className="section-heading"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="eyebrow">Why Choose Us</span>
            <h2>Rooted in Quality, Crafted With Care</h2>
          </motion.div>
        </div>
        <div className="about-scroll-wrapper">
          {canScrollLeft && (
            <button className="about-scroll-arrow about-scroll-arrow-left" onClick={() => scrollHorizontally(-1)} aria-label="Scroll left">
              ←
            </button>
          )}
          <div ref={scrollRef} className="about-scroll-track">
            <div className="about-scroll-inner">
              {storyCards.map((card, i) => (
                <motion.div
                  key={card.title}
                  className="about-scroll-card"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                    delay: i * 0.1,
                  }}
                  whileHover={{ y: -8, boxShadow: "0 32px 64px rgba(65,50,32,0.18)" }}
                >
                  <div className="about-card-icon"><card.icon size={22} strokeWidth={1.5} /></div>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
          {canScrollRight && (
            <button className="about-scroll-arrow about-scroll-arrow-right" onClick={() => scrollHorizontally(1)} aria-label="Scroll right">
              →
            </button>
          )}
        </div>
      </section>

      <section ref={textRef} className="about-craft">
        <div className="container about-craft-grid">
          <motion.div
            className="about-craft-text"
            variants={textContainer}
            initial="hidden"
            animate={textInView ? "visible" : "hidden"}
          >
            <motion.span className="eyebrow" variants={staggerItem}>Our Philosophy</motion.span>
            <motion.h2 variants={staggerItem}>Textiles That Age Beautifully</motion.h2>
            <motion.p variants={staggerItem}>
              We Believe the Best Fabric Decor Feels as Good as It Looks. Our Collections Are
              Designed to Be Used, Washed, and Loved — Not Saved for Special Occasions.
            </motion.p>
            <motion.p variants={staggerItem}>
              From the First Stitch to the Final Press, Every Piece Is Made With Intention. We
              Choose Natural-Feel Fabrics, Thoughtful Construction, and Palettes That Settle
              Quietly Into Your Home.
            </motion.p>
          </motion.div>
          <div className="about-craft-images">
            <motion.img
              className="about-float-img about-float-img-1"
              src="https://res.cloudinary.com/djligggal/image/upload/v1782654298/nataliya-smirnova-H9mg9aDTdaQ-unsplash_nfhgus.jpg"
              alt="Table Cover Detail"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.03 }}
            />
            <motion.img
              className="about-float-img about-float-img-2"
              src="https://res.cloudinary.com/djligggal/image/upload/v1782654756/lucas-de-moura-b0kTwnDM1O0-unsplash_z0di7l.jpg"
              alt="Cushion Cover Detail"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              whileHover={{ scale: 1.03 }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
