using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; 

namespace AirlineAPI.Models
{
    [Table("States")]
    public class States
    {
        [Key]
        [Required] 
        [StringLength(2)]
        public string code{get;set;}=string.Empty;

        [Required ,StringLength(128)]
        public string name{get;set;}=string.Empty;

    }
}