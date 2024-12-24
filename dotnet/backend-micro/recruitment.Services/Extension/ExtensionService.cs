using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using recruitment.Services.Interfaces;
using recruitment.Services.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Services.Extension
{
    public static class ExtensionService
    {
        public static IServiceCollection AddDIServices (this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<IUsersService, UsersService>();
            return services;
        }
    }
}
