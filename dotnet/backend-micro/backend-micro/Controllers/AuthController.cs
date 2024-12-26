using backend_micro.RabbitMQ;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using recruitment.Core.Models;
using recruitment.Services.Interfaces;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Text;
using backend_micro.DTO;
using backend_micro.RabbitMQ.Producers;
using System.Net;

namespace backend_micro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly IUsersService _userService;
        private readonly RabbitMQService _rabbitMQService;
        private readonly MessageProducer _messageProducer;

        public AuthController(IUsersService userService, RabbitMQService rabbitMQService, IConfiguration config, MessageProducer messageProducer)
        {

            _userService = userService;
            _rabbitMQService = rabbitMQService;
            _config = config;
            _messageProducer = messageProducer;
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto model)
        {
            try
            {
                var message = new
                {
                    logType = "login",
                    code = "972524",
                    timeLogin = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss.fff"),
                    content ="code vn972524 login success",
                    ipAddress ="10.73.131.60"
                };
                _messageProducer.SendMessage("logger_queue", message);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
