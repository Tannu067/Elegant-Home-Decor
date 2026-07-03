import { createSlice } from "@reduxjs/toolkit";

const initialItems = JSON.parse(localStorage.getItem("ehd_wishlist") || "[]");
const persist = (items) => localStorage.setItem("ehd_wishlist", JSON.stringify(items));

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: { items: initialItems },
  reducers: {
    addToWishlist(state, action) {
      const exists = state.items.some((item) => item._id === action.payload._id);
      if (!exists) {
        state.items = [...state.items, action.payload];
        persist(state.items);
      }
    },
    toggleWishlist(state, action) {
      const exists = state.items.some((item) => item._id === action.payload._id);
      state.items = exists ? state.items.filter((item) => item._id !== action.payload._id) : [...state.items, action.payload];
      persist(state.items);
    },
    removeFromWishlist(state, action) {
      state.items = state.items.filter((item) => item._id !== action.payload._id);
      persist(state.items);
    }
  }
});

export const { addToWishlist, removeFromWishlist, toggleWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
