using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    public enum BookingStatus
    {
        Confirmed,
        Pending,
        Cancelled,
        Completed
    }

    [Table("Booking")]
    public class Booking
    {
        [Key]
        [StringLength(50)]
        public string bookingId { get; set; } = string.Empty;

        public DateTime? bookingDate { get; set; }

        public BookingStatus? bookingStatus { get; set; }

        [Required]
        [Range(0, 99999999.99)]
        public decimal totalPrice { get; set; }

        [Required]
        [StringLength(50)]
        public string? UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public User? Users { get; set; }
    }
}