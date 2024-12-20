const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  message: String,
  userId: String,
  date: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
