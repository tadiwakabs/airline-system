namespace AirlineAPI.Models
{
    public enum CabinClass
    {
        Economy,
        Business,
        First
    }
 
    public class FlightPricing
    {
        public int FlightNum { get; set; }
        public CabinClass CabinClass { get; set; }
        public decimal Price { get; set; }
 
        // Navigation property
        public Flight? Flight { get; set; }
    }
}
