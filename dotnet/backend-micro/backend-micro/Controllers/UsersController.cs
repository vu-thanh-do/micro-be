using backend_micro.RabbitMQ;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using recruitment.Services.Interfaces;
using System.Net.Http;

namespace backend_micro.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUsersService _userService;
        private readonly RabbitMQService _rabbitMQService;

        public UsersController(IUsersService userService, RabbitMQService rabbitMQService)
        {
            _userService = userService;
            _rabbitMQService = rabbitMQService;
        }
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                var agv = await _userService.GetAll();
                //_rabbitMQService.SendMessage("Hello, RabbitMQ!");

                return Ok(agv);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPost]
        public async Task<IActionResult> CreateUser()
        {
            try
            {
                var agv = await _userService.GetAll();
                _rabbitMQService.SendMessage("Hello, RabbitMQ!");
                return Ok("ok");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
