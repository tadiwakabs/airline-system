using DotNetEnv;
using AirlineApi.Data;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Environment variables
var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
var dbPort = Environment.GetEnvironmentVariable("DB_PORT");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
var dbUser = Environment.GetEnvironmentVariable("DB_USER");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");
var dbSslMode = Environment.GetEnvironmentVariable("DB_SSL_MODE") ?? "Required";

// Build connection string
var connectionString =
    $"Server={dbHost};Port={dbPort};Database={dbName};User ID={dbUser};Password={dbPassword};SslMode={dbSslMode};";

// Store connection string in config
builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;

// Add services
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddScoped<DbConnection>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy
            .WithOrigins(frontendUrl!)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Development tools
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("ReactPolicy");

app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/api/health", () => new { status = "ok" });

app.Run();
