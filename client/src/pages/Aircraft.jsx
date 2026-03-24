import React, { useEffect, useState } from "react";
import {
    getAllAircraft,
    createAircraft,
    updateAircraft,
    deleteAircraft,
} from "../services/aircraftService";

const emptyForm = {
    tailnumber: "",
    planeType: "",
    numSeats: "",
    manufacturerName: "",
    flightRange: "",
    currentAirportCode: "",
};

export default function Aircraft() {
    const [aircraftList, setAircraftList] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingTail, setEditingTail] = useState(null); // null = adding, string = editing
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");
    const [filterText, setFilterText] = useState("");
    const [sortField, setSortField] = useState("tailnumber");
    const [sortDir, setSortDir] = useState("asc");

    // Load all aircraft on mount
    useEffect(() => {
        fetchAircraft();
    }, []);

    // Re-filter/sort whenever data, filter, or sort changes
    useEffect(() => {
        let data = [...aircraftList];

        if (filterText) {
            const lower = filterText.toLowerCase();
            data = data.filter(
                (a) =>
                    a.tailnumber.toLowerCase().includes(lower) ||
                    (a.planeType && a.planeType.toLowerCase().includes(lower)) ||
                    (a.manufacturerName && a.manufacturerName.toLowerCase().includes(lower))
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
    }, [aircraftList, filterText, sortField, sortDir]);

    const fetchAircraft = async () => {
        try {
            const res = await getAllAircraft();
            setAircraftList(res.data);
        } catch (err) {
            setError("Failed to load aircraft.");
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

    const handleEdit = (aircraft) => {
        setForm({
            tailnumber: aircraft.tailnumber,
            planeType: aircraft.planeType || "",
            numSeats: aircraft.numSeats,
            manufacturerName: aircraft.manufacturerName || "",
            flightRange: aircraft.flightRange,
            currentAirportCode: aircraft.currentAirportCode,
        });
        setEditingTail(aircraft.tailnumber);
        setShowForm(true);
        setError("");
    };

    const handleDelete = async (tailnumber) => {
        if (!window.confirm(`Delete aircraft ${tailnumber}?`)) return;
        try {
            await deleteAircraft(tailnumber);
            setAircraftList((prev) => prev.filter((a) => a.tailnumber !== tailnumber));
        } catch (err) {
            setError("Failed to delete aircraft.");
        }
    };

    const handleSubmit = async () => {
        try {
            if (editingTail) {
                await updateAircraft(editingTail, form);
                setAircraftList((prev) =>
                    prev.map((a) => (a.tailnumber === editingTail ? { ...a, ...form } : a))
                );
            } else {
                const res = await createAircraft(form);
                setAircraftList((prev) => [...prev, res.data]);
            }
            setShowForm(false);
            setForm(emptyForm);
            setEditingTail(null);
            setError("");
        } catch (err) {
            setError("Failed to save aircraft.");
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setForm(emptyForm);
        setEditingTail(null);
        setError("");
    };

    const sortArrow = (field) => {
        if (sortField !== field) return " ↕";
        return sortDir === "asc" ? " ↑" : " ↓";
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Aircraft</h1>
                <button
                    onClick={() => { setShowForm(true); setEditingTail(null); setForm(emptyForm); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + Add Aircraft
                </button>
            </div>

            {error && <p className="text-red-500 mb-3">{error}</p>}

            {/* Filter */}
            <input
                type="text"
                placeholder="Filter by tail number, type, or manufacturer..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="border px-3 py-2 rounded w-full mb-4"
            />

            {/* Add / Edit Form */}
            {showForm && (
                <div className="border rounded p-4 mb-6 bg-gray-50">
                    <h2 className="font-semibold mb-3">{editingTail ? "Edit Aircraft" : "Add Aircraft"}</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            placeholder="Tail Number"
                            value={form.tailnumber}
                            disabled={!!editingTail}
                            onChange={(e) => setForm({ ...form, tailnumber: e.target.value })}
                            className="border px-3 py-2 rounded disabled:bg-gray-200"
                        />
                        <input
                            placeholder="Plane Type"
                            value={form.planeType}
                            onChange={(e) => setForm({ ...form, planeType: e.target.value })}
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="Num Seats (200-300)"
                            type="number"
                            value={form.numSeats}
                            onChange={(e) => setForm({ ...form, numSeats: parseInt(e.target.value) })}
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="Manufacturer"
                            value={form.manufacturerName}
                            onChange={(e) => setForm({ ...form, manufacturerName: e.target.value })}
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="Flight Range (9000-11000)"
                            type="number"
                            value={form.flightRange}
                            onChange={(e) => setForm({ ...form, flightRange: parseInt(e.target.value) })}
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="Current Airport Code"
                            value={form.currentAirportCode}
                            onChange={(e) => setForm({ ...form, currentAirportCode: e.target.value })}
                            className="border px-3 py-2 rounded"
                        />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleSubmit}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            {editingTail ? "Save Changes" : "Create"}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-gray-100 text-left">
                        {[
                            { label: "Tail Number", field: "tailnumber" },
                            { label: "Type", field: "planeType" },
                            { label: "Seats", field: "numSeats" },
                            { label: "Manufacturer", field: "manufacturerName" },
                            { label: "Range (km)", field: "flightRange" },
                            { label: "Airport", field: "currentAirportCode" },
                        ].map(({ label, field }) => (
                            <th
                                key={field}
                                onClick={() => handleSort(field)}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-200 select-none"
                            >
                                {label}{sortArrow(field)}
                            </th>
                        ))}
                        <th className="px-4 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-6 text-gray-400">
                                No aircraft found.
                            </td>
                        </tr>
                    ) : (
                        filtered.map((a) => (
                            <tr key={a.tailnumber} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2">{a.tailnumber}</td>
                                <td className="px-4 py-2">{a.planeType ?? "—"}</td>
                                <td className="px-4 py-2">{a.numSeats}</td>
                                <td className="px-4 py-2">{a.manufacturerName ?? "—"}</td>
                                <td className="px-4 py-2">{a.flightRange}</td>
                                <td className="px-4 py-2">{a.currentAirportCode}</td>
                                <td className="px-4 py-2 flex gap-2">
                                    <button
                                        onClick={() => handleEdit(a)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(a.tailnumber)}
                                        className="text-red-500 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}