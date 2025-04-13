import mongoose from "mongoose";

const dbString =
  process.env.DB_STRING || "mongodb://localhost:27017/FoodOrdering";

(async () => {
  try {
    await mongoose.connect(dbString);
    console.log("Connected to database ✅");
  } catch (err) {
    console.error("Can't connect to the database!");
  }
})();

const OwnerSchema = new mongoose.Schema({
  telegramId: String,
  name: String,
  email: String,
  password: { type: String, required: true },
  restaurantInfo: {
    name: String,
    address: { type: String, required: true },
    description: { type: String, required: false },
  },
  createdAt: { type: Date, default: Date.now },
});

const Owner = mongoose.model("Owner", OwnerSchema);

const CustomerSchema = new mongoose.Schema({
  username: String,
  password: String,
  confirmPassword: String,
  email: { type: String, required: false, default: "123" },
  createdAt: { type: Date, default: Date.now },
});

const Customer = mongoose.model("Customer", CustomerSchema);

const MenuSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true },
  items: {
    id: Number,
    name: String,
    description: { type: String, required: false },
    price: { type: Number, required: true },
    img: { type: String, required: false },
    amount: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
  },

  menuCreatedAt: { type: Date, default: Date.now },
});

const Menu = mongoose.model("Menu", MenuSchema);

const OrderSchema = new mongoose.Schema({
  restaurantId: {
    type: String,
    required: true,
  },
  customerId: {
    type: String,
    required: true,
  },
  items: [
    {
      name: String,
      id: Number,
      price: Number,
      img: { type: String, required: false },
      amount: { type: Number, default: 0 },
    },
  ],
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", OrderSchema);

export { Order, Menu, Customer, Owner };
