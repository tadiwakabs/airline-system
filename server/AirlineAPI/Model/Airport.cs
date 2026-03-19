using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    [Table("Airport")]
    public class Airport
    {
        [Key,Required,StringLength(3)]
        public string airportCode{get;set;}=string.Empty;
    }
}
