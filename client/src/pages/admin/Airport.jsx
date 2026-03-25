import React, { useEffect, useState } from "react";
import {
    getAllAirports,
    createAirport,
    updateAirport,
    deleteAirport,
} from "../../services/airportService";

const emptyForm = {
    airportCode: "",
    airportName: "",
    city: "",
    state: "",
    country: "",
    timezone: "",
};

export default function Airports() {
    const [airportList, setAirportList] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingCode, setEditingCode] = useState(null); 
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");
    const [filterText, setFilterText] = useState("");
    const [sortField, setSortField] = useState("airportCode");
    const [sortDir, setSortDir] = useState("asc");

    useEffect(() => {
        fetchAirports();
    }, []);

    useEffect(() => {
        let data = [...airportList];

        if (filterText) {
            const lower = filterText.toLowerCase();
            data = data.filter(
                (a) =>
                    a.airportCode.toLowerCase().includes(lower) ||
                    a.airportName.toLowerCase().includes(lower) ||
                    a.city.toLowerCase().includes(lower) ||
                    a.country.toLowerCase().includes(lower)
            );
        }

        data.sort((a, b) => {
            const valA = a[sortField] ?? "";
            const valB = b[sortField] ?? "";
            if (valA < valB) return sortDir === "asc" ? -1 : 1;
            if (valA > valB) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

        setFiltered(data);
    }, [airportList, filterText, sortField, sortDir]);

    const fetchAirports = async () => {
        try {
            const res = await getAllAirports();
            setAirportList(res.data);
        } catch (err) {
            setError("Failed to load airports.");
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDir("asc");
        }
    };

    const handleEdit = (airport) => {
        setForm({
            airportCode: airport.airportCode,
            airportName: airport.airportName,
            city: airport.city,
            state: airport.state || "",
            country: airport.country,
            timezone: airport.timezone || "",
        });
        setEditingCode(airport.airportCode);
        setShowForm(true);
        setError("");
    };

    const handleDelete = async (code) => {
        if (!window.confirm(`Delete airport ${code}?`)) return;
        try {
            await deleteAirport(code);
            setAirportList((prev) => prev.filter((a) => a.airportCode !== code));
        } catch (err) {
            
            const msg = err.response?.data?.message || "Failed to delete airport.";
            setError(msg);
        }
    };

    const handleSubmit = async () => {
    try {
        setError(""); 
        if (editingCode) {
            await updateAirport(editingCode, form);
            setAirportList((prev) =>
                prev.map((a) => (a.airportCode === editingCode ? { ...a, ...form } : a))
            );
        } else {
            const res = await createAirport(form);
            setAirportList((prev) => [...prev, res.data]);
        }
        
        setShowForm(false);
        setForm(emptyForm);
        setEditingCode(null);

    } catch (err) {
        // 1. Check if the server actually responded (Validation error)
        if (err.response) {
            const serverMsg = err.response.data?.message || "Server rejected the request.";
            setError(`Failed to save: ${serverMsg}`);
        } 
        // 2. Check if the request was made but no response (Server is DOWN)
        else if (err.request) {
            setError("Could not connect to the server. Please ensure the C# Backend is running.");
        } 
        // 3. Something else happened
        else {
            setError("An unexpected error occurred. Please try again.");
        }
        
        console.error("Airport Submit Error:", err);
    }
};

    const handleCancel = () => {
        setShowForm(false);
        setForm(emptyForm);
        setEditingCode(null);
        setError("");
    };

    const sortArrow = (field) => {
        if (sortField !== field) return " ↕";
        return sortDir === "asc" ? " ↑" : " ↓";
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Airports</h1>
                <button
                    onClick={() => { setShowForm(true); setEditingCode(null); setForm(emptyForm); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + Add Airport
                </button>
            </div>

            {error && <p className="text-red-500 mb-3 bg-red-50 p-2 rounded border border-red-200">{error}</p>}

            <input
                type="text"
                placeholder="Filter by code, name, city, or country..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="border px-3 py-2 rounded w-full mb-4 focus:ring-2 focus:ring-blue-400 outline-none"
            />

            {showForm && (
                <div className="border rounded p-4 mb-6 bg-gray-50 shadow-inner">
                    <h2 className="font-semibold mb-3">{editingCode ? "Edit Airport" : "Add Airport"}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <input
                            placeholder="Code (e.g. IAH)"
                            value={form.airportCode}
                            disabled={!!editingCode}
                            maxLength={3}
                            onChange={(e) => setForm({ ...form, airportCode: e.target.value.toUpperCase() })}
                            className="border px-3 py-2 rounded disabled:bg-gray-200"
                        />
                        <input
                            placeholder="Airport Name"
                            value={form.airportName}
                            onChange={(e) => setForm({ ...form, airportName: e.target.value })}
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="City"
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="State (2 chars)"
                            value={form.state}
                            maxLength={2}
                            onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="Country (2 chars)"
                            value={form.country}
                            maxLength={2}
                            onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="Timezone"
                            value={form.timezone}
                            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                            className="border px-3 py-2 rounded"
                        />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            {editingCode ? "Update" : "Create"}
                        </button>
                        <button onClick={handleCancel} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto border rounded">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            {[
                                { label: "Code", field: "airportCode" },
                                { label: "Name", field: "airportName" },
                                { label: "City", field: "city" },
                                { label: "ST", field: "state" },
                                { label: "Country", field: "country" },
                                { label: "Timezone", field: "timezone" },
                            ].map(({ label, field }) => (
                                <th
                                    key={field}
                                    onClick={() => handleSort(field)}
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-200 select-none border-b"
                                >
                                    {label}{sortArrow(field)}
                                </th>
                            ))}
                            <th className="px-4 py-2 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-400">No airports found.</td>
                            </tr>
                        ) : (
                            filtered.map((a) => (
                                <tr key={a.airportCode} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2 font-mono font-bold">{a.airportCode}</td>
                                    <td className="px-4 py-2">{a.airportName}</td>
                                    <td className="px-4 py-2">{a.city}</td>
                                    <td className="px-4 py-2">{a.state ?? "—"}</td>
                                    <td className="px-4 py-2">{a.country}</td>
                                    <td className="px-4 py-2">{a.timezone ?? "—"}</td>
                                    <td className="px-4 py-2 flex gap-3">
                                        <button onClick={() => handleEdit(a)} className="text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(a.airportCode)} className="text-red-500 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}