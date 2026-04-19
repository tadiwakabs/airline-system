using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    [Table("Baggage")]
    public class Baggage
    {
        [Key]
        [Required]
        [StringLength(30)]
        [Column("baggageId")]
        public string baggageId { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        [Column("passengerId")]
        public string passengerId { get; set; } = string.Empty;

        [ForeignKey(nameof(passengerId))]
        public Passenger? Passenger { get; set; }

        [Required]
        public bool additionalBaggage { get; set; } = false;

        [Range(0, double.MaxValue)]
        public double? additionalFare { get; set; } = 0;

        [Required]
        public bool isChecked { get; set; } = false;

        [Required]
        [StringLength(30)]
        public string ticketCode { get; set; } = string.Empty;

        [ForeignKey(nameof(ticketCode))]
        public Ticket? Ticket { get; set; }
    }
}
