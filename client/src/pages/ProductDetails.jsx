import { Helmet } from "react-helmet-async";
import { BadgeCheck, Minus, Plus, ShoppingBag, Star, Truck, MessageSquare, Ruler, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import api from "../services/api.js";
import { products as fallbackProducts } from "../data/fallbackCatalog.js";
import { addToCart } from "../features/cartSlice.js";
import ProductGrid from "../components/ProductGrid.jsx";
import LikeButton from "../components/LikeButton.jsx";
import { discountPercent, formatCurrency, getImage } from "../utils/format.js";

const LOW_STOCK_THRESHOLD = 5;

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [product, setProduct] = useState(fallbackProducts.find((item) => item.slug === slug) || fallbackProducts[0]);
  const [selectedImage, setSelectedImage] = useState("");
  const [options, setOptions] = useState({ quantity: 1, color: "", size: "" });
  const [reviews, setReviews] = useState([]);
  const [ratings, setRatings] = useState(0);
  const [numReviews, setNumReviews] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", review: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sizeChart, setSizeChart] = useState(null);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const loadReviews = useCallback((productId) => {
    api.get(`/reviews/product/${productId}`).then(({ data }) => {
      setReviews(data.reviews);
      setRatings(data.ratings);
      setNumReviews(data.numReviews);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data);
        loadReviews(data._id);
        if (user) {
          api.get(`/reviews/check-purchase/${data._id}`).then(({ data: check }) => {
            setCanReview(check.canReview);
            setHasReviewed(check.hasReviewed);
          }).catch(() => {});
        }
      })
      .catch(() => {
        const fallback = fallbackProducts.find((item) => item.slug === slug) || fallbackProducts[0];
        setProduct(fallback);
        loadReviews(fallback._id);
      });
  }, [slug, user, loadReviews]);

  useEffect(() => {
    const catId = product.category?._id || product.category;
    if (!catId) return;
    api.get(`/size-charts/category/${catId}`).then(({ data }) => {
      setSizeChart(data);
    }).catch(() => {
      setSizeChart(null);
    });
  }, [product.category]);

  useEffect(() => {
    if (location.state?.writeReview && user) {
      setShowForm(true);
      window.history.replaceState({}, "");
    }
  }, [slug, user, loadReviews, location.state?.writeReview]);

  useEffect(() => {
    setSelectedImage(getImage(product));
    setOptions({ quantity: 1, color: product.colors?.[0] || "", size: product.sizes?.[0] || "" });
  }, [product]);

  const related = useMemo(
    () => fallbackProducts.filter((item) => item.category?.slug === product.category?.slug && item.slug !== product.slug).slice(0, 4),
    [product]
  );

  const add = () => {
    dispatch(
      addToCart({
        ...product,
        ...options,
        fabric: product.fabric,
        cartId: `${product._id}-${Date.now()}`
      })
    );
    toast.success("Added to Cart");
  };

  const buyNow = () => {
    dispatch(
      addToCart({
        ...product,
        ...options,
        fabric: product.fabric,
        cartId: `${product._id}-${Date.now()}`
      })
    );
    toast.success("Added to Cart");
    navigate("/checkout");
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!form.review.trim()) return toast.error("Please write a review message");
    setSubmitting(true);
    try {
      await api.post("/reviews", { productId: product._id, ...form });
      toast.success("Thank you for your review. It will be visible after admin approval.");
      setShowForm(false);
      setForm({ rating: 5, title: "", review: "" });
      setHasReviewed(true);
      setCanReview(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, size = 16) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={size} fill={i < Math.round(rating) ? "currentColor" : "none"} color="currentColor" />
    ));
  };

  const hasApprovedReviews = numReviews > 0;

  return (
    <>
      <Helmet>
        <title>{product.name} | Elegant Home Decor</title>
        <meta name="description" content={product.description} />
      </Helmet>
      <section className="container product-detail">
        <div className="gallery">
          <div className="zoom-frame">
            <img src={selectedImage} alt={product.name} />
          </div>
          <div className="thumb-row">
            {product.images?.map((image) => (
              <button key={image.url} onClick={() => setSelectedImage(image.url)} className={selectedImage === image.url ? "active" : ""}>
                <img src={image.url} alt={image.alt || product.name} />
              </button>
            ))}
          </div>
        </div>
        <div className="product-info">
          <Link to={`/products?category=${product.category?.slug}`} className="eyebrow">
            {product.category?.name}
          </Link>
          <h1>{product.name}</h1>
          {hasApprovedReviews && (
            <div className="rating large">
              {renderStars(ratings, 18)}
              <span>{ratings.toFixed(1)} Rating From {numReviews} Reviews</span>
            </div>
          )}
          <div className="price-row detail-price">
            <strong>{formatCurrency(product.discountPrice || product.price)}</strong>
            {product.discountPrice && <span>{formatCurrency(product.price)}</span>}
            {discountPercent(product.price, product.discountPrice) > 0 && <em>{discountPercent(product.price, product.discountPrice)}% Off</em>}
          </div>
          <p>{product.description}</p>
          <div className="option-group">
            <span>Color</span>
            <div className="pills">
              {product.colors?.map((color) => (
                <button key={color} className={options.color === color ? "active" : ""} onClick={() => setOptions((current) => ({ ...current, color }))}>
                  {color}
                </button>
              ))}
            </div>
          </div>
          <div className="option-group">
            <span>Size</span>
            <div className="pills">
              {product.sizes?.map((size) => (
                <button key={size} className={options.size === size ? "active" : ""} onClick={() => setOptions((current) => ({ ...current, size }))}>
                  {size}
                </button>
              ))}
            </div>
            {sizeChart && (
              <button className="size-guide-btn" type="button" onClick={() => setShowSizeChart(true)}>
                <Ruler size={16} />
                Size Guide
              </button>
            )}
          </div>
          <div className="detail-list">
            <p><strong>Fabric:</strong> {product.fabric}</p>
            <p><strong>Care:</strong> {product.care}</p>
            <p><strong>Availability:</strong> {product.stock > 0 ? `${product.stock} in Stock` : "Out of Stock"}</p>
            {product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD && (
              <p className="low-stock-note">Only {product.stock} left!</p>
            )}
          </div>
          <div className="quantity-control">
            <button onClick={() => setOptions((current) => ({ ...current, quantity: Math.max(1, current.quantity - 1) }))}>
              <Minus size={16} />
            </button>
            <span>{options.quantity}</span>
            <button onClick={() => setOptions((current) => ({ ...current, quantity: Math.min(product.stock || 1, current.quantity + 1) }))}>
              <Plus size={16} />
            </button>
          </div>
          <div className="detail-actions">
            <button className="button primary" disabled={product.stock === 0} onClick={add}>
              <ShoppingBag size={18} />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
            <button className="button secondary" disabled={product.stock === 0} onClick={buyNow}>
              {product.stock === 0 ? "Out of Stock" : "Buy Now"}
            </button>
            <LikeButton
              product={product}
              onChange={({ likesCount }) => setProduct((current) => ({ ...current, likesCount }))}
            />
          </div>
          <div className="delivery-note">
            <Truck size={18} />
            Estimated Delivery in 4-7 Business Days.
          </div>
        </div>
      </section>

      <section className="container section reviews-section">
        <div className="section-heading">
          <span className="eyebrow">Customer Feedback</span>
          <h2>Reviews and Ratings</h2>
        </div>

        {hasApprovedReviews && (
          <div className="reviews-summary">
            <div className="reviews-average">
              <span className="average-rating">{ratings}</span>
              <div className="average-stars">{renderStars(ratings, 22)}</div>
              <span className="average-count">{numReviews} Verified {numReviews === 1 ? "Review" : "Reviews"}</span>
            </div>
          </div>
        )}

        {user && canReview && !showForm && (
          <button className="button primary write-review-btn" onClick={() => setShowForm(true)}>
            <MessageSquare size={18} />
            Write a Review
          </button>
        )}

        {user && hasReviewed && !showForm && (
          <p className="reviewed-notice">You have already reviewed this product. Your review is pending admin approval.</p>
        )}

        {!user && (
          <p className="reviewed-notice">
            <Link to="/login">Login</Link> to write a review for products you have purchased.
          </p>
        )}

        {showForm && (
          <form className="review-form" onSubmit={submitReview}>
            <h3>Write Your Review</h3>
            <div className="form-field">
              <label>Customer Name</label>
              <input value={user?.name || ""} disabled />
            </div>
            <div className="form-field">
              <label>Rating</label>
              <div className="star-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setForm((f) => ({ ...f, rating: star }))}>
                    <Star size={28} fill={star <= form.rating ? "currentColor" : "none"} color="currentColor" />
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label>Review Title (optional)</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Summarize your experience" />
            </div>
            <div className="form-field">
              <label>Review Message</label>
              <textarea rows={4} value={form.review} onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))} placeholder="Share your thoughts about this product" required />
            </div>
            <div className="form-field">
              <label>Date of Review</label>
              <input value={new Date().toLocaleDateString()} disabled />
            </div>
            <div className="button-row">
              <button className="button primary" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
              <button className="button ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        {!hasApprovedReviews && reviews.length === 0 && !showForm && (
          <div className="no-reviews-block">
            <Star size={40} className="no-reviews-icon" />
            <h3>No Reviews Yet</h3>
            <p>Be the first to review this product and share your experience with others.</p>
          </div>
        )}

        {hasApprovedReviews && (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div className="review-card" key={review._id}>
                <div className="review-header">
                  <div className="reviewer-info">
                    <strong className="reviewer-name">{review.name}</strong>
                    {review.verifiedPurchase && (
                      <span className="verified-badge">
                        <BadgeCheck size={14} />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="review-date">{new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="review-stars-row">
                  <div className="review-stars">{renderStars(review.rating)}</div>
                  <span className="review-rating-text">{review.rating}/5</span>
                </div>
                {review.title && <strong className="review-title">{review.title}</strong>}
                <p>{review.review}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {showSizeChart && sizeChart && (
        <div className="modal-overlay" onClick={() => setShowSizeChart(false)}>
          <div className="modal-content size-chart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{sizeChart.title || `${sizeChart.category?.name || "Size"} Guide`}</h2>
              <button className="icon-button" onClick={() => setShowSizeChart(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              {sizeChart.chartImage ? (
                <img src={sizeChart.chartImage} alt="Size Chart" className="size-chart-image" />
              ) : (
                <div className="table-wrap">
                  <table className="size-chart-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Width</th>
                        <th>Length</th>
                        {sizeChart.rows.some((r) => r.height) && <th>Height</th>}
                        {sizeChart.rows.some((r) => r.notes) && <th>Notes</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {sizeChart.rows.map((row, idx) => (
                        <tr key={idx}>
                          <td><strong>{row.sizeLabel}</strong></td>
                          <td>{row.width}{row.width && " in"}</td>
                          <td>{row.length}{row.length && " in"}</td>
                          {sizeChart.rows.some((r) => r.height) && <td>{row.height}{row.height && " in"}</td>}
                          {sizeChart.rows.some((r) => r.notes) && <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{row.notes || "-"}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="container section">
        <div className="section-heading">
          <span className="eyebrow">Related Products</span>
          <h2>Complete the Look</h2>
        </div>
        <ProductGrid products={related.length ? related : fallbackProducts.slice(0, 4)} />
      </section>
    </>
  );
}
