using recruitment.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Services.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(Users user);
        ClaimsPrincipal GetPrincipalFromToken(String token);
        ClaimsPrincipal GetPrincipalFromExpiredToken(String token);
    }
}
