import { useEffect, useRef, useState } from "react";
import { useFestiveTheme } from "../context/FestiveThemeContext.jsx";
import api from "../services/api.js";

const FALLBACK_TEXT = "Free Shipping Over Rs. 2,500 | Handcrafted Fabric Decor for Everyday Elegance";

export default function TopBanner() {
  const { theme } = useFestiveTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);
  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const posRef = useRef(0);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    api.get("/announcements")
      .then(({ data }) => setAnnouncements(data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const hasFestiveBanner = theme?.topBannerText || theme?.topBannerImage;

  if (hasFestiveBanner) {
    return (
      <div className="top-strip festive-top-strip">
        {theme.topBannerText && <span>{theme.topBannerText}</span>}
      </div>
    );
  }

  const items = loaded && announcements.length > 0 ? announcements.map((a) => a.text) : [FALLBACK_TEXT];
  const displayText = items.join(" • ") + " • ";
  const texts = [displayText, displayText];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    posRef.current = 0;
    el.style.transform = "translateX(0px)";
    el.style.transition = "none";

    const speed = 0.5;
    let running = true;

    const tick = () => {
      if (!running) return;
      posRef.current -= speed;
      const half = el.scrollWidth / 2;
      if (Math.abs(posRef.current) >= half) posRef.current += half;
      el.style.transform = `translateX(${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [displayText]);

  return (
    <div className="top-strip announcement-bar">
      <div ref={trackRef} className="announcement-track">
        <span>{texts[0]}</span>
        <span>{texts[1]}</span>
      </div>
    </div>
  );
}
