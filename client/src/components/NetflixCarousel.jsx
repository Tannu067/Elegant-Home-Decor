import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard.jsx";

export default function NetflixCarousel({ products, title, eyebrow }) {
  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const posRef = useRef(0);
  const smoothTimerRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startPos: 0 });
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);

  const updateVisibleCount = useCallback(() => {
    const w = window.innerWidth;
    if (w <= 480) setVisibleCount(1);
    else if (w <= 720) setVisibleCount(2);
    else if (w <= 1050) setVisibleCount(3);
    else setVisibleCount(4);
  }, []);

  useEffect(() => {
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [updateVisibleCount]);

  const len = products.length;
  const shouldLoop = len >= visibleCount && len > 1;
  const items = shouldLoop ? [...products, ...products] : products;

  const cardStep = () => {
    const vp = trackRef.current?.parentElement;
    if (!vp || !len) return 0;
    return (vp.offsetWidth + 22) / visibleCount;
  };

  useEffect(() => {
    if (!shouldLoop || !len) return;
    const speed = 0.7;
    const tick = () => {
      const el = trackRef.current;
      if (el && !paused) {
        posRef.current -= speed;
        const half = el.scrollWidth / 2;
        if (Math.abs(posRef.current) >= half) posRef.current += half;
        el.style.transform = `translateX(${posRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [shouldLoop, len, paused]);

  const smoothTo = (target) => {
    const el = trackRef.current;
    if (!el) return;
    if (smoothTimerRef.current) clearTimeout(smoothTimerRef.current);
    posRef.current = target;
    el.style.transition = "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    el.style.transform = `translateX(${target}px)`;
    smoothTimerRef.current = setTimeout(() => {
      if (el) el.style.transition = "none";
    }, 500);
  };

  const goNext = () => {
    setPaused(true);
    const step = cardStep();
    if (step) smoothTo(posRef.current - step);
  };

  const goPrev = () => {
    setPaused(true);
    const step = cardStep();
    if (!step) return;
    const el = trackRef.current;
    if (!el) return;
    let target = posRef.current + step;
    if (target > 0) target = -(el.scrollWidth / 2 - step);
    smoothTo(target);
  };

  const onPointerDown = (x) => {
    dragRef.current = { active: true, startX: x, startPos: posRef.current };
    setPaused(true);
  };

  const onPointerMove = (x) => {
    if (!dragRef.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    posRef.current = dragRef.current.startPos + (x - dragRef.current.startX);
    el.style.transition = "none";
    el.style.transform = `translateX(${posRef.current}px)`;
  };

  const onPointerUp = () => {
    if (!dragRef.current.active) return;
    const moved = Math.abs(posRef.current - dragRef.current.startPos);
    dragRef.current.active = false;
    const step = cardStep();
    if (step > 0 && moved > 5) {
      const snapped = Math.round(posRef.current / step) * step;
      smoothTo(snapped);
    }
    setPaused(false);
  };

  if (!len) return null;

  return (
    <section
      className="netflix-carousel"
      onMouseEnter={() => { setPaused(true); setHovered(true); }}
      onMouseLeave={() => { setPaused(false); setHovered(false); }}
    >
      <div className="section-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="netflix-carousel-wrapper">
        {hovered && shouldLoop && (
          <button className="netflix-arrow netflix-arrow-left" onClick={goPrev} aria-label="Previous">
            <ChevronLeft size={28} />
          </button>
        )}
        <div
          className="netflix-viewport"
          onMouseDown={(e) => onPointerDown(e.pageX)}
          onMouseMove={(e) => onPointerMove(e.pageX)}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={(e) => onPointerDown(e.touches[0].pageX)}
          onTouchMove={(e) => onPointerMove(e.touches[0].pageX)}
          onTouchEnd={onPointerUp}
        >
          <div ref={trackRef} className="netflix-track">
            {items.map((product, i) => (
              <div key={`${product._id}-${i}`} className="netflix-item">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
        {hovered && shouldLoop && (
          <button className="netflix-arrow netflix-arrow-right" onClick={goNext} aria-label="Next">
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </section>
  );
}
