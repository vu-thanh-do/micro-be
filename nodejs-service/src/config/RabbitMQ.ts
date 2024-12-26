import amqp from "amqplib";
import ConsumerFactory from "../rabbitMQ/factories";
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect("amqp://admin:admin123@localhost"); // Kết nối đến RabbitMQ
    const channel = await connection.createChannel();
    const queues: string[] = ["user_queue", "noti_queue" ,"logger_queue"]; // định nghĩa queue
    // Đảm bảo rằng mỗi queue tồn tại
    for (const queue of queues) {
      await channel.assertQueue(queue); // Assert cho từng queue
    }
    // Lắng nghe và xử lý message từ mỗi queue
    for (const queue of queues) {
      channel.consume(queue, (msg) => {
        if (msg !== null) {
          const receivedData = msg.content.toString();
          console.log(`Message received: ${receivedData}`);
          try {
            // Tạo consumer từ factory dựa trên tên queue
            const consumer = ConsumerFactory.createConsumer(queue);
            consumer.consume(receivedData); // Tiến hành xử lý message
            channel.ack(msg); // Xác nhận đã xử lý xong message
          } catch (error) {
            console.error("Error processing message:", error);
            channel.nack(msg); // Xác nhận không xử lý được message
          }
        }
      });
    }
    return { connection, channel };
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
  }
}

export default connectRabbitMQ;
