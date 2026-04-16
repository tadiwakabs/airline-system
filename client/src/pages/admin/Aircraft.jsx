import React, { useEffect, useRef, useState } from "react";
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
        else if (seats < 90 || seats > 140)          errors.push("numSeats must be 90-140");

        const range = Number(raw.flightRange);
        if (!raw.flightRange || isNaN(range))         errors.push("flightRange must be a number");
        else if (range < 9000 || range > 11000)       errors.push("flightRange must be 9000–11000");

        return {
            rowNum: i + 2, // 1-based, accounting for header
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
    const {errors: serverErrors, setErrors: setServerErrors, clearErrors}=useFormErrors();

    // ── Import modal state ────────────────────────────────────────────────────
    const [importOpen,    setImportOpen]    = useState(false);
    const [importRows,    setImportRows]    = useState([]);   // parsed preview rows
    const [importParseErr,setImportParseErr]= useState("");
    const [importStatus,  setImportStatus]  = useState(null); // { success, failed }
    const [importing,     setImporting]     = useState(false);
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
    }, [aircraftList, filterText, sortField, sortDir]);

    const fetchAircraft = async () => {
        try {
            const res = await getAllAircraft();
            setAircraftList(res.data);
        } catch {
            setServerErrors({response:{data:"Failed to load Aircraft."}});
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
        } catch (err){
            setServerErrors(err);
        }
    };

    const handleSubmit = async () => {
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
            clearErrors("");
        } catch (err){
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

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Aircraft</h1>
                <div className="flex gap-2">
                    <button
                        onClick={openImport}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                    >
                        Import CSV
                    </button>
                    <button
                        onClick={() => { setShowForm(true); setEditingTail(null); setForm(emptyForm); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        + Add Aircraft
                    </button>
                </div>
            </div>



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
                    <FormError errors={serverErrors}/>
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
                            placeholder="Num Seats (90 – 140)"
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
                            placeholder="Flight Range (9000 – 11000)"
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
                        <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            {editingTail ? "Save Changes" : "Create"}
                        </button>
                        <button onClick={handleCancel} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
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
                        { label: "Tail Number",  field: "tailnumber" },
                        { label: "Type",         field: "planeType" },
                        { label: "Seats",        field: "numSeats" },
                        { label: "Manufacturer", field: "manufacturerName" },
                        { label: "Range (mi)",   field: "flightRange" },
                        { label: "Airport",      field: "currentAirportCode" },
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
                        <td colSpan={7} className="text-center py-6 text-gray-400">No aircraft found.</td>
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
                                <button onClick={() => handleEdit(a)} className="text-blue-600 hover:underline">Edit</button>
                                <button onClick={() => handleDelete(a.tailnumber)} className="text-red-500 hover:underline">Delete</button>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>

            {/* ── Import Modal ─────────────────────────────────────────────────── */}
            {importOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold">Import Aircraft from CSV</h2>
                            <button onClick={() => setImportOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">

                            {/* Instructions */}
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>Upload a <span className="font-medium">.csv</span> file with the following columns:</p>
                                <code className="block bg-gray-100 rounded px-3 py-2 text-xs">
                                    tailnumber, planeType, numSeats, manufacturerName, flightRange, currentAirportCode
                                </code>
                                <p className="text-xs text-gray-500">
                                    Constraints: <span className="font-medium">numSeats</span> 200–300 &nbsp;|&nbsp;
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
                                    <div className="overflow-x-auto rounded border border-gray-200">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-100 text-left">
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
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t flex items-center gap-3">
                            <button
                                onClick={handleImportSubmit}
                                disabled={importing || validCount === 0 || !!importStatus}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {importing ? "Importing..." : `Import ${validCount} Aircraft`}
                            </button>
                            <button
                                onClick={() => setImportOpen(false)}
                                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
                            >
                                {importStatus ? "Close" : "Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
