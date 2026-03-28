using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    public enum PaymentStatus
    {
        Pending,
        Sucess,
        Failed,
        Cancelled,
        Refunded
    }

    [Table("Payment")]
    public class Payment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int transactionId { get; set; }

        [Required]
        [StringLength(50)]
        public string userId { get; set; } = string.Empty;

        [ForeignKey("userId")]
        public User? Users { get; set; }

        [Required]
        [StringLength(50)]
        public string bookingId { get; set; } = string.Empty;

        [ForeignKey("bookingId")]
        public Booking? Booking { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public double bookingPrice { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public double totalPrice { get; set; }

        [Required]
        [StringLength(30)]
        public string paymentMethod { get; set; } = string.Empty;

        public PaymentStatus? paymentStatus { get; set; }
    }
}