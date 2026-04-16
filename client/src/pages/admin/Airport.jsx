import React, { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Dropdown from "../../components/common/Dropdown";
import Separator from "../../components/common/Separator";
import Modal from "../../components/common/Modal";
import {
    getAllAirports,
    createAirport,
    updateAirport,
    deleteAirport,
    getStates,
} from "../../services/airportService";

const emptyForm = {
    airportCode: "",
    airportName: "",
    city: "",
    state: "",
    country: "",
    timezone: "",
    latitude: 0,
    longitude: 0
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
    const [states, setStates] = useState([]);

    useEffect(() => {
        fetchAirports();
        fetchStates();
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

    const fetchStates = async () => {
        try {
            const res = await getStates();
            setStates(res.data);
        } catch (err) {
            console.error("Could not fetch states:", err);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        let val = value;
        if (name === 'latitude' || name === 'longitude') {
            val = value === "" ? 0 : parseFloat(value);
        } else if (name === 'state' && value.trim() === "") {
            val = null;
        }
        setForm({ ...form, [name]: val });
    };

    const handleEdit = (airport) => {
        setForm({
            airportCode: airport.airportCode,
            airportName: airport.airportName,
            city: airport.city,
            state: airport.state || "",
            country: airport.country,
            timezone: airport.timezone || "",
            latitude: airport.latitude || 0,
            longitude: airport.longitude || 0
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
            setError(err.response?.data?.message || "Failed to delete airport.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            setError(err.response?.data?.message || "Failed to save airport.");
        }
    };

    const stateOptions = [
        { label: "All States", value: "" },
        ...states.map(s => ({ label: `${s.code} - ${s.name}`, value: s.code })),
        { label: "OT - International", value: "OT" }
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            {/* Header section matching Flights.jsx */}
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Airports</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage global airport hubs and location data.</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingCode(null); setForm(emptyForm); }}>
                    + Add Airport
                </Button>
            </div>

            {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</p>}

            <Card className="p-6">
                {/* Search & Filter Row */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <TextInput
                        label="Search"
                        placeholder="Search code, name, city..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                    
                    <Dropdown 
                        label="Sort By" 
                        value={sortField} 
                        onChange={(val) => setSortField(val)}
                        options={[
                            { label: "Code", value: "airportCode" },
                            { label: "Name", value: "airportName" },
                            { label: "City", value: "city" },
                            { label: "Country", value: "country" }
                        ]}
                    />

                    <Dropdown 
                        label="Direction" 
                        value={sortDir} 
                        onChange={(val) => setSortDir(val)}
                        options={[
                            { label: "Ascending", value: "asc" },
                            { label: "Descending", value: "desc" }
                        ]}
                    />
                </div>

                <Separator className="my-6" />

                <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-left text-sm text-gray-500">
                                <th className="px-3 py-2">Code</th>
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Location</th>
                                <th className="px-3 py-2">Timezone</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-400 italic">No airports found.</td>
                                </tr>
                            ) : (
                                filtered.map((a) => (
                                    <tr key={a.airportCode} className="rounded-xl bg-gray-50 text-sm hover:bg-gray-100 transition-colors">
                                        <td className="px-3 py-4 font-mono font-bold text-blue-600">{a.airportCode}</td>
                                        <td className="px-3 py-4 text-gray-900 font-medium">{a.airportName}</td>
                                        <td className="px-3 py-4 text-gray-600">
                                            {a.city}, {a.state ? `${a.state}, ` : ""}{a.country}
                                        </td>
                                        <td className="px-3 py-4 text-gray-500 italic">{a.timezone ?? "—"}</td>
                                        <td className="px-3 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(a)}>Edit</Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(a.airportCode)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal for Add/Edit */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={editingCode ? "Edit Airport" : "Add Airport"}
                className="!max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput
                            label="Airport Code (e.g. IAH)"
                            name="airportCode"
                            value={form.airportCode}
                            disabled={!!editingCode}
                            maxLength={3}
                            onChange={(e) => setForm({ ...form, airportCode: e.target.value.toUpperCase() })}
                        />
                        <TextInput
                            label="Airport Name"
                            name="airportName"
                            value={form.airportName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TextInput label="City" name="city" value={form.city} onChange={handleChange} />
                        <Dropdown 
                            label="State" 
                            value={form.state || ""} 
                            onChange={(val) => setForm({...form, state: val})} 
                            options={stateOptions}
                        />
                        <TextInput 
                            label="Country (2 Char)" 
                            name="country" 
                            value={form.country} 
                            maxLength={2} 
                            onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} 
                        />
                    </div>

                    <TextInput label="Timezone (Continent/City)" name="timezone" value={form.timezone} onChange={handleChange} />

                    <div className="grid grid-cols-2 gap-4">
                        <TextInput type="number" step="any" label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} />
                        <TextInput type="number" step="any" label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit">{editingCode ? "Update Details" : "Create Airport"}</Button>
                        <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}