using recruitment.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Services.Interfaces
{
    public interface IUsersService : IGenericService<Users>
    {
        string HashPassword(Users user, string password);
        bool VerifyPassword(Users user, string password);
    }
}
