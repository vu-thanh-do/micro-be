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
        public UsersController(IUsersService userService)
        {
            _userService = userService;
        }
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                var agv = await _userService.GetAll();
                return Ok(agv);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
