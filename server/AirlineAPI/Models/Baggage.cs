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
        public string baggageID { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string PassengerId { get; set; } = string.Empty;

        [ForeignKey(nameof(PassengerId))]
        public Passenger? Passenger { get; set; }

        public bool additionalBaggage { get; set; } = false;

        [Range(0, double.MaxValue)]
        public double? additionalFare { get; set; }

        public bool isChecked { get; set; }

        [StringLength(30)]
        public string? ticketCode { get; set; }

        [ForeignKey(nameof(ticketCode))]
        public Ticket? Ticket { get; set; }
    }
}