using recruitment.Core.Interfaces;
using recruitment.Core.Models;
using recruitment.Infrastructure;
using recruitment.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Services.Services
{
    public class UsersService : GenericService<Users>, IUsersService
    {
        public IUnitOfWork _unitOfWork;
        private readonly DbContextClass _context;
        public UsersService(IUnitOfWork unitOfWork, DbContextClass context) : base(unitOfWork)
        {
            _context = context;
            _unitOfWork = unitOfWork;
        }
        public Task<bool> Create(Users model)
        {
            throw new NotImplementedException();
        }
        public async Task<IEnumerable<Users>> GetAll()
        {
            try
            {
                var UserData = await _unitOfWork.GetRepository<Users>().GetAll();
                return UserData;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving users: {ex.Message}");
                return Enumerable.Empty<Users>();
            }
        }
    }
}
