using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Core.Models
{
    public class RequestRecruitment : BaseEntity
    {
        [Key]
        public Guid RequestRecruitmentId { get; set; }
        public string Status { get; set; }
        public string FormTemplateHitoryId { get; set; }
        public string FormType { get; set; }
        public Guid UserId { get; set; }
        [ForeignKey("UserId")]
        public Users Users { get; set; }

    }
}
