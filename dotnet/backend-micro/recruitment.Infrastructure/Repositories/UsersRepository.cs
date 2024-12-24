using recruitment.Core.Interfaces;
using recruitment.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Infrastructure.Repositories
{
    public  class UsersRepository : GenericRepository<Users> , IUsersRepository
    {
        public UsersRepository(DbContextClass dbContext) : base(dbContext)
        {

        }
    }
}
