using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace AirlineAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly IConfiguration _config;

    public TestController(IConfiguration config)
    {
        _config = config;
    }

    [HttpGet("db")]
    public async Task<IActionResult> TestDatabase()
    {
        try
        {
            var connString = _config.GetConnectionString("DefaultConnection");

            await using var connection = new MySqlConnection(connString);
            await connection.OpenAsync();

            var cmd = new MySqlCommand("SELECT 1", connection);
            var result = await cmd.ExecuteScalarAsync();

            return Ok(new
            {
                status = "success",
                message = "Database connection successful",
                result
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = "error",
                message = ex.Message
            });
        }
    }
}