using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Net.Http.Headers;

namespace AirlineAPI.Models
{
    public enum Title
    {
        Dr,
        Ms,
        Mr,
        Mrs,
        Miss,
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
    public class Users
    {
        [Key]
        [Required]
        [StringLength(50)]
        public string userId { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string? username { get; set; } = string.Empty;

        [StringLength(255)]
        public string passwordHash { get; set; } = string.Empty;

        [StringLength(100)]
        public string? email { get; set; } = string.Empty;

        public Title? title { get; set; }

        [Required]
        [StringLength(30)]
        public string firstName { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string lastName { get; set; } = string.Empty;

        [Required]
        public DateTime dateOfBirth { get; set; }

        public Gender? gender { get; set; }

        public UserRole? userRole { get; set; }
    }
}