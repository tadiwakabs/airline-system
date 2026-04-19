import React, { useEffect, useRef, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Dropdown from "../../components/common/Dropdown";
import Separator from "../../components/common/Separator";
import Modal from "../../components/common/Modal";
import Combobox from "../../components/common/Combobox";
import airportData from "../../dropdownData/airports.json";
import {
    getAllAircraft,
    createAircraft,
    updateAircraft,
    deleteAircraft,
} from "../../services/aircraftService";
import { useFormErrors } from "../../utils/useFormErrors";
import FormError from "../../components/common/FormError";

const emptyForm = {
    tailnumber: "",
    planeType: "",
    numSeats: "",
    manufacturerName: "",
    flightRange: "",
    currentAirportCode: "",
};

const airportOptions = airportData.map((a) => ({
    label: a.label,
    value: a.value,
}));

// ── CSV helpers ───────────────────────────────────────────────────────────────

const CSV_HEADERS = [
    "tailnumber",
    "planetype",
    "numseats",
    "manufacturername",
    "flightrange",
    "currentairportcode",
];

const CSV_TEMPLATE = `tailnumber,planeType,numSeats,manufacturerName,flightRange,currentAirportCode
N12345,Boeing 737,200,Boeing,9500,HOU
N67890,Airbus A320,180,Airbus,10000,DAL`;

function parseCsv(text) {
    const clean = text.replace(/^\uFEFF/, "");
    const lines = clean.trim().split(/\r?\n/);
    if (lines.length < 2) return { rows: [], error: "CSV must have a header row and at least one data row." };

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const missing = CSV_HEADERS.filter((h) => !header.includes(h));
    if (missing.length > 0)
        return { rows: [], error: `Missing columns: ${missing.join(", ")}` };

    const idx = (name) => header.indexOf(name);

    const rows = lines.slice(1).map((line, i) => {
        const cols = line.split(",").map((c) => c.trim());
        const raw = {
            tailnumber:         cols[idx("tailnumber")]         ?? "",
            planeType:          cols[idx("planetype")]          ?? "",
            numSeats:           cols[idx("numseats")]           ?? "",
            manufacturerName:   cols[idx("manufacturername")]   ?? "",
            flightRange:        cols[idx("flightrange")]        ?? "",
            currentAirportCode: cols[idx("currentairportcode")] ?? "",
        };

        const errors = [];
        if (!raw.tailnumber)                          errors.push("tailnumber required");
        if (raw.tailnumber.length > 10)               errors.push("tailnumber max 10 chars");
        if (!raw.currentAirportCode)                  errors.push("currentAirportCode required");
        if (raw.currentAirportCode.length !== 3)      errors.push("currentAirportCode must be 3 chars");

        const seats = Number(raw.numSeats);
        if (!raw.numSeats || isNaN(seats))            errors.push("numSeats must be a number");
        else if (seats < 90 || seats > 140)           errors.push("numSeats must be 90-140");

        const range = Number(raw.flightRange);
        if (!raw.flightRange || isNaN(range))         errors.push("flightRange must be a number");
        else if (range < 9000 || range > 11000)       errors.push("flightRange must be 9000–11000");

        return {
            rowNum: i + 2,
            data: {
                tailnumber:         raw.tailnumber,
                planeType:          raw.planeType || null,
                numSeats:           seats,
                manufacturerName:   raw.manufacturerName || null,
                flightRange:        range,
                currentAirportCode: raw.currentAirportCode,
            },
            errors,
            valid: errors.length === 0,
        };
    });

    return { rows, error: null };
}

function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "aircraft_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Aircraft() {
    const [aircraftList, setAircraftList] = useState([]);
    const [filtered,     setFiltered]     = useState([]);
    const [form,         setForm]         = useState(emptyForm);
    const [editingTail,  setEditingTail]  = useState(null);
    const [showForm,     setShowForm]     = useState(false);
    const [filterText,   setFilterText]   = useState("");
    const [sortField,    setSortField]    = useState("tailnumber");
    const [sortDir,      setSortDir]      = useState("asc");
    const { errors: serverErrors, setErrors: setServerErrors, clearErrors } = useFormErrors();

    const [page, setPage] = useState(1);
    const PAGE_SIZE = 50;

    // ── Import modal state ────────────────────────────────────────────────────
    const [importOpen,     setImportOpen]     = useState(false);
    const [importRows,     setImportRows]     = useState([]);
    const [importParseErr, setImportParseErr] = useState("");
    const [importStatus,   setImportStatus]   = useState(null);
    const [importing,      setImporting]      = useState(false);
    const fileRef = useRef(null);

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => { fetchAircraft(); }, []);

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
        setPage(1);
    }, [aircraftList, filterText, sortField, sortDir]);

    const fetchAircraft = async () => {
        try {
            const res = await getAllAircraft();
            setAircraftList(res.data);
        } catch {
            setServerErrors({ response: { data: "Failed to load Aircraft." } });
        }
    };

    // ── Table handlers ────────────────────────────────────────────────────────
    const handleSort = (field) => {
        if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    };

    const handleEdit = (aircraft) => {
        setForm({
            tailnumber:         aircraft.tailnumber,
            planeType:          aircraft.planeType || "",
            numSeats:           aircraft.numSeats,
            manufacturerName:   aircraft.manufacturerName || "",
            flightRange:        aircraft.flightRange,
            currentAirportCode: aircraft.currentAirportCode,
        });
        setEditingTail(aircraft.tailnumber);
        setShowForm(true);
        clearErrors();
    };

    const handleDelete = async (tailnumber) => {
        if (!window.confirm(`Delete aircraft ${tailnumber}?`)) return;
        try {
            await deleteAircraft(tailnumber);
            setAircraftList((prev) => prev.filter((a) => a.tailnumber !== tailnumber));
        } catch (err) {
            setServerErrors(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            clearErrors();
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
            clearErrors();
        } catch (err) {
            setServerErrors(err);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setForm(emptyForm);
        setEditingTail(null);
        clearErrors();
    };

    const sortArrow = (field) => {
        if (sortField !== field) return " ↕";
        return sortDir === "asc" ? " ↑" : " ↓";
    };

    // ── CSV import handlers ───────────────────────────────────────────────────
    const openImport = () => {
        setImportRows([]);
        setImportParseErr("");
        setImportStatus(null);
        setImportOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const { rows, error: parseError } = parseCsv(ev.target.result);
            setImportParseErr(parseError || "");
            setImportRows(rows);
            setImportStatus(null);
        };
        reader.readAsText(file);
    };

    const handleImportSubmit = async () => {
        const validRows = importRows.filter((r) => r.valid);
        if (validRows.length === 0) return;

        setImporting(true);
        setImportStatus(null);

        let success = 0;
        let failed  = 0;
        const failedTails = [];

        for (const row of validRows) {
            try {
                await createAircraft(row.data);
                success++;
            } catch {
                failed++;
                failedTails.push(row.data.tailnumber);
            }
        }

        setImportStatus({ success, failed, failedTails });
        setImporting(false);

        if (success > 0) await fetchAircraft();
    };

    const validCount   = importRows.filter((r) => r.valid).length;
    const invalidCount = importRows.filter((r) => !r.valid).length;
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            {/* Page Header */}
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Aircraft Fleet</h1>
                    <p className="mt-1 text-sm text-gray-200">Manage and monitor aircraft specifications and locations.</p>
                </div>
                <div className="flex gap-4">
                    <Button onClick={() => { setShowForm(true); setEditingTail(null); setForm(emptyForm); clearErrors(); }}>
                        + Add Aircraft
                    </Button>
                    {/* <Button variant="outline" onClick={openImport}>
                        Import CSV
                    </Button> */}
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="p-6">
                {/* Search & Sort Row */}
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
                                Tail Number{sortArrow("tailnumber")}
                            </th>
                            <th className="px-3 py-2">Plane Type</th>
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
                            paginated.map((a) => (
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

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                            <p>{filtered.length} aircraft — page {page} of {totalPages}</p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
            <Modal
                isOpen={showForm}
                onClose={handleCancel}
                title={editingTail ? "Edit Aircraft" : "Add New Aircraft"}
                className="!max-w-xl"
                contentClassName="!overflow-visible"
            >
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <FormError errors={serverErrors} />
                    <TextInput
                        label="Tail Number"
                        value={form.tailnumber}
                        disabled={!!editingTail}
                        placeholder="e.g. N12345"
                        onChange={(e) => setForm({ ...form, tailnumber: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Plane Type"
                            value={form.planeType}
                            placeholder="e.g. Boeing 737"
                            onChange={(e) => setForm({ ...form, planeType: e.target.value })}
                        />
                        <TextInput
                            label="Seats"
                            type="number"
                            value={form.numSeats}
                            placeholder="90 – 140"
                            onChange={(e) => setForm({ ...form, numSeats: parseInt(e.target.value) })}
                        />
                    </div>
                    <TextInput
                        label="Manufacturer"
                        value={form.manufacturerName}
                        placeholder="e.g. Boeing"
                        onChange={(e) => setForm({ ...form, manufacturerName: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Range (miles)"
                            type="number"
                            value={form.flightRange}
                            placeholder="9000 – 11000"
                            onChange={(e) => setForm({ ...form, flightRange: parseInt(e.target.value) })}
                        />
                        <Combobox
                            label="Airport Code"
                            value={form.currentAirportCode}
                            onChange={(val) => setForm({ ...form, currentAirportCode: val })}
                            options={airportOptions}
                            placeholder="Search airport..."
                            emptyMessage="No airports found"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="submit">{editingTail ? "Save Changes" : "Create Aircraft"}</Button>
                        <Button variant="outline" type="button" onClick={handleCancel}>Cancel</Button>
                    </div>
                </form>
            </Modal>

            {/* ── Import Modal ─────────────────────────────────────────────────── */}
            <Modal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                title="Import Aircraft from CSV"
                className="!max-w-3xl"
            >
                <div className="space-y-4 pt-2">
                    {/* Instructions */}
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>Upload a <span className="font-medium">.csv</span> file with the following columns:</p>
                        <code className="block bg-gray-100 rounded px-3 py-2 text-xs">
                            tailnumber, planeType, numSeats, manufacturerName, flightRange, currentAirportCode
                        </code>
                        <p className="text-xs text-gray-500">
                            Constraints: <span className="font-medium">numSeats</span> 90–140 &nbsp;|&nbsp;
                            <span className="font-medium">flightRange</span> 9000–11000 &nbsp;|&nbsp;
                            <span className="font-medium">currentAirportCode</span> exactly 3 chars
                        </p>
                    </div>

                    {/* File picker + template download */}
                    <div className="flex items-center gap-3">
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="text-sm"
                        />
                        <button
                            onClick={downloadTemplate}
                            className="text-blue-600 text-sm underline whitespace-nowrap"
                        >
                            Download template
                        </button>
                    </div>

                    {/* Parse error */}
                    {importParseErr && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                            {importParseErr}
                        </p>
                    )}

                    {/* Preview table */}
                    {importRows.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                Preview — {validCount} valid, {invalidCount} invalid
                            </p>
                            <div className="overflow-x-auto rounded border border-gray-200 max-h-64 overflow-y-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-100 text-left sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2">Row</th>
                                        <th className="px-3 py-2">Tail #</th>
                                        <th className="px-3 py-2">Type</th>
                                        <th className="px-3 py-2">Seats</th>
                                        <th className="px-3 py-2">Manufacturer</th>
                                        <th className="px-3 py-2">Range</th>
                                        <th className="px-3 py-2">Airport</th>
                                        <th className="px-3 py-2">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {importRows.map((row) => (
                                        <tr
                                            key={row.rowNum}
                                            className={row.valid ? "border-t" : "border-t bg-red-50"}
                                        >
                                            <td className="px-3 py-2 text-gray-500">{row.rowNum}</td>
                                            <td className="px-3 py-2">{row.data.tailnumber || "—"}</td>
                                            <td className="px-3 py-2">{row.data.planeType || "—"}</td>
                                            <td className="px-3 py-2">{row.data.numSeats}</td>
                                            <td className="px-3 py-2">{row.data.manufacturerName || "—"}</td>
                                            <td className="px-3 py-2">{row.data.flightRange}</td>
                                            <td className="px-3 py-2">{row.data.currentAirportCode || "—"}</td>
                                            <td className="px-3 py-2">
                                                {row.valid ? (
                                                    <span className="text-green-600 font-medium">✓ Valid</span>
                                                ) : (
                                                    <span className="text-red-600" title={row.errors.join("; ")}>
                                                            ✗ {row.errors[0]}{row.errors.length > 1 ? ` (+${row.errors.length - 1})` : ""}
                                                        </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Import result */}
                    {importStatus && (
                        <div className={`text-sm rounded px-3 py-2 border ${
                            importStatus.failed === 0
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-yellow-50 border-yellow-200 text-yellow-800"
                        }`}>
                            <p className="font-medium">Import complete</p>
                            <p>{importStatus.success} aircraft added successfully.</p>
                            {importStatus.failed > 0 && (
                                <p>
                                    {importStatus.failed} failed (already exists or server error):&nbsp;
                                    {importStatus.failedTails.join(", ")}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Footer actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            onClick={handleImportSubmit}
                            disabled={importing || validCount === 0 || !!importStatus}
                        >
                            {importing ? "Importing..." : `Import ${validCount} Aircraft`}
                        </Button>
                        <Button variant="outline" onClick={() => setImportOpen(false)}>
                            {importStatus ? "Close" : "Cancel"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
