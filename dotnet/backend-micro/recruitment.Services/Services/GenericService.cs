using Microsoft.EntityFrameworkCore;
using recruitment.Core.Interfaces;
using recruitment.Core.Models;
using recruitment.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Services.Services
{
    public class GenericService<TEntity> : IGenericService<TEntity> where TEntity : class
    {
        public readonly IUnitOfWork _unitOfWork;
        public GenericService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }
        public Task<bool> Create(TEntity model)
        {
            throw new NotImplementedException();
        }
        public IEnumerable<TEntity> Get(Expression<Func<TEntity, bool>> filter = null,
         Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>> orderBy = null,
         string includeProperties = "")
        {
            var query = _unitOfWork.GetRepository<TEntity>().Get();

            if (filter != null)
            {
                query = query.Where(filter);
            }

            foreach (var includeProperty in includeProperties.Split
                (new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
            {
                query = query.Include(includeProperty);
            }

            if (orderBy != null)
            {
                return orderBy(query);
            }
            return query;
        }

        public async Task<IEnumerable<TEntity>> GetAll()
        {
            try
            {
                return await _unitOfWork.GetRepository<TEntity>().GetAll();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving users: {ex.Message}");
                return Enumerable.Empty<TEntity>();
            }
        }

    }
}
