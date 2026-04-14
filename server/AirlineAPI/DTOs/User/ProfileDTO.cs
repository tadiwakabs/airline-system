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

        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public DateTime? DateOfBirth { get; set; }
    }
    
    // DTO for updating passenger-specific information
    public class UpdatePassengerProfileDto
    {
        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        public int? DLNumber { get; set; }

        [StringLength(2)]
        public string? DLState { get; set; }

        [StringLength(20)]
        public string? PassportNumber { get; set; }

        [StringLength(2)]
        public string? PassportCountryCode { get; set; }

        public DateTime? PassportExpirationDate { get; set; }

        [StringLength(30)]
        public string? PlaceOfBirth { get; set; }

        [StringLength(2)]
        public string? Nationality { get; set; }
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
    
	public class SavedPassengerDto
	{
    	public string PassengerId { get; set; } = null!;
    	public string? OwnerUserId { get; set; }
    	public string? Title { get; set; }
    	public string FirstName { get; set; } = null!;
    	public string LastName { get; set; } = null!;
    	public DateTime DateOfBirth { get; set; }
    	public string? Gender { get; set; }
    	public string? PhoneNumber { get; set; }
    	public string? Email { get; set; }
    	public int? DLNumber { get; set; }
	    public string? DLState { get; set; }
		public string? PassportNumber { get; set; }
    	public string? PassportCountryCode { get; set; }
    	public DateTime? PassportExpirationDate { get; set; }
    	public string? PlaceOfBirth { get; set; }
    	public string? Nationality { get; set; }
    	public string PassengerType { get; set; } = "Adult";
	}

	public class CreateSavedPassengerDto
	{
    	public string? Title { get; set; }

    	[Required]
    	[StringLength(30)]
    	public string FirstName { get; set; } = null!;

    	[Required]
        [StringLength(30)]
        public string LastName { get; set; } = null!;

        [Required]
        public DateTime DateOfBirth { get; set; }

        public string? Gender { get; set; }

        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        [EmailAddress]
        [StringLength(100)]
        public string? Email { get; set; }

        public int? DLNumber { get; set; }

        [StringLength(2)]
        public string? DLState { get; set; }

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
    	public string PassengerType { get; set; } = "Adult";
	}

	public class UpdateSavedPassengerDto : CreateSavedPassengerDto
	{
	}


}
