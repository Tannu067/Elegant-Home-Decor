import { ShoppingBag, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { addToCart } from "../features/cartSlice.js";
import LikeButton from "./LikeButton.jsx";
import { discountPercent, formatCurrency, getImage } from "../utils/format.js";

const LOW_STOCK_THRESHOLD = 5;

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const discounted = product.discountPrice || product.price;

  const buyNow = () => {
    dispatch(
      addToCart({
        ...product,
        quantity: 1,
        cartId: `${product._id}-${Date.now()}`,
        color: product.colors?.[0],
        size: product.sizes?.[0],
        fabric: product.fabric
      })
    );
    toast.success("Added to Cart");
    navigate("/checkout");
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-image">
        <img src={getImage(product)} alt={product.name} />
        <div className="badges">
          {product.bestSeller && <span>Best Seller</span>}
          {product.stock <= LOW_STOCK_THRESHOLD && product.stock > 0 && <span>Low Stock</span>}
          {product.stock === 0 && <span>Out of Stock</span>}
        </div>
      </Link>
      <div className="product-body">
        <div className="rating">
          <Star size={15} fill="currentColor" />
          {product.ratings || 4.6} ({product.numReviews || 0})
        </div>
        <Link to={`/products/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        <p>{product.fabric}</p>
        <div className="price-row">
          <strong>{formatCurrency(discounted)}</strong>
          {product.discountPrice && <span>{formatCurrency(product.price)}</span>}
          {discountPercent(product.price, product.discountPrice) > 0 && <em>{discountPercent(product.price, product.discountPrice)}% Off</em>}
        </div>
        {product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD && (
          <p className="low-stock-note">Only {product.stock} left!</p>
        )}
        <div className="card-actions">
          <button className="button compact" onClick={buyNow} disabled={product.stock === 0}>
            <ShoppingBag size={17} />
            {product.stock === 0 ? "Out of Stock" : "Buy"}
          </button>
          <LikeButton product={product} />
        </div>
      </div>
    </article>
  );
}
