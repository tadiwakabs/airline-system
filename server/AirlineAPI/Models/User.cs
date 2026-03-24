using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    public enum UserTitle
    {
        Dr,
        Ms,
        Mr,
        Miss,
        Mrs,
        Mstr,
        Prof,
        Rev
    }

    public enum Gender
    {
        Male,
        Female,
        NonBinary,
        Other
    }

    public enum UserRole
    {
        Passenger,
        Employee,
        Administrator
    }

    [Table("Users")]
    public class User
    {
        [Key]
        [StringLength(50)]
        public string UserId { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Username { get; set; } = null!;

        [Required]
        [StringLength(255)]
        public string PasswordHash { get; set; } = null!;

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; } = null!;

        public UserTitle? Title { get; set; }

        [Required]
        [StringLength(30)]
        public string FirstName { get; set; } = null!;

        [Required]
        [StringLength(30)]
        public string LastName { get; set; } = null!;

        [Required]
        public DateTime DateOfBirth { get; set; }

        public Gender? Gender { get; set; }

        [Required]
        public UserRole UserRole { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
