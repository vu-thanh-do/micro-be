const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const { connectProducer } = require("./config/kafka");
const { sendNotification } = require("./controllers/notificationController");
const app = express();
const port = 4000;
// Middleware
app.use(bodyParser.json());
// Kết nối với cơ sở dữ liệu MongoDB
connectDB()
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("Error connecting to MongoDB", error));

// Kết nối Kafka producer
connectProducer()
  .then(() => console.log("Kafka producer connected"))
  .catch((error) => console.error("Error connecting to Kafka producer", error));
// Route
app.post("/send", sendNotification);
app.listen(port, () => {
  console.log(`Notification Service running at http://localhost:${port}`);
});
