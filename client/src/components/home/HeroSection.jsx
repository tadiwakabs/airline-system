export default function Hero() {
    return (
        <div
            /* Added 'mt-24' to push the hero section down so it doesn't hide behind the floating navbar */
            className="relative h-72 md:h-96 w-full overflow-hidden rounded-2xl mb-10 mt-24 shadow-2xl transition-all duration-500"
            style={{
                background: "linear-gradient(135deg, #1e40af 0%, #0ea5e9 60%, #38bdf8 100%)",
            }}
        >
            {/* Decorative circles */}
            <div
                className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-20"
                style={{ background: "white" }}
            />
            <div
                className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full opacity-10"
                style={{ background: "white" }}
            />

            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-14">
                <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-2 drop-shadow-sm">
                    Airline Ticketing System
                </p>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                    Fly anywhere,<br />
                    <span className="text-blue-200">on your terms.</span>
                </h1>
                <p className="mt-3 text-blue-50 max-w-md text-base md:text-lg font-medium drop-shadow-sm">
                    Search routes, compare prices, and book with confidence.
                </p>
            </div>

            {/* Decorative plane icon */}
            <div className="absolute right-8 bottom-6 md:right-14 md:bottom-8 text-white opacity-20 text-8xl select-none pointer-events-none transform -rotate-12">
                ✈
            </div>
        </div>
    );
}