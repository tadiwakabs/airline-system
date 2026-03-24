using System.ComponentModel.DataAnnotations;

namespace AirlineAPI.DTOs.User
{
    // DTO for reading profile information
    public class ProfileDto
    {
        public string UserId { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Title { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public DateTime DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string UserRole { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
    
    // DTO for updating profile information
    public class UpdateProfileDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        public string? Title { get; set; }

        public string? Gender { get; set; }
    }
    
    // DTO for changing password
    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = null!;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = null!;
    }
}
