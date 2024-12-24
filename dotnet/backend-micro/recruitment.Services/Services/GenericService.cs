using recruitment.Core.Interfaces;
using recruitment.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
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

        public async Task<IEnumerable<TEntity>> GetAll()
        {
            return await _unitOfWork.GetRepository<TEntity>().GetAll();
        }
    }
}
