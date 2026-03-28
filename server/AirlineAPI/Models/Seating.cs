using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    public enum SeatClass
    {
        Economy,
        Business,
        First
    }

    public enum SeatStatus
    {
        Available,
        Reserved,
        Occupied
    }

    [Table("Seating")]
    public class Seating
    {
   
        [Required]
        public int flightNum { get; set; }

        [ForeignKey("flightNum")]
        public Flight? Flight { get; set; }


        [Required]
        [StringLength(5)]
        public string seatNumber { get; set; } = string.Empty;

        public SeatClass? seatclass { get; set; }

        [Required]
        public SeatStatus seatStatus { get; set; } = SeatStatus.Available;

        [StringLength(50)]
        public string? passengerId { get; set; }

        [ForeignKey("passengerId")]
        public Passenger? Passenger { get; set; }
        
        // Remove for now
        // [StringLength(50)]
        // public string? ticketCode { get; set; }

        public DateTime? holdExpiresAt { get; set; }
    }
}
