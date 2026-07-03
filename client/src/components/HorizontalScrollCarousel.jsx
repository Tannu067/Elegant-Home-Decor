import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard.jsx";

export default function HorizontalScrollCarousel({ products, title, eyebrow = "Curated Selection" }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scroll: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollRef = useRef(null);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState]);

  useEffect(() => {
    if (isPaused || !products.length) {
      clearInterval(autoScrollRef.current);
      return;
    }
    autoScrollRef.current = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const cardWidth = el.querySelector(".scroll-carousel-item")?.offsetWidth || 300;
      const gap = 22;
      const scrollStep = cardWidth + gap;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - scrollStep) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: scrollStep, behavior: "smooth" });
      }
    }, 4000);
    return () => clearInterval(autoScrollRef.current);
  }, [isPaused, products.length]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(".scroll-carousel-item")?.offsetWidth || 300;
    const gap = 22;
    el.scrollBy({ left: dir * (cardWidth + gap), behavior: "smooth" });
  };

  const handleDragStart = (clientX) => {
    const el = trackRef.current;
    if (!el) return;
    setIsDragging(true);
    setDragStart({ x: clientX, scroll: el.scrollLeft });
  };

  const handleDragMove = (clientX) => {
    if (!isDragging) return;
    const el = trackRef.current;
    if (!el) return;
    const walk = (dragStart.x - clientX) * 1.8;
    el.scrollLeft = dragStart.scroll + walk;
  };

  const handleDragEnd = () => setIsDragging(false);

  const onMouseDown = (e) => { handleDragStart(e.pageX); setIsPaused(true); };
  const onMouseMove = (e) => handleDragMove(e.pageX);
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => { handleDragEnd(); setIsPaused(false); };

  const onTouchStart = (e) => { handleDragStart(e.touches[0].pageX); setIsPaused(true); };
  const onTouchMove = (e) => handleDragMove(e.touches[0].pageX);
  const onTouchEnd = () => { handleDragEnd(); setIsPaused(false); };

  if (!products.length) return null;

  return (
    <section>
      <div className="section-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="scroll-carousel-wrapper">
        {canScrollLeft && (
          <button className="scroll-arrow scroll-arrow-left" onClick={() => scroll(-1)} aria-label="Scroll left">
            <ChevronLeft size={22} />
          </button>
        )}
        <div
          ref={trackRef}
          className={`scroll-carousel-track${isDragging ? " is-dragging" : ""}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseEnter={() => setIsPaused(true)}
        >
          {products.map((product) => (
            <div key={product._id} className="scroll-carousel-item">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button className="scroll-arrow scroll-arrow-right" onClick={() => scroll(1)} aria-label="Scroll right">
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </section>
  );
}
