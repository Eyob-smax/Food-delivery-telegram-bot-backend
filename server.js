import express from "express";
import dotenv from "dotenv";
import MongoStore from "connect-mongo";
import { Strategy as LocalStrategy } from "passport-local";
import passport from "passport";
import { Owner, Customer, Order, Menu } from "./database.js";
import session from "express-session";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";
import path from "path";
import cors from "cors";

import { bot } from "./bot.js";
import menu from "./routes/menu.js";
import customer from "./routes/customer.js";
import order from "./routes/order.js";

const app = express();
app.use(
  cors({
    origin: ["*", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
dotenv.config();

const authData = {
  telegramId: "",
  sessionId: "",
  userId: "",
};

passport.use(
  new LocalStrategy(
    {
      usernameField: "name",
      passReqToCallback: true,
    },
    async (req, username, password, done) => {
      console.log(req.body);
      try {
        const user = await Owner.findOne({
          telegramId: req.body.telegramId,
          name: username,
        });

        if (!user) {
          console.log("User not found:", username);
          return done(null, false, { message: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          console.log("Invalid password attempt:", username);
          return done(null, false, { message: "Invalid password" });
        }
        return done(null, user);
      } catch (err) {
        console.error("Error in LocalStrategy:", err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Owner.findById(id);
    done(null, user);
  } catch (err) {
    console.error("Error in deserializeUser:", err);
    done(err, null);
  }
});

const store = MongoStore.create({
  mongoUrl: process.env.DB_STRING || "mongodb://localhost:27017/FoodOrdering",
  collectionName: "sessions",
  ttl: 5 * 24 * 60 * 60,
});

const sessionMiddleware = session({
  secret: "order your food",
  resave: false,
  saveUninitialized: false,
  store,
  cookie: { secure: false, httpOnly: true, maxAge: 5 * 24 * 60 * 60 * 1000 },
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login-failure",
    successRedirect: "/protected-route",
  }),
  (err, req, res, next) => {
    if (err) {
      console.error("Error in login route:", err);
      return next(err);
    }
    res.redirect("/protected-route");
  }
);

app.post("/register", async (req, res) => {
  const { telegramId, name, email, password, restaurantInfo } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newOwner = new Owner({
      telegramId,
      name,
      email,
      password: hashedPassword,
      restaurantInfo: {
        name: restaurantInfo.name,
        address: restaurantInfo.address,
        description: restaurantInfo.description || "",
        logo: restaurantInfo.logo || "default",
      },
    });
    await newOwner.save();
    res
      .status(201)
      .json({ success: true, message: "User registered successfully!" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/protected-route", (req, res) => {
  console.log(req.user, req.isAuthenticated());
  if (req.isAuthenticated()) {
    return res
      .status(200)
      .json({ success: true, message: "You are authenticated." });
  } else {
    return res
      .status(401)
      .json({ success: false, message: "You are not authenticated." });
  }
});

app.get("/login-failure", (req, res) => {
  res.status(401).json({ success: false, message: "Login failed." });
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send("Error logging out.");
    }
    res.redirect("/");
  });
});

app.use("/menu", menu);
app.use("/order", order);
app.use("/customer", customer);

//? app.app.use("/login", login);
//? app.use("/api/signup", signup);

bot
  .launch()
  .then(() => console.log("🚀 Bot is running..."))
  .catch((err) => {
    console.error("Bot launch failed:", err.message);
    process.exit(1);
  });

app.use(
  express.static(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "public")
  )
);

const PORT = process.env.PORT || 8000;
const expressServer = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

import { Server } from "socket.io";

const io = new Server(expressServer, {
  cors: {
    origin: ["http://localhost:8000", "http://127.0.0.1:8000"],
  },
});

io.on("connection", (socket) => {
  socket.broadcast.emit("welcome", "welcome to telegram");

  socket.on("message", (data) => {
    io.emit("message", `${socket.id.substring(0, 5)}: ${data}`);
  });

  socket.on("activity", (data) => {
    socket.broadcast.emit(
      "activity",
      `user ${socket.id.substring(0, 5)} typing...`
    );
  });
});
