using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.SignalR;

namespace AirlineAPI.Models
{
    [Table("Baggage")]
    public class Baggage
    {
        [Key]
        [Required]
        [StringLength(30)]
        public string baggageID { get; set; } = string.Empty;

        [ForeignKey("baggageId")]
        public Passenger? Passengers { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int baggageCount { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public double baggageFare { get; set; }

        public bool additionalBaggage { get; set; } = false;

        [Range(0, double.MaxValue)]
        public double? additionalFare { get; set; }

        public bool isChecked { get; set; }

        [Required]
        [StringLength(30)]
        public string ticketCode { get; set; } = string.Empty;

        [ForeignKey("ticketCode")]
        public Ticket? Ticket { get; set; }
    }
}