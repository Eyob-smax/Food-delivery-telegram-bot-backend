import express from "express";
import cors from "cors";
import { Telegraf, Markup } from "telegraf";
import { Customer, Order, Menu, Owner } from "../database.js";

const customer = express.Router();

customer.get("/getAll", async (req, res) => {
  try {
    const customers = await Customer.find({});
    return res.status(200).json({ success: true, data: customers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

customer.post("/addCustomer", async (req, res) => {
  try {
    const { password, username, phone, email } = req.body;
    const newCustomer = new Customer({
      password,
      username,
      phone,
      email,
    });
    await newCustomer.save();
    return res
      .status(201)
      .json({ success: true, message: "Customer added successfully!" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default customer;
