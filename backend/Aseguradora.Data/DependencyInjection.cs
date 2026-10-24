using Aseguradora.Data.Repositories;
using Aseguradora.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Aseguradora.Data;

public static class DependencyInjection
{
    public static IServiceCollection AddData(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AseguradoraDbContext>(options => options.UseSqlServer(connectionString));
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        return services;
    }
}
