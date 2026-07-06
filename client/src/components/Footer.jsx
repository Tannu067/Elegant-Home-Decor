import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <img 
              src="https://res.cloudinary.com/djligggal/image/upload/v1782812327/ChatGPT_Image_Jun_30_2026_03_08_25_PM_drkks8.png" 
              alt="Elegant Home Decor" 
              style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
            />
            <h3>Elegant Home Decor</h3>
          </div>
          <p>Premium Fabric Decor Made for Warm Homes, Thoughtful Hosting, and Everyday Beauty.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/products?category=table-covers">Table Covers</Link>
          <Link to="/products?category=cushion-covers">Cushion Covers</Link>
          <Link to="/products?category=aprons">Aprons</Link>
        </div>
        <div>
          <h4>Support</h4>
          <Link to="/faq">FAQ</Link>
          <Link to="/return-refund-policy">Returns</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <p>hello@eleganthomedecor.com</p>
          <p>+91 90000 00000</p>
          <p>Jaipur, Rajasthan, India</p>
        </div>
      </div>
      <div className="footer-byline">Made by Tannu Kumari</div>
    </footer>
  );
}
