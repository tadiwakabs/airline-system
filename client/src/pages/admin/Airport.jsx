import React, { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Dropdown from "../../components/common/Dropdown";
import Separator from "../../components/common/Separator";
import Modal from "../../components/common/Modal";
import Combobox from "../../components/common/Combobox";
import { getCountries, getStates } from "../../services/passengerService";
import { useAuth } from "../../contexts/AuthContext";
import {
    getAllAirports,
    createAirport,
    updateAirport,
    deleteAirport,
} from "../../services/airportService";
import { useFormErrors } from "../../utils/useFormErrors";
import FormError from "../../components/common/FormError";

const emptyForm = {
    airportCode: "",
    airportName: "",
    city: "",
    state: "",
    country: "",
    timezone: "",
    latitude: 0,
    longitude: 0,
};

export default function Airports() {
    const [airportList, setAirportList] = useState([]);
    const [filtered,    setFiltered]    = useState([]);
    const [form,        setForm]        = useState(emptyForm);
    const [editingCode, setEditingCode] = useState(null);
    const [showForm,    setShowForm]    = useState(false);
    const [filterText,  setFilterText]  = useState("");
    const [sortField,   setSortField]   = useState("airportCode");
    const [sortDir,     setSortDir]     = useState("asc");
    const [countries, setCountries] = useState([]);
    const [states,      setStates]      = useState([]);
    const { errors: serverErrors, setErrors: setServerErrors, clearErrors } = useFormErrors();
    const { user } = useAuth();

    const canManageAirports = user?.userRole === "Administrator";

    const [page, setPage] = useState(1);
    const PAGE_SIZE = 50;

    useEffect(() => {
        fetchAirports();
        fetchStates();
        fetchCountries();
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
        setPage(1);
    }, [airportList, filterText, sortField, sortDir]);

    const fetchAirports = async () => {
        try {
            const res = await getAllAirports();
            setAirportList(res.data);
        } catch {
            setServerErrors({ response: { data: "Failed to load airports." } });
        }
    };

    const fetchStates = async () => {
        try {
            const res = await getStates();
            setStates(res.data);
        } catch {
            setServerErrors({ response: { data: "Failed to load state list." } });
        }
    };

    const fetchCountries = async () => {
        try {
            const res = await getCountries();
            setCountries(res.data);
        } catch {
            setServerErrors({ response: { data: "Failed to load country list." } });
        }
    };

    const handleSort = (field) => {
        if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let val = value;
        if (name === "latitude" || name === "longitude") {
            val = value === "" ? 0 : parseFloat(value);
        } else if (name === "state" && value.trim() === "") {
            val = null;
        }
        setForm({ ...form, [name]: val });
    };

    const handleEdit = (airport) => {
        setForm({
            airportCode: airport.airportCode,
            airportName: airport.airportName,
            city:        airport.city,
            state:       airport.state || "",
            country:     airport.country,
            timezone:    airport.timezone || "",
            latitude:    airport.latitude || 0,
            longitude:   airport.longitude || 0,
        });
        setEditingCode(airport.airportCode);
        setShowForm(true);
        clearErrors();
    };

    const handleDelete = async (code) => {
        if (!window.confirm(`Delete airport ${code}?`)) return;
        try {
            clearErrors();
            await deleteAirport(code);
            setAirportList((prev) => prev.filter((a) => a.airportCode !== code));
        } catch (err) {
            setServerErrors(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            clearErrors();
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
            setServerErrors(err);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setForm(emptyForm);
        setEditingCode(null);
        clearErrors();
    };

    const sortArrow = (field) => {
        if (sortField !== field) return " ↕";
        return sortDir === "asc" ? " ↑" : " ↓";
    };

    const countryOptions = countries.map((c) => ({
        label: c.name,
        value: c.code,
    }));

    const stateOptions = [
        { label: "-- Select State --", value: "" },
        ...states.map((s) => ({ label: `${s.name} (${s.code})`, value: s.code })),
        { label: "Other/International (OT)", value: "OT" },
    ];

    const isUSA = form.country === "US";
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            {/* Page Header */}
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Airports</h1>
                    <p className="mt-1 text-sm text-gray-200">View and manage airport locations and details.</p>
                </div>
                {canManageAirports && (
                    <Button onClick={() => { setShowForm(true); setEditingCode(null); setForm(emptyForm); clearErrors(); }}>
                        + Add Airport
                    </Button>
                )}
            </div>

            {/* Main Content Card */}
            <Card className="p-6">
                {/* Search & Sort Row */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <TextInput
                        label="Search"
                        placeholder="Code, name, city, country..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                    <Dropdown
                        label="Sort by Code"
                        value={sortField === "airportCode" ? sortDir : ""}
                        onChange={(val) => { setSortField("airportCode"); setSortDir(val || "asc"); }}
                        options={[
                            { label: "Default", value: "" },
                            { label: "A-Z", value: "asc" },
                            { label: "Z-A", value: "desc" },
                        ]}
                    />
                    <Dropdown
                        label="Sort by City"
                        value={sortField === "city" ? sortDir : ""}
                        onChange={(val) => { setSortField("city"); setSortDir(val || "asc"); }}
                        options={[
                            { label: "Default", value: "" },
                            { label: "A-Z", value: "asc" },
                            { label: "Z-A", value: "desc" },
                        ]}
                    />
                    <Dropdown
                        label="Sort by Country"
                        value={sortField === "country" ? sortDir : ""}
                        onChange={(val) => { setSortField("country"); setSortDir(val || "asc"); }}
                        options={[
                            { label: "Default", value: "" },
                            { label: "A-Z", value: "asc" },
                            { label: "Z-A", value: "desc" },
                        ]}
                    />
                </div>

                <Separator className="my-6" />

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2">
                        <thead>
                        <tr className="text-left text-sm text-gray-500">
                            <th className="px-3 py-2 cursor-pointer select-none" onClick={() => handleSort("airportCode")}>
                                Code{sortArrow("airportCode")}
                            </th>
                            <th className="px-3 py-2 cursor-pointer select-none" onClick={() => handleSort("airportName")}>
                                Name{sortArrow("airportName")}
                            </th>
                            <th className="px-3 py-2 cursor-pointer select-none" onClick={() => handleSort("city")}>
                                City{sortArrow("city")}
                            </th>
                            <th className="px-3 py-2 text-center">ST</th>
                            <th className="px-3 py-2 cursor-pointer select-none" onClick={() => handleSort("country")}>
                                Country{sortArrow("country")}
                            </th>
                            <th className="px-3 py-2">Timezone</th>
                            {canManageAirports && <th className="px-3 py-2 text-right">Actions</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={canManageAirports ? 7 : 6} className="text-center py-10 text-gray-400 italic">
                                    No airports found.
                                </td>
                            </tr>
                        ) : (
                            paginated.map((a) => (
                                <tr key={a.airportCode} className="rounded-xl bg-gray-50 text-sm hover:bg-gray-100 transition-colors">
                                    <td className="px-3 py-4 font-bold text-blue-600">{a.airportCode}</td>
                                    <td className="px-3 py-4 text-gray-800 font-medium">{a.airportName}</td>
                                    <td className="px-3 py-4 text-gray-600">{a.city}</td>
                                    <td className="px-3 py-4 text-center">
                                            <span className="bg-white border border-gray-200 px-2 py-1 rounded text-xs font-bold shadow-sm uppercase">
                                                {a.state ?? "—"}
                                            </span>
                                    </td>
                                    <td className="px-3 py-4 text-gray-600">{a.country}</td>
                                    <td className="px-3 py-4 text-gray-600">{a.timezone ?? "—"}</td>
                                    {canManageAirports && (
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
                                    )}
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                            <p>{filtered.length} airports — page {page} of {totalPages}</p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                                    Previous
                                </Button>
                                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
            {canManageAirports && (
                <Modal
                    isOpen={showForm}
                    onClose={handleCancel}
                    title={editingCode ? "Edit Airport" : "Add New Airport"}
                    className="!max-w-xl"
                >
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <FormError errors={serverErrors} />
                        <div className="grid grid-cols-2 gap-4">
                            <TextInput
                                label="Airport Code"
                                placeholder="e.g. IAH"
                                value={form.airportCode}
                                disabled={!!editingCode}
                                onChange={(e) => setForm({ ...form, airportCode: e.target.value.toUpperCase() })}
                                charLimit={3}
                            />
                            <Combobox
                                label="Country"
                                value={form.country}
                                onChange={(val) => setForm({ ...form, country: val })}
                                options={countryOptions}
                                placeholder="Search country..."
                                emptyMessage="No countries found"
                            />
                        </div>
                        <TextInput
                            label="Airport Name"
                            placeholder="e.g. George Bush Intercontinental"
                            value={form.airportName}
                            onChange={(e) => setForm({ ...form, airportName: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <TextInput
                                label="City"
                                placeholder="e.g. Houston"
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                            />
                            <Combobox
                                label="State"
                                value={isUSA ? (form.state || "") : ""}
                                onChange={(val) => setForm({ ...form, state: val || null })}
                                options={stateOptions}
                                placeholder={isUSA ? "Search state..." : "Select US first"}
                                emptyMessage="No states found"
                                disabled={!isUSA}
                            />
                        </div>
                        <TextInput
                            label="Timezone"
                            placeholder="e.g. America/Chicago"
                            value={form.timezone}
                            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <TextInput
                                label="Latitude"
                                type="number"
                                placeholder="e.g. 29.9844"
                                value={form.latitude}
                                name="latitude"
                                onChange={handleChange}
                            />
                            <TextInput
                                label="Longitude"
                                type="number"
                                placeholder="e.g. -95.3414"
                                value={form.longitude}
                                name="longitude"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button type="submit">{editingCode ? "Save Changes" : "Create Airport"}</Button>
                            <Button variant="outline" type="button" onClick={handleCancel}>Cancel</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
