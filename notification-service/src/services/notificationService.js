const { sendMessage } = require("../config/kafka");
const Notification = require("../models/notificationModel");
const sendNotificationEvent = async (message) => {
  try {
    await sendMessage("user-events", message);
  } catch (error) {
    console.error("Error sending notification event to Kafka:", error);
  }
};
const createNotification = async (message, userId) => {
  const notification = new Notification({
    message,
    userId,
  });
  await notification.save();
};

module.exports = { sendNotificationEvent, createNotification };
