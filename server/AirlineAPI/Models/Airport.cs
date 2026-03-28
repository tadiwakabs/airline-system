using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    [Table("Airport")]
    public class Airport
    {
        [Key,Required,StringLength(3)]
        public string airportCode{get;set;}=string.Empty;
        
        [Required,StringLength(100)]
        public string airportName{get;set;}= string.Empty;

        [Required,StringLength(30)]
        public string city{get;set;}=string.Empty;

        [StringLength(2)]
        public  string? state{get;set;}

        [Required, StringLength(2)]
        public string country{get;set;}=string.Empty;

        [StringLength(50)]
        public string? timezone{get;set;}

        public decimal latitude {get;set;}
        public decimal longitude {get;set;}

        //------links-----
        [ForeignKey("state")]
        public States? States{get;set;}

        [ForeignKey("country")]
        public Countries? Countries{get;set;}

    }
}