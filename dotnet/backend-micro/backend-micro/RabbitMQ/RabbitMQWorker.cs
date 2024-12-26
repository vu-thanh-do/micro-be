using RabbitMQ.Client.Events;
using RabbitMQ.Client.Events;
using RabbitMQ.Client;
using System.Text;

namespace backend_micro.RabbitMQ
{
    public class RabbitMQWorker : BackgroundService
    {
        private readonly IModel _channel;
        private readonly ILogger<RabbitMQWorker> _logger;
        public RabbitMQWorker(IModel channel, ILogger<RabbitMQWorker> logger)
        {
            _channel = channel;
            _logger = logger;
        }
        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var consumer = new EventingBasicConsumer(_channel);
            consumer.Received += (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);
                _logger.LogInformation($"Message received: {message}");
            };

            _channel.BasicConsume(queue: "queue_name", autoAck: true, consumer: consumer);

            return Task.CompletedTask;
        }
    }
}
