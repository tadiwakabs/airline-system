using System.ComponentModel.DataAnnotations;

namespace AirlineAPI.DTOs.Employee
{
    // ── Response DTO ──────────────────────────────────────────────────────────

    public class EmployeeDto
    {
        public string  EmployeeId   { get; set; } = null!;
        public string  UserId       { get; set; } = null!;
        public string? FirstName    { get; set; }
        public string? LastName     { get; set; }
        public string  WorkEmail    { get; set; } = null!;
        public int?    WorkPhone    { get; set; }
        public string? JobTitle     { get; set; }
        public string? Department   { get; set; }
        public DateTime? HireDate   { get; set; }
        public string  WorkLocation { get; set; } = null!;
        public string  Status       { get; set; } = null!;
        public bool    IsAdmin      { get; set; }
    }

    // ── Create DTO ────────────────────────────────────────────────────────────

    public class CreateEmployeeDto
    {
        [Required]
        [StringLength(50)]
        public string UserId { get; set; } = null!;

        [Required]
        [StringLength(100)]
        [EmailAddress]
        [RegularExpression(@".*@airline\.com$", ErrorMessage = "Work email must end with @airline.com")]
        public string WorkEmail { get; set; } = null!;

        public int? WorkPhone { get; set; }

        [StringLength(50)]
        public string? JobTitle { get; set; }

        [StringLength(50)]
        public string? Department { get; set; }

        public DateTime? HireDate { get; set; }

        [Required]
        [StringLength(3, MinimumLength = 3, ErrorMessage = "Work location must be a 3-letter IATA code.")]
        public string WorkLocation { get; set; } = null!;

        [Required]
        public string Status { get; set; } = "Active";

        public bool IsAdmin { get; set; } = false;
    }

    // ── Update DTO ────────────────────────────────────────────────────────────

    public class UpdateEmployeeDto
    {
        [Required]
        [StringLength(100)]
        [EmailAddress]
        [RegularExpression(@".*@airline\.com$", ErrorMessage = "Work email must end with @airline.com")]
        public string WorkEmail { get; set; } = null!;

        public int? WorkPhone { get; set; }

        [StringLength(50)]
        public string? JobTitle { get; set; }

        [StringLength(50)]
        public string? Department { get; set; }

        public DateTime? HireDate { get; set; }

        [Required]
        [StringLength(3, MinimumLength = 3, ErrorMessage = "Work location must be a 3-letter IATA code.")]
        public string WorkLocation { get; set; } = null!;

        [Required]
        public string Status { get; set; } = null!;

        public bool IsAdmin { get; set; }
    }
}
