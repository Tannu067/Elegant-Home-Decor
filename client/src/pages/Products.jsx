import { Helmet } from "react-helmet-async";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import api from "../services/api.js";
import { categories as fallbackCategories, products as fallbackProducts } from "../data/fallbackCatalog.js";
import FilterSidebar from "../components/FilterSidebar.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import Loader from "../components/Loader.jsx";

const EYEBROW_BY_CATEGORY = {
  "table-covers": "Table Covers",
  "cushion-covers": "Cushion Covers",
  "aprons": "Aprons",
};

const HEADING_BY_CATEGORY = {
  "table-covers": "Premium Table Covers for Every Occasion",
  "cushion-covers": "Stylish Cushion Covers for Every Room",
  "aprons": "Artisan Aprons for Kitchen & Beyond",
};

function AnimatedWords({ text, baseDelay = 0, wordDelay = 0.07 }) {
  const words = text.split(" ");
  return words.map((word, i) => (
    <span
      key={`${word}-${i}`}
      className="word"
      style={{
        display: "inline-block",
        animation: `wordFadeSlideUp 0.45s ease-out both`,
        animationDelay: `${baseDelay + i * wordDelay}s`,
      }}
    >
      {word}{i < words.length - 1 ? "\u00A0" : ""}
    </span>
  ));
}

function PageHeroCollage({ products = [] }) {
  const allImages = useMemo(
    () => products.filter((p) => p.images?.length).flatMap((p) => p.images),
    [products],
  );
  const [offset, setOffset] = useState(0);

  const resetOffset = useCallback(() => setOffset(0), []);

  useEffect(() => {
    resetOffset();
    if (!allImages.length) return;
    const id = setInterval(() => {
      setOffset((prev) => (prev + 1) % allImages.length);
    }, 2800);
    return () => clearInterval(id);
  }, [allImages.length, resetOffset]);

  function pick(index) {
    if (!allImages.length) return { url: "", alt: "" };
    return allImages[(offset + index) % allImages.length];
  }

  return (
    <div className="page-hero-collage" aria-hidden="true">
      <div className="collage-row">
        {[0, 1, 2].map((i) => {
          const img = pick(i);
          const cls = i === 0 ? "collage-square-1" : i === 1 ? "collage-rectangle" : "collage-square-2";
          return (
            <div key={i} className={`collage-box ${cls}`}>
              <AnimatePresence>
                {img.url && (
                  <motion.div
                    key={img.url}
                    className="collage-img-wrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                  >
                    <img className="collage-img" src={img.url} alt={img.alt} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(Object.fromEntries(params.entries()));
  const [products, setProducts] = useState(fallbackProducts);
  const [categories, setCategories] = useState(fallbackCategories);
  const [loading, setLoading] = useState(true);

  const queryString = useMemo(() => new URLSearchParams(filters).toString(), [filters]);

  useEffect(() => {
    setFilters(Object.fromEntries(params.entries()));
  }, [params]);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/products?${queryString}`), api.get("/categories")])
      .then(([productRes, categoryRes]) => {
        setProducts(productRes.data.products || fallbackProducts);
        setCategories(categoryRes.data.length ? categoryRes.data : fallbackCategories);
      })
      .catch(() => {
        let local = [...fallbackProducts];
        if (filters.category) local = local.filter((product) => product.category?.slug === filters.category);
        if (filters.search) local = local.filter((product) => product.name.toLowerCase().includes(filters.search.toLowerCase()));
        setProducts(local);
      })
      .finally(() => setLoading(false));
  }, [queryString]);

  const updateFilters = (updater) => {
    const next = typeof updater === "function" ? updater(filters) : updater;
    Object.keys(next).forEach((key) => !next[key] && delete next[key]);
    setFilters(next);
    setParams(next);
  };

  return (
    <>
      <Helmet>
        <title>Shop Home Decor | Elegant Home Decor</title>
        <meta name="description" content="Browse Table Covers, Cushion Covers, Aprons, Kitchen Textiles, and Handcrafted Home Decor." />
      </Helmet>
      <section className="page-hero compact-hero">
        <div className="container page-hero-content">
          <div className="page-hero-text" key={filters.category || "all"}>
            {(() => {
              const eyebrow = EYEBROW_BY_CATEGORY[filters.category] || "Shop Collection";
              const heading = HEADING_BY_CATEGORY[filters.category] || "Premium Fabric Decor for Every Room";
              const eyebrowWords = eyebrow.split(" ").length;
              const headingStart = Math.max(0, (eyebrowWords - 1) * 0.07 + 0.45);
              return (
                <>
                  <span className="eyebrow"><AnimatedWords text={eyebrow} baseDelay={0} wordDelay={0.07} /></span>
                  <h1><AnimatedWords text={heading} baseDelay={headingStart} wordDelay={0.07} /></h1>
                </>
              );
            })()}
          </div>
          <PageHeroCollage category={filters.category} products={products} />
        </div>
      </section>
      <section className="container listing-layout">
        <div className="shop-filter-sidebar" style={{ animationDelay: "0.3s" }}>
          <FilterSidebar filters={filters} setFilters={updateFilters} categories={categories} />
        </div>
        <div className="listing-main">
          <div className="listing-toolbar">
            <select value={filters.sort || "newest"} onChange={(event) => updateFilters((current) => ({ ...current, sort: event.target.value }))}>
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="popularity">Popularity</option>
              <option value="rating">Rating</option>
            </select>
          </div>
          {loading ? <Loader label="Finding Products" /> : <ProductGrid products={products} />}
        </div>
      </section>
    </>
  );
}
