using System;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Threading.Tasks;
using backend_micro.DTO;
using backend_micro.RabbitMQ.Consumers;

namespace backend_micro.RabbitMQ.Factories
{
    public class ConsumerFactory
    {
        public static IConsumer CreateConsumer(string queueName)
        {
            return queueName switch
            {
                "user_queue" => new UserConsumer(),
                //"noti_queue" => new NotificationConsumer(),
                _ => throw new ArgumentException($"No consumer found for queue: {queueName}")
            };
        }
    }
}
