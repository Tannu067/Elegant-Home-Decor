import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { sendOrderConfirmationEmail, sendLowStockAlert } from "../utils/email.js";

const sanitizeOrderItems = (items) =>
  items.map((item) => {
    if (!/^[a-fA-F0-9]{24}$/.test(item.product)) {
      console.log(`[sanitizeOrderItems] Replacing invalid product ID "${item.product}" with placeholder`);
      return { ...item, product: new mongoose.Types.ObjectId() };
    }
    return item;
  });

const calculatePrices = async (items, couponCode) => {
  console.log("[calculatePrices] Input items:", items);
  const productIds = items.map((item) => item.product);
  console.log("[calculatePrices] Product IDs:", productIds);
  const validIds = productIds.filter((id) => /^[a-fA-F0-9]{24}$/.test(id));
  let products = [];
  try {
    products = validIds.length ? await Product.find({ _id: { $in: validIds } }) : [];
  } catch {
    products = [];
  }
  console.log("[calculatePrices] Found products:", products.map(p => ({ _id: p._id, name: p.name, price: p.price, discountPrice: p.discountPrice })));
  const itemsPrice = items.reduce((sum, item) => {
    const product = products.find((entry) => entry._id.toString() === item.product);
    console.log("[calculatePrices] Item:", item.product, "-> Product:", product?.name, "Price:", product?.discountPrice || product?.price || item.price);
    return sum + (product?.discountPrice || product?.price || item.price) * item.quantity;
  }, 0);
  const taxPrice = Number((itemsPrice * 0.05).toFixed(2));
  const shippingPrice = itemsPrice > 2500 ? 0 : 99;
  let discountAmount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && (!coupon.expiryDate || coupon.expiryDate > new Date()) && coupon.usedCount < coupon.usageLimit) {
      discountAmount =
        coupon.discountType === "percentage" ? Math.round((itemsPrice * coupon.discount) / 100) : coupon.discount;
    }
  }
  return {
    itemsPrice,
    taxPrice,
    shippingPrice,
    coupon,
    discountAmount,
    totalPrice: Math.max(0, itemsPrice + taxPrice + shippingPrice - discountAmount)
  };
};

const getLowStockThreshold = () => Number(process.env.LOW_STOCK_THRESHOLD) || 5;

const validateAndDecrementStock = async (items, res) => {
  const threshold = getLowStockThreshold();

  for (const item of items) {
    if (!/^[a-fA-F0-9]{24}$/.test(item.product)) continue;

    const product = await Product.findById(item.product).select("name stock");
    if (!product) {
      res.status(400);
      throw new Error("Product not found");
    }

    if (product.stock < item.quantity) {
      const msg =
        product.stock === 0
          ? `${product.name} is out of stock`
          : `Only ${product.stock} left in stock for ${product.name}`;
      res.status(400);
      throw new Error(msg);
    }

    const updated = await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: -item.quantity } },
      { new: true, select: "name stock" }
    );

    if (updated && updated.stock <= threshold && product.stock > threshold) {
      try {
        await sendLowStockAlert({
          productName: updated.name,
          stock: updated.stock,
          threshold
        });
      } catch (emailErr) {
        console.error("Low stock email alert failed:", emailErr.message);
      }
    }
  }
};

export const createOrder = asyncHandler(async (req, res) => {
  let { orderItems, shippingAddress, paymentMethod, couponCode } = req.body;
  if (!orderItems?.length) {
    res.status(400);
    throw new Error("Order items are required");
  }

  orderItems = sanitizeOrderItems(orderItems);
  const prices = await calculatePrices(orderItems, couponCode);
  await validateAndDecrementStock(orderItems, res);
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice: prices.itemsPrice,
    taxPrice: prices.taxPrice,
    shippingPrice: prices.shippingPrice,
    totalPrice: prices.totalPrice,
    coupon: prices.coupon
      ? {
          code: prices.coupon.code,
          discountAmount: prices.discountAmount
        }
      : undefined
  });

  if (prices.coupon) {
    prices.coupon.usedCount += 1;
    await prices.coupon.save();
  }

  try {
    await sendOrderConfirmationEmail({ to: req.user.email, name: req.user.name, order });
  } catch (emailErr) {
    console.error("Order confirmation email failed:", emailErr.message);
  }

  res.status(201).json(order);
});

export const createGuestOrder = asyncHandler(async (req, res) => {
  console.log("[GuestOrder] Request body:", JSON.stringify(req.body, null, 2));
  let { orderItems, shippingAddress, guestInfo, paymentMethod = "COD", couponCode } = req.body;
  if (!orderItems?.length) {
    res.status(400);
    throw new Error("Order Items Are Required");
  }
  if (!guestInfo?.fullName || !guestInfo?.email || !guestInfo?.phone) {
    res.status(400);
    throw new Error("Guest Name, Email, and Phone Are Required");
  }

  orderItems = sanitizeOrderItems(orderItems);
  const prices = await calculatePrices(orderItems, couponCode);
  await validateAndDecrementStock(orderItems, res);
  console.log("[GuestOrder] Calculated prices:", prices);
  const order = await Order.create({
    is_guest: true,
    guestInfo,
    orderItems,
    shippingAddress,
    paymentMethod,
    isPaid: false,
    itemsPrice: prices.itemsPrice,
    taxPrice: prices.taxPrice,
    shippingPrice: prices.shippingPrice,
    totalPrice: prices.totalPrice,
    coupon: prices.coupon
      ? {
          code: prices.coupon.code,
          discountAmount: prices.discountAmount
        }
      : undefined
  });
  console.log("[GuestOrder] Order created:", order);

  if (prices.coupon) {
    prices.coupon.usedCount += 1;
    await prices.coupon.save();
  }

  try {
    await sendOrderConfirmationEmail({ to: guestInfo.email, name: guestInfo.fullName, order });
  } catch (emailErr) {
    console.error("Guest order confirmation email failed:", emailErr.message);
  }

  res.status(201).json(order);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("orderItems.product", "slug")
    .sort({ createdAt: -1 });
  res.json(orders);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if ((!order.user || order.user._id.toString() !== req.user._id.toString()) && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized for this order");
  }
  res.json(order);
});

export const trackGuestOrder = asyncHandler(async (req, res) => {
  const { orderNumber, email } = req.body;
  const order = await Order.findOne({
    orderNumber,
    "guestInfo.email": email?.toLowerCase(),
    is_guest: true
  });

  if (!order) {
    res.status(404);
    throw new Error("Guest Order Not Found");
  }

  res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  order.orderStatus = req.body.status || order.orderStatus;
  if (order.orderStatus === "Delivered") {
    order.deliveredAt = new Date();
  }
  res.json(await order.save());
});

export const markDelivered = asyncHandler(async (req, res) => {
  req.body.status = "Delivered";
  return updateOrderStatus(req, res);
});
