import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard.jsx";

export default function SlidingCarousel({ products, title, eyebrow = "New Arrivals" }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const dragRef = useRef({ dragging: false, startX: 0 });
  const gap = 22;

  const clearResumeTimer = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  const startResumeTimer = () => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 4000);
  };

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
    return () => {
      window.removeEventListener("resize", updateVisibleCount);
      clearResumeTimer();
    };
  }, [updateVisibleCount]);

  const totalSlides = products.length;
  const isInfinite = totalSlides > 1;
  const clonedCount = isInfinite ? visibleCount : 0;
  const extendedProducts = isInfinite ? [...products, ...products.slice(0, clonedCount)] : products;

  useEffect(() => {
    if (isPaused || !isInfinite) return;
    const id = setInterval(() => {
      setCurrent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isPaused, isInfinite, timerKey]);

  const handleTransitionEnd = () => {
    if (current >= totalSlides) {
      setNoTransition(true);
      setCurrent(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
    }
  };

  const vw = viewportRef.current?.offsetWidth || 0;
  const step = vw ? (vw - (visibleCount - 1) * gap) / visibleCount + gap : 0;

  const goTo = (dir) => {
    if (!isInfinite) return;
    setIsPaused(true);
    clearResumeTimer();
    setTimerKey((k) => k + 1);
    setCurrent((prev) => {
      let next = prev + dir;
      if (next < 0) next = totalSlides - 1;
      if (next >= totalSlides) next = 0;
      return next;
    });
    startResumeTimer();
  };

  const handleDragStart = (clientX) => {
    if (!isInfinite) return;
    dragRef.current = { dragging: true, startX: clientX };
    setIsPaused(true);
    clearResumeTimer();
  };

  const handleDragMove = (clientX) => {
    if (!dragRef.current.dragging) return;
    const diff = dragRef.current.startX - clientX;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? 1 : -1);
      dragRef.current.dragging = false;
    }
  };

  const handleDragEnd = () => {
    dragRef.current.dragging = false;
    startResumeTimer();
  };

  if (!products.length) return null;

  const dotIndex = current >= totalSlides ? 0 : current;

  return (
    <section onMouseEnter={() => { setIsPaused(true); clearResumeTimer(); }} onMouseLeave={() => { clearResumeTimer(); setIsPaused(false); }}>
      <div className="section-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="sliding-wrapper">
        {isInfinite && (
          <button className="scroll-arrow scroll-arrow-left" onClick={() => goTo(-1)} aria-label="Previous">
            <ChevronLeft size={22} />
          </button>
        )}
        <div
          className="sliding-viewport"
          ref={viewportRef}
          onMouseDown={(e) => handleDragStart(e.pageX)}
          onMouseMove={(e) => handleDragMove(e.pageX)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].pageX)}
          onTouchMove={(e) => handleDragMove(e.touches[0].pageX)}
          onTouchEnd={handleDragEnd}
        >
          <div
            ref={trackRef}
            className="sliding-track"
            style={{
              transform: step ? `translateX(-${current * step}px)` : "none",
              transition: noTransition ? "none" : "transform 0.6s ease-in-out"
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extendedProducts.map((product, i) => (
              <div key={`${product._id}-${i}`} className="sliding-item" data-visible={visibleCount}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
        {isInfinite && (
          <button className="scroll-arrow scroll-arrow-right" onClick={() => goTo(1)} aria-label="Next">
            <ChevronRight size={22} />
          </button>
        )}
      </div>
      {isInfinite && (
        <div className="slide-dots">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              className={`slide-dot${i === dotIndex ? " active" : ""}`}
              onClick={() => {
                if (!isInfinite) return;
                setIsPaused(true);
                clearResumeTimer();
                setTimerKey((k) => k + 1);
                setCurrent(i);
                startResumeTimer();
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
