using backend_micro.DTO;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;

namespace backend_micro.RabbitMQ.Consumers
{
    public class UserConsumer : IConsumer
    {
        public async Task Consume(string message)
        {
            Console.WriteLine($"UserConsumer: Received message: {message}");
            // Xử lý message ở đây (ví dụ: tạo user mới)
        }

        public void StartConsume(IModel channel, string queueName)
        {
            var consumer = new EventingBasicConsumer(channel);
            consumer.Received += async (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);

                try
                {
                    await Consume(message); // Tiến hành xử lý message
                    channel.BasicAck(ea.DeliveryTag, false); // Xác nhận message đã xử lý xong
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Error processing message: {ex.Message}");
                    channel.BasicNack(ea.DeliveryTag, false, true); // Nack nếu gặp lỗi
                }
            };

            channel.BasicConsume(queueName, false, consumer); // Bắt đầu lắng nghe
        }

       
    }
}
