using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Services.Interfaces
{
    public interface IGenericService<T>
    {
        Task<bool> Create(T model);
        Task<IEnumerable<T>> GetAll();
    }
}
