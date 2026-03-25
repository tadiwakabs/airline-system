using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    public enum Status
    {
        Booked,
        Cancelled,
        Pending
    }

    public enum TicketClass
    {
        Economy,
        Buisness,
        First
    }

    [Table("Ticket")]
    public class Ticket
    {
        [Key]
        [Required]
        [StringLength(30)]
        public string ticketCode { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string bookingId { get; set; } = string.Empty;

        [ForeignKey("bookingId")]
        public Booking? Booking { get; set; }

        [Required]
        public decimal price { get; set; }

        [Required]
        public DateTime issueDate { get; set; }

        [Required]
        [StringLength(100)]
        public string origin { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string destination { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string boardingTIme { get; set; } = string.Empty;

        [Required]
        [StringLength(3)]
        public string seatNumber { get; set; } = string.Empty;

        [ForeignKey("seatNumber")]
        public Seating? Seating { get; set; }

        [Required]
        public int flightCode { get; set; }

        [ForeignKey("flightCode")]
        public Flight? Flight { get; set; }

        public Status? status { get; set; }

        public TicketClass? ticketClass { get; set; }

        [Required]
        [StringLength(50)]
        public string passengerId { get; set; } = string.Empty;

        public DateTime? reservationTIme { get; set; }

        public DateOnly? datetime { get; set; }
    }
}