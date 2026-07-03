import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function CategoryCard({ category }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Link ref={ref} className={`category-card${visible ? " visible" : ""}`} to={`/products?category=${category.slug}`}>
      <img src={category.image} alt={category.name} />
      <div>
        <h3>{category.name}</h3>
        <p>{category.description}</p>
      </div>
    </Link>
  );
}
