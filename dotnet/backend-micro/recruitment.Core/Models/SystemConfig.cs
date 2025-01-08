using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Core.Models
{
    public class SystemConfig : BaseEntity
    {
        [Key]
        public Guid SystemConfigId { get; set; }
    }
}
