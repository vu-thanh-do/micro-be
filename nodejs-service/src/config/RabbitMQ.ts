import amqp from 'amqplib';

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://admin:admin123@localhost'); // Kết nối đến RabbitMQ
    const channel = await connection.createChannel();

    const queue = 'example_queue'; // Tên hàng đợi
    await channel.assertQueue(queue); // Đảm bảo queue tồn tại

    // Gửi message
    const message = { task: 'save_to_db', data: { name: 'John Doe', age: 30 } };
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    console.log(`Message sent: ${JSON.stringify(message)}`);
    // Nhận message
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const receivedData = JSON.parse(msg.content.toString());
        console.log(`Message received: ${JSON.stringify(receivedData)}`);
        channel.ack(msg); // Xác nhận đã xử lý xong message
      }
    });
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
  }
}

export default connectRabbitMQ