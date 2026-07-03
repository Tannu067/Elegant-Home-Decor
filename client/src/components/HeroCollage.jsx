import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const IMG = {
  tableCovers: [
    { src: "https://res.cloudinary.com/djligggal/image/upload/v1782654298/nataliya-smirnova-H9mg9aDTdaQ-unsplash_nfhgus.jpg", alt: "Ivory Table Cover" },
    { src: "https://res.cloudinary.com/djligggal/image/upload/v1782654653/ed-inal-Q3XVJVyJ6Y4-unsplash_phzg0h.jpg", alt: "Jacquard Fabric Texture" },
    { src: "https://res.cloudinary.com/djligggal/image/upload/v1782655229/bruno-ngarukiye-ZsmSKZOF_SA-unsplash_j9tsj7.jpg", alt: "Gold Table Runner" },
  ],
  cushionCovers: [
    { src: "https://res.cloudinary.com/djligggal/image/upload/v1782654756/lucas-de-moura-b0kTwnDM1O0-unsplash_z0di7l.jpg", alt: "Sage Cushion Covers" },
    { src: "https://res.cloudinary.com/djligggal/image/upload/v1782654902/mariah-krafft--qOa0YYfdGo-unsplash_koitma.jpg", alt: "Decorative Cushion Covers" },
  ],
  aprons: [
    { src: "https://res.cloudinary.com/djligggal/image/upload/v1782655012/golden-horn-bridge-dOQeGVGNmpk-unsplash_qpgwe1.jpg", alt: "Linen Apron Flat Lay" },
    { src: "https://res.cloudinary.com/djligggal/image/upload/v1782655118/golden-horn-bridge-R_00GMyo2CE-unsplash_ynj6ji.jpg", alt: "Person Wearing Apron" },
  ],
};

const CARDS = [
  { id: "table-cover", pool: IMG.tableCovers, depth: 1 },
  { id: "cushion-cover", pool: IMG.cushionCovers, depth: 1.5 },
  { id: "apron", pool: IMG.aprons, depth: 0.6 },
];

const SLOT_STYLES = [
  { top: "14%", left: "16%", width: "58%", aspectRatio: "3 / 4", zIndex: 2, borderRadius: 20, floatDuration: 5, floatDelay: 0 },
  { top: "2%", left: "56%", width: "40%", aspectRatio: "4 / 5", zIndex: 3, borderRadius: 16, floatDuration: 4.2, floatDelay: 0.7 },
  { top: "64%", left: "2%", width: "32%", aspectRatio: "1 / 1", zIndex: 1, borderRadius: 14, floatDuration: 3.4, floatDelay: 1.4 },
];

const ROTATE_MS = 2500;

function nextIndex(current, pool) {
  if (pool.length <= 1) return 0;
  let next = (current + 1) % pool.length;
  if (next === current) next = (next + 1) % pool.length;
  return next;
}

function KenBurnsImage({ image }) {
  return (
    <motion.div
      className="hero-collage-ken-burns-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <img
        src={image.src}
        alt={image.alt}
        className="hero-collage-ken-burns-img"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </motion.div>
  );
}

export default function HeroCollage() {
  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef(null);
  const hoverRef = useRef(false);
  const [alive, setAlive] = useState(true);
  const [imgIdx, setImgIdx] = useState([0, 0, 0]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 25 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 25 });

  const tx1 = useTransform(smoothX, (v) => v * 1);
  const ty1 = useTransform(smoothY, (v) => v * 1);
  const tx2 = useTransform(smoothX, (v) => v * 1.5);
  const ty2 = useTransform(smoothY, (v) => v * 1.5);
  const tx3 = useTransform(smoothX, (v) => v * 0.6);
  const ty3 = useTransform(smoothY, (v) => v * 0.6);
  const cardTx = [{ x: tx1, y: ty1 }, { x: tx2, y: ty2 }, { x: tx3, y: ty3 }];

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768 || "ontouchstart" in window;
    if (isMobile) return;

    const handleMouse = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      mouseX.set(dx * 24);
      mouseY.set(dy * 24);
    };

    const handleLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    el.addEventListener("mousemove", handleMouse);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouse);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (prefersReducedMotion || !alive) return;
    const timer = setInterval(() => {
      setImgIdx((prev) => prev.map((idx, i) => nextIndex(idx, CARDS[i].pool)));
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, alive]);

  return (
    <div
      className="hero-float-stage"
      ref={stageRef}
      aria-hidden="true"
      onMouseEnter={() => { hoverRef.current = true; setAlive(false); }}
      onMouseLeave={() => { hoverRef.current = false; setAlive(true); }}
    >
      {CARDS.map((card, slotIdx) => {
        const slot = SLOT_STYLES[slotIdx];
        const image = card.pool[imgIdx[slotIdx]];

        return (
          <motion.div
            key={slotIdx}
            className={`hero-collage-card${slotIdx === 0 ? " hero-collage-card--featured" : ""}`}
            style={{
              position: "absolute",
              top: slot.top,
              left: slot.left,
              width: slot.width,
              aspectRatio: slot.aspectRatio,
              zIndex: slot.zIndex,
              borderRadius: slot.borderRadius,
            }}
          >
            <div
              className="hero-collage-card-float"
              style={{
                width: "100%",
                height: "100%",
                animationName: prefersReducedMotion ? "none" : "cardFloat",
                animationDuration: `${slot.floatDuration}s`,
                animationDelay: `${slot.floatDelay}s`,
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
              }}
            >
              <motion.div
                className="hero-collage-card-parallax"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: slot.borderRadius,
                  x: cardTx[slotIdx].x,
                  y: cardTx[slotIdx].y,
                }}
                whileHover={{ scale: 1.04 }}
              >
                <div className="hero-collage-card-inner" style={{ borderRadius: slot.borderRadius }}>
                  <AnimatePresence mode="wait">
                    <KenBurnsImage key={image.src} image={image} />
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
