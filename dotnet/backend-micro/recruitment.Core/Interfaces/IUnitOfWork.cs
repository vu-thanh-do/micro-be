using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Core.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<TEntity> GetRepository<TEntity>() where TEntity : class;
        int Save();
        Task<int> SaveChangesAsync();
    }
}
