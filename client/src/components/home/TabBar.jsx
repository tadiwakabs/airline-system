export default function TabBar({ active, onChange }) {
    const tabs = [
        { id: "search", label: "✈ Search Flights" },
        { id: "status", label: "🔍 Flight Status" },
    ];
    return (
        <div className="flex gap-2 mb-4">
            {tabs.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onChange(t.id)}
                    className={[
                        "px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150",
                        active === t.id
                            ? "bg-blue-600 text-white shadow"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}
