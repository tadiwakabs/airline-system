namespace AirlineAPI.Models
{
    public class Standby
    {
        public int standbyId { get; set; }
        public int flightNum { get; set; }
        public string passengerId { get; set; } = string.Empty;
        public DateTime requestTime { get; set; }
        public string standbyStatus { get; set; } = string.Empty;
        public DateTime? offerExpiresAt { get; set; }
    }
}