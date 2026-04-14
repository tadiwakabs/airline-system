import React, { useEffect, useState } from "react";
import {
    getAllAirports,
    createAirport,
    updateAirport,
    deleteAirport,
    getStates,
} from "../../services/airportService";
import {useFormErrors} from "../../utils/useFormErrors";
import FormError from "../../components/common/FormError";

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
    const [localErrors,setlocalErrors]= useState([]);
    const {errors: serverErrors, setErrors: setServerErrors, clearErrors}=useFormErrors();
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
            setServerErrors({response:{data:"Failed to load airports."}});
        }
    };

    const fetchStates = async () => {
        try {
            const res = await getStates();
            console.log("States received from API:", res.data); 
            setStates(res.data);
        } catch (err) {
            setServerErrors({response:{data:"Failed to load state list"}})
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
    } 
    else if (name === 'state' && value.trim() === "") {
        val = null;
    }

    setForm({
        ...form, 
        [name]: val
    });
};;

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

    const handleSubmit = async () => {
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

            <FormError errors={serverErrors}/>
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
                        <div className="flex flex-col">
                            <label className="text-xs font-semibold text-gray-500">State</label>
                            <select
                                name="state"
                                value={form.state || ""}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded bg-white w-full 
                                          focus:ring-2 focus:ring-blue-400 outline-none"
                            >
            
                                <option value="">-- Select State --</option>
                                {states.length > 0 ? (
                                    states.map((s) => (
                                        <option key={s.code} value={s.code}>
                                            {s.code} - {s.name}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>Loading states...</option>
                                )}
                                <option value="OT">OT - Other/International</option>
                            </select>
                        </div>
                        <input
                            placeholder="Country (2 char)"
                            value={form.country}
                            maxLength={2}
                            onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
                            className="border px-3 py-2 rounded"
                        />
                        <input
                            placeholder="Timezone(Continent/Country)"
                            value={form.timezone}
                            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                            className="border px-3 py-2 rounded"
                        />
                        <input 
                            type="number" 
                            step="any" 
                            name="latitude" 
                            placeholder="Latitude" 
                            value={form.latitude} 
                            onChange={handleChange} 
                            className="border px-3 py-2 rounded" 
                        />
                        <input 
                            type="number" 
                            step="any" 
                            name="longitude" 
                            placeholder="Longitude" 
                            value={form.longitude} 
                            onChange={handleChange} 
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