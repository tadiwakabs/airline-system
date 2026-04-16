import React, { useEffect, useRef, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Dropdown from "../../components/common/Dropdown";
import Separator from "../../components/common/Separator";
import Modal from "../../components/common/Modal";
import {
    getAllAircraft,
    createAircraft,
    updateAircraft,
    deleteAircraft,
} from "../../services/aircraftService";

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
    const [editingTail, setEditingTail] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");
    const [filterText, setFilterText] = useState("");
    const [sortField, setSortField] = useState("tailnumber");
    const [sortDir, setSortDir] = useState("asc");

    // Import modal state
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => { fetchAircraft(); }, []);

    // Filter and Sort Logic
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
        } catch {
            setError("Failed to load aircraft data.");
        }
    };

    const handleSort = (field) => {
        if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
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
    };

    const handleDelete = async (tailnumber) => {
        if (!window.confirm(`Delete aircraft ${tailnumber}?`)) return;
        try {
            await deleteAircraft(tailnumber);
            setAircraftList((prev) => prev.filter((a) => a.tailnumber !== tailnumber));
        } catch {
            setError("Failed to delete aircraft.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
        } catch {
            setError("Failed to save aircraft.");
        }
    };

    const sortArrow = (field) => {
        if (sortField !== field) return " ↕";
        return sortDir === "asc" ? " ↑" : " ↓";
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            {/* Page Header */}
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Aircraft Fleet</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage and monitor aircraft specifications and locations.</p>
                </div>
                <div className="flex gap-4">
                    <Button onClick={() => { setShowForm(true); setEditingTail(null); setForm(emptyForm); }}>
                        + Add Aircraft
                    </Button>
                    <Button variant="outline" onClick={() => setImportOpen(true)}>
                        Import CSV
                    </Button>
                </div>
            </div>

            {error && <p className="mb-4 text-sm text-red-600 font-medium bg-red-50 p-2 rounded">{error}</p>}

            {/* Main Content Card */}
            <Card className="p-6">
                {/* Search & Sort Row - Matches Flights.jsx Layout */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <TextInput
                        label="Search"
                        placeholder="Tail #, model..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />

                    <Dropdown 
                        label="Manufacturer"
                        value={sortField === "manufacturerName" ? sortDir : ""}
                        onChange={(val) => { setSortField("manufacturerName"); setSortDir(val || "asc"); }}
                        options={[
                            { label: "Default", value: "" },
                            { label: "A-Z", value: "asc" },
                            { label: "Z-A", value: "desc" },
                        ]}
                    />

                    <Dropdown 
                        label="Capacity"
                        value={sortField === "numSeats" ? sortDir : ""}
                        onChange={(val) => { setSortField("numSeats"); setSortDir(val || "asc"); }}
                        options={[
                            { label: "Default", value: "" },
                            { label: "High to Low", value: "desc" },
                            { label: "Low to High", value: "asc" },
                        ]}
                    />

                    <Dropdown 
                        label="Location"
                        value={sortField === "currentAirportCode" ? sortDir : ""}
                        onChange={(val) => { setSortField("currentAirportCode"); setSortDir(val || "asc"); }}
                        options={[
                            { label: "Default", value: "" },
                            { label: "Airport A-Z", value: "asc" },
                            { label: "Airport Z-A", value: "desc" },
                        ]}
                    />
                </div>

                <Separator className="my-6" />

                {/* Table Section */}
                <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-left text-sm text-gray-500">
                                <th className="px-3 py-2 cursor-pointer select-none" onClick={() => handleSort("tailnumber")}>
                                    Tail Number {sortArrow("tailnumber")}
                                </th>
                                <th className="px-3 py-2">Model</th>
                                <th className="px-3 py-2 text-center">Seats</th>
                                <th className="px-3 py-2">Manufacturer</th>
                                <th className="px-3 py-2 text-center">Airport</th>
                                <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-400 italic">No aircraft records found.</td>
                                </tr>
                            ) : (
                                filtered.map((a) => (
                                    <tr key={a.tailnumber} className="rounded-xl bg-gray-50 text-sm hover:bg-gray-100 transition-colors">
                                        <td className="px-3 py-4 font-bold text-blue-600">{a.tailnumber}</td>
                                        <td className="px-3 py-4 text-gray-800 font-medium">{a.planeType ?? "—"}</td>
                                        <td className="px-3 py-4 text-center text-gray-600">{a.numSeats}</td>
                                        <td className="px-3 py-4 text-gray-600">{a.manufacturerName ?? "—"}</td>
                                        <td className="px-3 py-4 text-center">
                                            <span className="bg-white border border-gray-200 px-2 py-1 rounded text-xs font-bold shadow-sm uppercase">
                                                {a.currentAirportCode}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(a)}>Edit</Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="border-red-200 text-red-600 hover:bg-red-50" 
                                                    onClick={() => handleDelete(a.tailnumber)}
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

            {/* Add / Edit Modal */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={editingTail ? "Edit Aircraft" : "Add New Aircraft"}
                className="!max-w-xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <TextInput 
                        label="Tail Number" 
                        value={form.tailnumber} 
                        disabled={!!editingTail} 
                        onChange={(e) => setForm({ ...form, tailnumber: e.target.value })} 
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput label="Plane Type" value={form.planeType} onChange={(e) => setForm({ ...form, planeType: e.target.value })} />
                        <TextInput label="Seats" type="number" value={form.numSeats} onChange={(e) => setForm({ ...form, numSeats: parseInt(e.target.value) })} />
                    </div>
                    <TextInput label="Manufacturer" value={form.manufacturerName} onChange={(e) => setForm({ ...form, manufacturerName: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput label="Range (miles)" type="number" value={form.flightRange} onChange={(e) => setForm({ ...form, flightRange: parseInt(e.target.value) })} />
                        <TextInput label="Airport Code" value={form.currentAirportCode} onChange={(e) => setForm({ ...form, currentAirportCode: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="submit">{editingTail ? "Save Changes" : "Create Aircraft"}</Button>
                        <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}