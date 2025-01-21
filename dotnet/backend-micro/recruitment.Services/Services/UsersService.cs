using Microsoft.AspNetCore.Identity;
using recruitment.Core.Interfaces;
using recruitment.Core.Models;
using recruitment.Infrastructure;
using recruitment.Services.Interfaces;
using System;

namespace recruitment.Services.Services
{
    public class UsersService : GenericService<Users>, IUsersService
    {
        public IUnitOfWork _unitOfWork;
        private readonly DbContextClass _context;
        private readonly PasswordHasher<Users> _passwordHasher;

        public UsersService(IUnitOfWork unitOfWork, DbContextClass context) : base(unitOfWork)
        {
            _context = context;
            _unitOfWork = unitOfWork;
            _passwordHasher = new PasswordHasher<Users>();
        }

        public string HashPassword(Users user, string password)
        {
            return _passwordHasher.HashPassword(user, password);
        }

        public bool VerifyPassword(Users user, string password)
        {
            var result = _passwordHasher.VerifyHashedPassword(user, user.Password, password);
            return result == PasswordVerificationResult.Success;
        }
    }
}
