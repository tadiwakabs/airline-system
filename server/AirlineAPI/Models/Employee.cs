using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    public enum WorkStatus
    {
        Active,
        OnLeave,
        Terminated
    }

    [Table("Employee")]
    public class Employee
    {
        [Key]
        [Required]
        [StringLength(50)]
        public string employeeId { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string userId { get; set; } = string.Empty;

        [ForeignKey("userId")]
        public User? Users { get; set; }

        [Required]
        [StringLength(100)]
        [EmailAddress]
        [RegularExpression(@".*@airline\.com$")]
        public string workEmail { get; set; } = string.Empty;

        public int? workPhone { get; set; }

        [StringLength(50)]
        public string? jobTitle { get; set; }

        [StringLength(50)]
        public string? department { get; set; }

        public DateTime hire_date { get; set; }

        [Required]
        [StringLength(3)]
        public string workLocation { get; set; } = string.Empty;

        [ForeignKey("workLocation")]
        public Airport? Aiport { get; set; }

        [Required]
        public WorkStatus status { get; set; }

        [Required]
        public bool IsAdmin { get; set; }
    }
}