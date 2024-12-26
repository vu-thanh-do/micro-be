using RabbitMQ.Client;
using System.Threading.Tasks;

namespace backend_micro.DTO
{
    public interface IConsumer
    {
        Task Consume(string message);
        void StartConsume(IModel channel, string queueName);
    }
}
