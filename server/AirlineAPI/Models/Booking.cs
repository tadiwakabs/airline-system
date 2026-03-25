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
        [Required]
        [StringLength(50)]
        public string bookingId { get; set; } = string.Empty;

        [Required]
        public DateTime bookingDate { get; set; }

        [Required]
        public BookingStatus bookingStatus { get; set; }

        [Required]
        [Range(0, 99999999.99)]
        public decimal totalPrice { get; set; }

        [Key]
        [Required]
        [StringLength(50)]
        public string usersId { get; set; } = string.Empty;

        [ForeignKey("userId")]
        public User? Users { get; set; }
    }
}