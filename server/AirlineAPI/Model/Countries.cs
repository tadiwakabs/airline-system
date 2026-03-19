using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; 

namespace AirlineAPI.Models
{
    [Table("Countries")]
    public class Countries
    {
        [Key,Required,StringLength(2)]
        public string code{get;set;}=string.Empty;

        [Required,StringLength(100)]
        public string name{get;set;}=string.Empty; //to do- set unique

        [Required, StringLength(5)]
        public string phoneCode{get;set;}=string.Empty;
    }
}