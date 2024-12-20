const { createNotification, sendNotificationEvent } = require("../services/notificationService");

const sendNotification = async (req, res) => {
  try {
    const { message, userId } = req.body;
    // Lưu thông báo vào MongoDB
    await createNotification(message, userId);
    // Gửi thông báo đến Kafka
    await sendNotificationEvent({ event: "user_logged_in", userId });
    res.send("Notification sent!");
  } catch (error) {
    res.status(500).send("Error sending notification");
  }
};

module.exports = { sendNotification };
