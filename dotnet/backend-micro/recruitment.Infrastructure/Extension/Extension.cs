using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using recruitment.Core.Interfaces;
using recruitment.Infrastructure.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Infrastructure.Extension
{
    public static class Extension
    {
        public static IServiceCollection AddDIClass(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<DbContextClass>(options =>
            {
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
            });
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<IUsersRepository, UsersRepository>();
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            return services;
        }
    }
}
