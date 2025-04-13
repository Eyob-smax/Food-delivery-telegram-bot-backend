import express, { json } from "express";
import { Telegraf, Markup } from "telegraf";
import { Owner, Customer, Order } from "../database.js";
import { DateTime } from "luxon";

const order = express.Router();

order.get("/daily", async (req, res) => {
  try {
    const { restaurantId } = req.query;
    if (!restaurantId) {
      return res
        .status(404)
        .json({ success: false, message: "restaurantId required!" });
    }
    const eatNow = DateTime.now().setZone("Africa/Nairobi");

    const startOfDay = eatNow.startOf("day");
    const endOfDay = eatNow.endOf("day");

    const start = startOfDay.toJSDate();
    const end = endOfDay.toJSDate();

    const dailyOrders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      restaurantId,
    });

    if (!dailyOrders || dailyOrders.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "There are no orders right now. or you use invalid restaurantId",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Fetched daily orders successfully!",
      data: dailyOrders,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong: " + err.message,
    });
  }
});

order.get("/getById/:id", async (req, res) => {
  try {
    const { id } = req.params;
  } catch (err) {}
});

order.post("/add", async (req, res) => {
  try {
    const { restaurantId, customerId, items } = req.body;

    if (
      !restaurantId ||
      !customerId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete or invalid order data",
      });
    }

    const newOrder = new Order({
      restaurantId,
      customerId,
      items,
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      message: "Order added successfully!",
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while creating order",
      error: err.message,
    });
  }
});

order.delete("/deleteById/", async (req, res) => {});
export default order;
