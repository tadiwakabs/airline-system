using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    public enum TicketStatus { Booked, Cancelled, Pending }
    public enum TicketClass  { Economy, Business, First }

    [Table("Ticket")]
    public class Ticket
    {
        [Key, Required, StringLength(30)]
        public string ticketCode { get; set; } = string.Empty;

        [Required, StringLength(50)]
        public string bookingId { get; set; } = string.Empty;

        [ForeignKey("bookingId")]
        public Booking? Booking { get; set; }

        [Required]
        public decimal price { get; set; }

        [Required]
        public DateTime issueDate { get; set; }

        [Required, StringLength(100)]
        public string origin { get; set; } = string.Empty;

        [Required, StringLength(100)]
        public string destination { get; set; } = string.Empty;

        [StringLength(30)]
        public string? boardingTime { get; set; }      // fixed typo

        [Required, StringLength(3)]
        public string seatNumber { get; set; } = string.Empty;

        [Required]
        public int flightCode { get; set; }             // matches FK in SQL

        [ForeignKey("flightCode")]
        public Flight? Flight { get; set; }

        [ForeignKey("flightCode,seatNumber")]
        public Seating? Seating { get; set; }

        public TicketStatus? status { get; set; }
        public TicketClass?  ticketClass { get; set; }

        [Required, StringLength(50)]
        public string passengerId { get; set; } = string.Empty;

        [ForeignKey("passengerId")]
        public Passenger? Passenger { get; set; }

        public DateTime? reservationTime { get; set; }  // fixed typo
        public DateTime? expiresAt { get; set; }
    }
}
