using RabbitMQ.Client;
using System;
using System.Text;
using Newtonsoft.Json;

namespace backend_micro.RabbitMQ.Producers
{
    public class MessageProducer
    {
        private readonly IConfiguration _configuration;
        public MessageProducer(IConfiguration configuration)
        {
            _configuration = configuration;
        }
       
        public void SendMessage<T>(string queueName, T messageObject)
        {
            var message = JsonConvert.SerializeObject(messageObject);
            var hostName = _configuration["RabbitMQ:HostName"];
            var userName = _configuration["RabbitMQ:UserName"];
            var password = _configuration["RabbitMQ:Password"];
            // Cấu hình kết nối và channel với RabbitMQ
            var factory = new ConnectionFactory() { HostName = hostName, UserName = userName, Password = password };
            using (var connection = factory.CreateConnection())
            using (var channel = connection.CreateModel())
            {
                // Khai báo queue
                channel.QueueDeclare(queue: queueName, durable: true, exclusive: false, autoDelete: false, arguments: null);
                // Chuyển message thành byte array
                var body = Encoding.UTF8.GetBytes(message);
                // Gửi message vào queue
                channel.BasicPublish(exchange: "", routingKey: queueName, basicProperties: null, body: body);
                Console.WriteLine($" [x] Sent '{message}' to queue '{queueName}'");
            }
        }
    }
}
