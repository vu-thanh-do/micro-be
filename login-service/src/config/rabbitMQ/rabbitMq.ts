import amqp from 'amqplib';
let channel: amqp.Channel;
export async function setupRabbitMQ() {
  const connection = await amqp.connect("amqp://admin:admin123@localhost");
  channel = await connection.createChannel();
  console.log("Connected to RabbitMQ (Micro A)");
}
export async function sendToQueue(queueName: string, message: any) {
  if (!channel) throw new Error('Channel chưa được khởi tạo');
  await channel.assertQueue(queueName);
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
}
function generateUuid() {
  return Math.random().toString() + Math.random().toString();
}
export async function sendRpcRequest(queueName: string, payload: any): Promise<any> {
  const conn = await amqp.connect('amqp://admin:admin123@localhost');
  const channel = await conn.createChannel();

  const replyQueue = await channel.assertQueue('', { exclusive: true }); 
  const correlationId = generateUuid();

  return new Promise((resolve, reject) => {
    channel.consume(
      replyQueue.queue,
      (msg) => {
        if (msg?.properties.correlationId === correlationId) {
          const response = JSON.parse(msg.content.toString());
          resolve(response);
          conn.close();
        }
      },
      { noAck: true }
    );

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), {
      correlationId,
      replyTo: replyQueue.queue,
    });

    setTimeout(() => {
      reject(new Error('Timeout'));
      conn.close();
    }, 10000); // timeout 10s
  });
}
