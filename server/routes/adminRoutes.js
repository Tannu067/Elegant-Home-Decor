import express from "express";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  getAllOrders,
  getAllUsers,
  getDashboardStats,
  getLowStockProducts,
  updateAdminProduct
} from "../controllers/adminController.js";
import {
  getAllReviews,
  approveReview,
  rejectReview,
  updateReview,
  deleteReview
} from "../controllers/reviewController.js";
import {
  getAllReturns,
  getReturnDetail,
  updateReturnStatus,
  updateReturnNotes,
  initiateRefund,
  completeRefund
} from "../controllers/returnController.js";
import { markDelivered, updateOrderStatus } from "../controllers/orderController.js";
import { admin, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect, admin);
router.get("/stats", getDashboardStats);
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.put("/orders/:id/deliver", markDelivered);
router.get("/users", getAllUsers);
router.get("/low-stock", getLowStockProducts);
router.route("/products").get(getAdminProducts).post(upload.array("images", 8), createAdminProduct);
router.route("/products/:id").put(upload.array("images", 8), updateAdminProduct).delete(deleteAdminProduct);
router.get("/reviews", getAllReviews);
router.put("/reviews/:id/approve", approveReview);
router.put("/reviews/:id/reject", rejectReview);
router.put("/reviews/:id", updateReview);
router.delete("/reviews/:id", deleteReview);
router.get("/returns", getAllReturns);
router.get("/returns/:id", getReturnDetail);
router.put("/returns/:id/status", updateReturnStatus);
router.put("/returns/:id/notes", updateReturnNotes);
router.post("/returns/:id/refund", initiateRefund);
router.put("/returns/:id/refund/complete", completeRefund);

export default router;
