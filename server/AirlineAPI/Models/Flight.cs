using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    [Table("Flight")] 
    public class Flight
    {
        [Key]
        [Required]
        [Range(0,9999)]
        public int flightNum { get; set; }

        [Required]
        [StringLength(30)]
        public string departTime { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string arrivalTime { get; set; } = string.Empty;
        
        [Required]
        [StringLength(10)]
        public string aircraftUsed { get; set; } = string.Empty;
        
        [Required]
        public string status { get; set; } = string.Empty; 

        [Required]
        [StringLength(30)]
        public string departingPort { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string arrivingPort { get; set; } = string.Empty;

        public bool isDomestic { get; set; }
        public int distance { get; set; }
        public bool? flightChange { get; set; }

        //----Links----
        [ForeignKey("aircraftUsed")]
        public Aircraft? Aircraft{get;set;}

        [ForeignKey("departingPort")]
        public Airport? DepartingPort{get;set;}

        [ForeignKey("arrivingPort")]
        public Airport? ArrivingPort{get;set;}
    }
}