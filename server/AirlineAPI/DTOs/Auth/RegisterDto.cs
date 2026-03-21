using System.ComponentModel.DataAnnotations;
using AirlineAPI.Models;

namespace AirlineAPI.DTOs.Auth
{
    public class RegisterDto
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = null!;

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = null!;

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

        // Role is defaulted to Passenger for public registration
        // Set admins and employees through admin portal
        public UserRole UserRole { get; set; } = UserRole.Passenger;
    }
}
