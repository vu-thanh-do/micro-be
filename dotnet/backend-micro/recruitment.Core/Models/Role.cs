using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Core.Models
{
    public class Role : BaseEntity
    {
        [Key]
        public Guid RoleId { get; set; }
        public string RoleName { get; set; }
        public string Permission { get; set; }

        public ICollection<Users> Employees { get; set; }

    }
}
