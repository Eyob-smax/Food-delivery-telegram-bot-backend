import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { Owner } from "./database.js";
import { set } from "mongoose";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

let messages = [];
let currentOwnerData = {};
async function checkIfTheRestaurantExist(id) {
  try {
    const owner = await Owner.findOne({ telegramId: id });
    currentOwnerData = owner;
    if (!owner) {
      return false;
    }
    return true;
  } catch (err) {
    console.log("Something wrong with the database connection");
  }
}

async function checkAuth(owner) {
  try {
    if (!owner) {
      return false;
    }
    if (!owner.password) {
      return false;
    }
    const ownerId = await Owner.findOne({
      telegramId: owner.telegramId,
    });
    if (!ownerId) {
      return false;
    }
  } catch (err) {
    console.log("Something wrong with the database connection");
  }
}

bot.start(async (ctx) => {
  if (ctx.from.is_bot) {
    ctx.reply("Bots are not allowed to use this bot");
    return;
  }

  try {
    const isExist = await checkIfTheRestaurantExist(ctx.from.id);
    if (!isExist) {
      ctx.reply(
        "Join as a Restaurant Owner \n\nand showcase your menu to thousands of customers.Manage orders, update your offerings, and grow your brand effortlessly. \n Get your own dashboard and start serving online today! 🍽️\\🚀\\",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Register",
                  web_app: {
                    url:
                      process.env.WEB_APP_URL ||
                      "https://telegram-bot-teal-ten.vercel.app",
                  },
                },
              ],
            ],
          },
        }
      );
      return;
    }
    // const checkAuth = await checkAuth(currentOwnerData);
    ctx.reply(
      `Welcome back        *${currentOwnerData.name}* \n\nYou have to login to your account to access the bot's features.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Login",
                web_app: {
                  url:
                    process.env.WEB_APP_URL ||
                    "https://telegram-bot-teal-ten.vercel.app",
                },
              },
            ],
          ],
        },
      }
    );
  } catch (err) {
    ctx.reply("An error occurred while processing your request.");
    console.error("Error in start command:", err.message);
  }
});

bot.telegram.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "qrcode", description: "Generate a QR code" },
  { command: "help", description: "Show all available commands" },
  { command: "about", description: "Learn about this bot" },
  { command: "logout", description: "Say good bye" },
]);

bot.command("help", (ctx) => {
  ctx.replyWithMarkdownV2(
    "*Available Commands:*\n" +
      "/start \\- Start the bot\n" +
      "/help \\- Show this help message\n" +
      "/qrdemo \\- Generate a QR code from text\n" +
      "/Logout \\- Say good bye\n" +
      "/about \\- Info about the bot\n\n\n" +
      "You can the developer @alnova19"
  );
});

bot.command("about", (ctx) => {
  ctx.replyWithMarkdownV2();
});

bot.command("qrcode", async (ctx) => {});
bot.command("logout", async (ctx) => {});

bot.on("new_chat_member", (ctx) => {
  ctx.reply(
    `Welcome to the bot, ${ctx.from.first_name}! 🎉\n\n` +
      "I'm here to help you manage tasks, generate QR codes, and much more.\n" +
      "Type **/start** to get started or **/help** to see available commands."
  );
});

bot.on("callback_query", async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const chatId = ctx.chat.id;
  const item = callbackData.split("_")[1]; // Extract item name

  try {
  } catch (error) {
    console.error("Error handling callback query:", error);
    await ctx.reply("Something went wrong. Please try again later!");
  }
});

async function sendAutoDeletingQR(
  ctx,
  text = "https://telegram-bot-teal-ten.vercel.app/main",
  delay = 1000 * 24 * 60 * 60
) {
  try {
    const filePath = path.join(
      "/React/telegram-bot-backend/qrCodes",
      "qrcode.png"
    );

    await QRCode.toFile(filePath, text);

    const sent = await ctx.replyWithPhoto(
      {
        source: filePath,
        caption: "Scan me! this menu will be delete wiht in 24 hours",
      },
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open your menu",
                web_app: {
                  url: text,
                },
              },
            ],
          ],
        },
      }
    );

    setTimeout(() => {
      ctx
        .deleteMessage(sent.message_id)
        .then(() => console.log("✅ QR message deleted"))
        .catch((err) =>
          console.error("⚠️ Failed to delete message:", err.message)
        );
    }, delay);

    setTimeout(async () => {
      try {
        await fs.unlink(filePath);
        console.log("🧹 Temp QR file deleted");
      } catch (err) {
        console.error("⚠️ File delete error:", err.message);
      }
    }, delay + 2000);
  } catch (err) {
    console.error("❌ Error sending QR:", err.message);
    ctx.reply("Something went wrong while generating your QR code.");
  }
}

export { bot };
