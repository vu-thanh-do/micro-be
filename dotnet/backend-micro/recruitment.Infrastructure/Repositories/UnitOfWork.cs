using recruitment.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        protected DbContextClass _dbContext;
        public UnitOfWork(DbContextClass dbContext)
        {
            _dbContext = dbContext;
        }
        public IGenericRepository<TEntity> GetRepository<TEntity>() where TEntity : class
        {
            return new GenericRepository<TEntity>(_dbContext);
        }
        public int Save()
        {
            return _dbContext.SaveChanges();
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _dbContext.SaveChangesAsync();
        }
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                _dbContext.Dispose();
            }
        }

    }
}
