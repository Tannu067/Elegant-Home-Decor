import { useEffect, useRef, useState } from "react";
import { useFestiveTheme } from "../context/FestiveThemeContext.jsx";
import api from "../services/api.js";

const FALLBACK_TEXT = "Free Shipping Over Rs. 2,500 | Handcrafted Fabric Decor for Everyday Elegance";

export default function TopBanner() {
  const { theme } = useFestiveTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);

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

  return (
    <div className="top-strip announcement-bar">
      <div className="announcement-track">
        <span>{displayText}</span>
        <span>{displayText}</span>
      </div>
    </div>
  );
}
