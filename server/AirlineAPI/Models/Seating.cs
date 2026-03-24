using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    public enum SeatClass
    {
        Economy,
        Buisness,
        First
    }

    [Table("Seating")]
    public class Seating
    {
        [Key]
        [Required]
        public int flightNum { get; set; }

        [ForeignKey("flightNum")]
        public Flight? Flight { get; set; }

        [Key]
        [Required]
        [StringLength(3)]
        public string seatNumber { get; set; } = string.Empty;

        public bool is_Occupied { get; set; }

        public SeatClass? seatclass { get; set; }
    }
}
