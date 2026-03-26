using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class StatesController :ControllerBase
    {
        private readonly AppDbContext _context;
        public StatesController (AppDbContext context)
        {
            _context = context;
        }
    
        [HttpGet]
        public async Task<ActionResult<IEnumerable<States>>> GetStates()
        {
            var states= await _context.States.OrderBy(s => s.name).ToListAsync();
            return Ok(states);
        }
    }
}