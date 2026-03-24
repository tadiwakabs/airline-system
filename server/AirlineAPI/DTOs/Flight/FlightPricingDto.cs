namespace AirlineAPI.DTOs.Flight
{
    public class FlightPricingDto
    {
        public string CabinClass { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    public class UpsertFlightPricingDto
    {
        public decimal EconomyPrice { get; set; }
        public decimal BusinessPrice { get; set; }
        public decimal FirstPrice { get; set; }
    }
}
