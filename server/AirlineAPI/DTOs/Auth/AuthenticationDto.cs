namespace AirlineAPI.DTOs.Auth
{
    public class AuthenticationDto
    {
        public string UserId { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string UserRole { get; set; } = null!;
        public string? Department { get; set; }
        public string Token { get; set; } = null!;
    }
}
