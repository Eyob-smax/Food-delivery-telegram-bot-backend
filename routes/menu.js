import express from "express";
const menu = express.Router();
import { Menu, Owner } from "../database.js";

import cors from "cors";
import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

menu.get(`/getAll`, async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const menus = await Menu.find({ restaurantId });
    if (menus.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Menu not found with the given restaurantId",
      });
    }
    return res.status(200).json({ success: true, data: menus });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "can't get menu " + err.message });
  }
});

// menu.get("/get/", async (req, res) => {
//   try {
//     const { restaurantId, item } = req.body;
//     const isRestaurantExisted = await Owner.findOne({
//       telegramId: restaurantId,
//     });
//     if (!isRestaurantExisted) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Restaurant not found" });
//     }

//     const storedMenu = await Menu.findOne({ restaurantId });
//     if (!storedMenu) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Menu not found" });
//     }

//     const isTheOldExist = storedMenu.items.some((item) => {
//       return (
//         item.name === item.name &&
//         item.price === item.price &&
//         item.description === item.description &&
//         item.img === item.img &&
//         item.amount === item.amount
//       );
//     });

//     if (!isTheOldExist) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Item to update not found" });
//     }
//     return res.status(200).json({
//       success: true,
//       data: storedMenu.items.filter((item) => {
//         return (
//           item.name === item.name &&
//           item.price === item.price &&
//           item.description === item.description &&
//           item.img === item.img &&
//           item.amount === item.amount
//         );
//       }),
//     });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "can't get menu " + err.message });
//   }
// });

menu.post("/add", async (req, res) => {
  try {
    const { restaurantId, items } = req.body;
    const isRestaurantExisted = await Owner.findOne({
      telegramId: restaurantId,
    });

    if (!isRestaurantExisted) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant not found" });
    }
    const itemsStored = await Menu.find({ restaurantId });
    let menuExist = false;
    itemsStored.forEach((item) => {
      if (
        item.items.name === items.name &&
        item.items.price === items.price &&
        item.items.description === items.description
      ) {
        menuExist = true;
      }
    });
    if (menuExist) {
      return res.status(400).json({
        success: false,
        message: "Menu already exist with the given restaurantId",
      });
    }
    const newMenu = new Menu({
      restaurantId,
      items,
    });
    await newMenu.save();
    return res.status(200).json({ success: true, message: "new Menu added" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "can't add order " + err.message });
  }
});

menu.put("/update", async (req, res) => {
  try {
    const { restaurantId, items, oldItems } = req.body;

    const isRestaurantExisted = await Owner.findOne({
      telegramId: restaurantId,
    });

    if (!isRestaurantExisted) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant not found" });
    }

    const storedMenu = await Menu.findOne({ restaurantId });

    if (!storedMenu) {
      return res
        .status(400)
        .json({ success: false, message: "Menu not found" });
    }

    const isTheOldExist = storedMenu.items.some((item) => {
      return item.name === oldItems.name && item.price === oldItems.price;
    });

    if (!isTheOldExist) {
      return res
        .status(400)
        .json({ success: false, message: "Item to update not found" });
    }

    await Menu.updateOne(
      {
        restaurantId,
        "items.name": oldItems.name,
        "items.price": oldItems.price,
        "items.description": oldItems.description,
      },
      {
        $set: {
          "items.$.name": items.name || oldItems.name,
          "items.$.price": items.price || oldItems.price,
          "items.$.description": items.description || oldItems.description,
          "items.$.img": items.img || oldItems.img,
          "items.$.amount": items.amount || oldItems.amount,
        },
      }
    );

    return res.status(200).json({ success: true, message: "Menu updated" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Can't update order " + err.message });
  }
});

menu.delete("/delete", async (req, res) => {
  try {
    const { restaurantId, item } = req.body;
    const isRestaurantExisted = await Owner.findOne({
      telegramId: restaurantId,
    });

    if (!isRestaurantExisted) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant not found" });
    }
    const storedMenu = await Menu.findOne({ restaurantId });

    if (!storedMenu) {
      return res
        .status(400)
        .json({ success: false, message: "Menu not found" });
    }

    const isTheOldExist = storedMenu.items.some((item) => {
      return item.name === item.name && item.price === item.price;
    });

    if (!isTheOldExist) {
      return res
        .status(400)
        .json({ success: false, message: "Item to update not found" });
    }
    await Menu.updateOne(
      { restaurantId },
      { $pull: { items: { name: item.name, price: item.price } } }
    );
    return res.status(200).json({ success: true, message: "Item deleted" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "can't delete menu " + err.message,
    });
  }
});

menu.delete("/deleteAll", async (req, res) => {
  try {
    const { restaurantId } = req.body;
    const isRestaurantExisted = await Owner.findOne({
      telegramId: restaurantId,
    });

    if (!isRestaurantExisted) {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant not found" });
    }

    await Menu.deleteMany({ restaurantId });
    return res.status(200).json({ success: true, message: "Menu deleted" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "can't delete menu " + err.message });
  }
});

export default menu;
