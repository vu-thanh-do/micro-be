using backend_micro.DTO;
using RabbitMQ.Client.Events;
using RabbitMQ.Client;
using System.Text;

namespace backend_micro.RabbitMQ
{
    public class RabbitMQService
    {
        private readonly IModel _channel;
        private readonly RabbitMQConfig _config;
        public RabbitMQService(IModel channel, RabbitMQConfig config)
        {
            _channel = channel;
            _config = config;
            _channel.QueueDeclare(
                queue: _config.QueueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null
            );
        }
        public void SendMessage(string message)
        {
            try
            {
                var body = Encoding.UTF8.GetBytes(message);
                _channel.BasicPublish(exchange: "", routingKey: _config.QueueName, basicProperties: null, body: body);
                Console.WriteLine($"Message sent: {message}");
            }
            catch (Exception ex)
            {

            }
        }
        public void ReceiveMessage()
        {
            try
            {
                var consumer = new EventingBasicConsumer(_channel);
                consumer.Received += (model, ea) =>
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    Console.WriteLine($"Message sent: {message}");
                };
                _channel.BasicConsume(queue: _config.QueueName, autoAck: true, consumer: consumer);
            }
            catch (Exception ex)
            {

            }
            
        }
    }
}
