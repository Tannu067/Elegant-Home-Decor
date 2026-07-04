import asyncHandler from "express-async-handler";
import AnnouncementBar from "../models/AnnouncementBar.js";

export const getActiveAnnouncements = asyncHandler(async (_req, res) => {
  const announcements = await AnnouncementBar.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
  res.json(announcements);
});

export const getAllAnnouncements = asyncHandler(async (_req, res) => {
  const announcements = await AnnouncementBar.find().sort({ order: 1, createdAt: -1 });
  res.json(announcements);
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await AnnouncementBar.create(req.body);
  res.status(201).json(announcement);
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await AnnouncementBar.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found");
  }
  Object.assign(announcement, req.body);
  res.json(await announcement.save());
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await AnnouncementBar.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found");
  }
  await announcement.deleteOne();
  res.json({ message: "Announcement deleted" });
});
