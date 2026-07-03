import { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const CartAnimationContext = createContext();

export function useCartFly() {
  return useContext(CartAnimationContext);
}

const FLY_SIZE = 72;

export function CartAnimationProvider({ children }) {
  const [fly, setFly] = useState(null);

  const trigger = useCallback((imageUrl, sourceElement) => {
    if (!sourceElement) return;
    const from = sourceElement.getBoundingClientRect();
    const cartIcon = document.querySelector(".nav-actions a[href='/cart']");
    if (!cartIcon) return;
    const to = cartIcon.getBoundingClientRect();

    const startX = from.left + from.width / 2;
    const startY = from.top + from.height / 2;
    const endX = to.left + to.width / 2;
    const endY = to.top + to.height / 2;

    setFly({ id: Date.now(), imageUrl, startX, startY, endX, endY });

    setTimeout(() => {
      setFly(null);
      const svg = cartIcon.querySelector("svg");
      if (svg) {
        svg.classList.add("cart-bounce");
        svg.addEventListener("animationend", () => svg.classList.remove("cart-bounce"), { once: true });
      }
    }, 700);
  }, []);

  return (
    <CartAnimationContext.Provider value={trigger}>
      {children}
      <AnimatePresence>
        {fly && createPortal(
          <motion.div
            key={fly.id}
            style={{
              position: "fixed",
              zIndex: 9999,
              width: FLY_SIZE,
              height: FLY_SIZE,
              borderRadius: 10,
              overflow: "hidden",
              pointerEvents: "none",
              boxShadow: "0 12px 32px rgba(65,50,32,0.25)",
            }}
            initial={{
              x: fly.startX - FLY_SIZE / 2,
              y: fly.startY - FLY_SIZE / 2,
              scale: 1,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              x: fly.endX - FLY_SIZE / 2,
              y: [fly.startY - FLY_SIZE / 2, fly.startY - FLY_SIZE / 2 - 60, fly.endY - FLY_SIZE / 2],
              scale: [1, 0.5, 0.22],
              rotate: [0, -5, 10],
              opacity: [1, 0.85, 0.6],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 0.7,
              x: { ease: [0.25, 0.46, 0.45, 0.94], duration: 0.7 },
              y: { ease: "easeInOut", duration: 0.7 },
              scale: { ease: "easeIn", duration: 0.7 },
              rotate: { ease: "easeInOut", duration: 0.7 },
              opacity: { ease: "easeIn", duration: 0.5 },
            }}
          >
            <img
              src={fly.imageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </CartAnimationContext.Provider>
  );
}
