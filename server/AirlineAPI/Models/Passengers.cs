using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    [Table("Passenger")]
    public class Passenger
    {
        [Key]
        [Required]
        [StringLength(50)]
        public string PassengerId { get; set; } = string.Empty;

        [StringLength(50)]
        public string? UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

        public UserTitle? Title { get; set; }

        [Required]
        [StringLength(30)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfBirth { get; set; }

        public Gender? Gender { get; set; }

        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        [RegularExpression(@".+@.+\..+")]
        [StringLength(100)]
        public string? Email { get; set; }

        public int? DLNumber { get; set; }

        [StringLength(20)]
        public string? PassportNumber { get; set; }

        [StringLength(3)]
        public string? PassportCountryCode { get; set; }

        public DateTime? PassportExpirationDate { get; set; }

        [StringLength(30)]
        public string? PlaceOfBirth { get; set; }

        [StringLength(3)]
        public string? Nationality { get; set; }

        [Required]
        public PassengerType PassengerType { get; set; } = PassengerType.Adult;
    }

    public enum PassengerType
    {
        Adult,
        Child,
        Infant
    }
}
