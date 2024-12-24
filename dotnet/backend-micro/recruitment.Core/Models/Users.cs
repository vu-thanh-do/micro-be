using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Core.Models
{
    public class Users : BaseEntity
    {
        [Key]
        public Guid UserId { get; set; }
        public string Avatar { get; set; }
        public string Password { get; set; } 
        public string EmployeeCode { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string RefreshToken { get; set; } 

    }
}
