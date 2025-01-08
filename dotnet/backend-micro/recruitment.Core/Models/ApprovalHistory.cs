using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace recruitment.Core.Models
{
    public class ApprovalHistory : BaseEntity
    {
        [Key]
        public Guid ApprovalHistoryId { get; set; }
        public Guid RequestRecruitmentId { get; set; }
        [ForeignKey("RequestRecruitmentId")]
        public RequestRecruitment RequestRecruitment { get; set; }
        public string ApprovalCodeId { get; set; }
        public string Status { get; set; }
        public string Reason { get; set; }
    }
}
