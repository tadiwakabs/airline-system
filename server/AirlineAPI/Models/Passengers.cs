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
        public string passengerId { get; set; } = string.Empty;

        [ForeignKey("passengerId")]
        public Users? Users { get; set; }

        public Title? title { get; set; }

        [Required]
        [StringLength(30)]
        public string firstName { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string lastName { get; set; } = string.Empty;

        public DateTime dateOfBirth { get; set; }

        public Gender? gender { get; set; }

        public int phoneNumber { get; set; }

        [RegularExpression(@".+@.+\..+")]
        public string? email { get; set; }

        public int? DLNumber { get; set; }

        [StringLength(30)]
        public string? passportNumber { get; set; }

        [StringLength(3)]
        public string? passportCountryCode { get; set; }

        public DateTime? passportExpirationDate { get; set; }

        [StringLength(30)]
        public string? placeOfBirth { get; set; }

        [StringLength(3)]
        public string? nationality { get; set; }
    }

    public class RequireDlOrPassportAttribute : ValidationAttribute
    {
        public int? DLNumber { get; set; }
        public string? PassportNumber { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (DLNumber == null && string.IsNullOrWhiteSpace(PassportNumber))
            {
                yield return new ValidationResult(
                    "Either DLNumber or PassportNumber must be provided.",
                    new[] { nameof(DLNumber), nameof(PassportNumber) });
            }
        }
    }
}