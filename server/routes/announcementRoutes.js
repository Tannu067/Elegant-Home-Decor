import express from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncements,
  getAllAnnouncements,
  updateAnnouncement
} from "../controllers/announcementController.js";
import { admin, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getActiveAnnouncements);
router.get("/all", protect, admin, getAllAnnouncements);
router.post("/", protect, admin, createAnnouncement);
router.put("/:id", protect, admin, updateAnnouncement);
router.delete("/:id", protect, admin, deleteAnnouncement);

export default router;
