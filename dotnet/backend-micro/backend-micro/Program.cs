
using backend_micro.DTO;
using backend_micro.RabbitMQ;
using backend_micro.RabbitMQ.Producers;
using RabbitMQ.Client;
using recruitment.Infrastructure.Extension;
using recruitment.Services.Extension;
var builder = WebApplication.CreateBuilder(args);
var rabbitMQConfig = builder.Configuration.GetSection("RabbitMQ").Get<RabbitMQConfig>();
builder.Services.AddSingleton(rabbitMQConfig);
builder.Services.AddSingleton<MessageProducer>();

builder.Services.AddSingleton<IConnectionFactory>(_ => new ConnectionFactory
{
    HostName = rabbitMQConfig.HostName,
    UserName = rabbitMQConfig.UserName,
    Password = rabbitMQConfig.Password
});
builder.Services.AddSingleton<IConnection>(sp =>
{
    var factory = sp.GetRequiredService<IConnectionFactory>();
    return factory.CreateConnection();
});
builder.Services.AddSingleton<RabbitMQService>();

builder.Services.AddSingleton<IModel>(sp =>
{
    var connection = sp.GetRequiredService<IConnection>();
    return connection.CreateModel();
});
// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyHeader()
               .AllowAnyMethod();
    });
});
builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDIClass(builder.Configuration);
builder.Services.AddDIServices(builder.Configuration);
var app = builder.Build();
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();

app.MapControllers();
app.UseCors();
app.Run();
