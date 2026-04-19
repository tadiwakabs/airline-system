import { useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import TextInput from "../../components/common/TextInput";
import Dropdown from "../../components/common/Dropdown";
import Separator from "../../components/common/Separator";
import Modal from "../../components/common/Modal";
import Dialog from "../../components/common/Dialog";
import {
    getAllEmployees,
    createEmployee,
    updateEmployee,
    lookupUserByIdOrEmail,
} from "../../services/employeeService";
import airportOptions from "../../dropdownData/airports.json";

// ── Static option lists ───────────────────────────────────────────────────────

const statusFilterOptions = [
    { label: "All Statuses",  value: "" },
    { label: "Active",        value: "Active" },
    { label: "On Leave",      value: "OnLeave" },
    { label: "Terminated",    value: "Terminated" },
];

const formStatusOptions = [
    { label: "Active",     value: "Active" },
    { label: "On Leave",   value: "OnLeave" },
    { label: "Terminated", value: "Terminated" },
];

const deptFilterOptions = [
    { label: "All Departments", value: "" },
    { label: "Cabin Crew", value: "Cabin Crew" },
    { label: "Flight Ops", value: "Flight Ops" },
    { label: "Administrative", value: "Administrative" },
];

const deptFormOptions = [
    { label: "Cabin Crew", value: "Cabin Crew" },
    { label: "Flight Ops", value: "Flight Ops" },
    { label: "Administrative", value: "Administrative" },
];

const sortOptions = [
    { label: "Employee ID",   value: "employeeId" },
    { label: "Last Name",     value: "lastName" },
    { label: "Department",    value: "department" },
    { label: "Hire Date",     value: "hireDate" },
    { label: "Status",        value: "status" },
    { label: "Work Location", value: "workLocation" },
];

// Build airport dropdown options from the JSON (value = IATA code)
const airportDropdownOptions = [
    { label: "Select airport...", value: "" },
    ...airportOptions.map((a) => ({ label: a.label, value: a.value })),
];

// ── Empty form shapes ─────────────────────────────────────────────────────────

const emptyAddForm = {
    lookupValue:  "",
    userId:       "",
    workEmail:    "",
    workPhone:    "",
    jobTitle:     "",
    department:   "",
    hire_date:    "",
    workLocation: "",
};

const emptyEditForm = {
    workEmail:    "",
    workPhone:    "",
    jobTitle:     "",
    department:   "",
    hire_date:    "",
    workLocation: "",
    status:       "Active",
};

// ── Helpers ───────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const map = {
        Active:     "bg-green-100 text-green-700",
        OnLeave:    "bg-amber-100 text-amber-700",
        Terminated: "bg-red-100 text-red-700",
    };
    const label = {
        Active:     "Active",
        OnLeave:    "On Leave",
        Terminated: "Terminated",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
            {label[status] ?? status}
        </span>
    );
}

function formatPersonName(firstName, lastName) {
    return `${firstName || ""} ${lastName || ""}`.trim() || "—";
}

function sanitizeNameForEmailPart(value) {
    return (value || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z]/g, "");
}

function buildAirlineEmail(firstName, lastName) {
    const first = sanitizeNameForEmailPart(firstName);
    const last = sanitizeNameForEmailPart(lastName);

    if (!first && !last) return "";
    if (!first) return `${last}@airline.com`;
    if (!last) return `${first}@airline.com`;

    return `${first}.${last}@airline.com`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Employees() {

    // ── Shared ────────────────────────────────────────────────────────────────
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // ── Employee list ─────────────────────────────────────────────────────────
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [deptFilter, setDeptFilter] = useState("");
    const [sortBy, setSortBy] = useState("employeeId");
    const [sortDirection, setSortDirection] = useState("asc");
    const [page, setPage] = useState(0);

    // ── Add employee modal ────────────────────────────────────────────────────
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addForm, setAddForm] = useState(emptyAddForm);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookedUpUser, setLookedUpUser] = useState(null);
    const [lookupError, setLookupError] = useState("");

    // ── Edit employee modal ───────────────────────────────────────────────────
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);
    const [editForm, setEditForm] = useState(emptyEditForm);

    // ── Status-change dialog ──────────────────────────────────────────────────
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [statusTarget, setStatusTarget] = useState(null);
    const [pendingStatus, setPendingStatus] = useState("");

    // ── Initial load ──────────────────────────────────────────────────────────
    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            // employeeService returns response.data directly — already the array
            const res = await getAllEmployees();
            setEmployees(res);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load employees.");
        } finally {
            setLoading(false);
        }
    };

    // ── Filtered / sorted list ────────────────────────────────────────────────
    const filteredEmployees = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let result = [...employees];

        if (term) {
            result = result.filter((e) =>
                (e.employeeId   || "").toLowerCase().includes(term) ||
                (e.userId       || "").toLowerCase().includes(term) ||
                (e.workEmail    || "").toLowerCase().includes(term) ||
                (e.jobTitle     || "").toLowerCase().includes(term) ||
                (e.department   || "").toLowerCase().includes(term) ||
                (e.workLocation || "").toLowerCase().includes(term) ||
                ((e.firstName || "") + " " + (e.lastName || "")).toLowerCase().includes(term)
            );
        }

        if (statusFilter) result = result.filter((e) => e.status === statusFilter);
        if (deptFilter)   result = result.filter((e) => e.department === deptFilter);

        result.sort((a, b) => {
            let aVal = a[sortBy] ?? "";
            let bVal = b[sortBy] ?? "";
            if (typeof aVal === "string") aVal = aVal.toLowerCase();
            if (typeof bVal === "string") bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        setPage(0);
        return result;
    }, [employees, searchTerm, statusFilter, deptFilter, sortBy, sortDirection]);

    const PAGE_SIZE = 50;
    const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
    const pagedEmployees = filteredEmployees.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const editingEmployee = employees.find((emp) => emp.employeeId === editingEmployeeId) || null;

    // ── Add modal handlers ────────────────────────────────────────────────────

    const openAddModal = () => {
        setError("");
        setSuccessMessage("");
        setAddForm(emptyAddForm);
        setLookedUpUser(null);
        setLookupError("");
        setIsAddModalOpen(true);
    };

    const resetAddModal = () => {
        setAddForm(emptyAddForm);
        setLookedUpUser(null);
        setLookupError("");
        setIsAddModalOpen(false);
    };

    const handleAddFormChange = (e) => {
        const { name, value } = e.target;
        setAddForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleLookup = async () => {
        const val = addForm.lookupValue.trim();
        if (!val) return;

        setLookupError("");
        setLookedUpUser(null);
        setLookupLoading(true);

        try {
            // employeeService returns response.data directly — res IS the user object
            const res = await lookupUserByIdOrEmail(val);
            setLookedUpUser(res);
            setAddForm((prev) => ({
                ...prev,
                userId: res.userId,
                workEmail: buildAirlineEmail(res.firstName, res.lastName),
            }));
        } catch (err) {
            setLookupError(
                err?.response?.status === 404
                    ? "No user found with that ID or email."
                    : err?.response?.data?.message || "Lookup failed."
            );
        } finally {
            setLookupLoading(false);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        const payload = {
            userId:       addForm.userId,
            workEmail:    addForm.workEmail,
            workPhone:    addForm.workPhone ? Number(addForm.workPhone) : null,
            jobTitle:     addForm.jobTitle   || null,
            department:   addForm.department || null,
            hire_date:    addForm.hire_date  || null,
            workLocation: addForm.workLocation.toUpperCase(),
            status:       "Active",
            isAdmin:      false,
        };

        try {
            await createEmployee(payload);
            setSuccessMessage(
                `Employee created successfully. ${lookedUpUser?.firstName ?? ""}'s role has been updated to Employee.`
            );
            resetAddModal();
            await loadEmployees();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to create employee.");
        }
    };

    // ── Edit modal handlers ───────────────────────────────────────────────────

    const handleEdit = (emp) => {
        setError("");
        setSuccessMessage("");
        setEditingEmployeeId(emp.employeeId);
        setEditForm({
            workEmail:    emp.workEmail    ?? "",
            workPhone:    emp.workPhone    ?? "",
            jobTitle:     emp.jobTitle     ?? "",
            department:   emp.department   ?? "",
            hire_date:    emp.hireDate     ? emp.hireDate.slice(0, 10) : "",
            workLocation: emp.workLocation ?? "",
            status:       emp.status       ?? "Active",
        });
        setIsEditModalOpen(true);
    };

    const resetEditModal = () => {
        setEditForm(emptyEditForm);
        setEditingEmployeeId(null);
        setIsEditModalOpen(false);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        // Preserve isAdmin from the existing record — not editable via this form
        const existing = employees.find((emp) => emp.employeeId === editingEmployeeId);

        const payload = {
            workEmail:    editForm.workEmail,
            workPhone:    editForm.workPhone ? Number(editForm.workPhone) : null,
            jobTitle:     editForm.jobTitle   || null,
            department:   editForm.department || null,
            hire_date:    editForm.hire_date  || null,
            workLocation: editForm.workLocation.toUpperCase(),
            status:       editForm.status,
            isAdmin:      existing?.isAdmin ?? false,
        };

        try {
            await updateEmployee(editingEmployeeId, payload);

            let roleNote = "";
            if (existing && existing.status !== "Terminated" && editForm.status === "Terminated") {
                roleNote = " User role updated to Passenger.";
            } else if (existing && existing.status === "Terminated" && editForm.status !== "Terminated") {
                roleNote = " User role updated to Employee.";
            }

            setSuccessMessage("Employee updated successfully." + roleNote);
            resetEditModal();
            await loadEmployees();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update employee.");
        }
    };

    // ── Quick status-change dialog ────────────────────────────────────────────

    const handleQuickStatus = (emp, newStatus) => {
        setError("");
        setSuccessMessage("");
        setStatusTarget(emp);
        setPendingStatus(newStatus);
        setIsStatusDialogOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusTarget) return;
        try {
            setError("");
            setSuccessMessage("");

            await updateEmployee(statusTarget.employeeId, {
                workEmail:    statusTarget.workEmail,
                workPhone:    statusTarget.workPhone,
                jobTitle:     statusTarget.jobTitle,
                department:   statusTarget.department,
                hire_date:    statusTarget.hireDate,
                workLocation: statusTarget.workLocation,
                status:       pendingStatus,
                isAdmin:      statusTarget.isAdmin,
            });

            let roleNote = "";
            if (statusTarget.status !== "Terminated" && pendingStatus === "Terminated") {
                roleNote = " User role updated to Passenger.";
            } else if (statusTarget.status === "Terminated" && pendingStatus !== "Terminated") {
                roleNote = " User role updated to Employee.";
            }

            setSuccessMessage(
                `${statusTarget.employeeId} status changed to ${pendingStatus}.` + roleNote
            );
            setIsStatusDialogOpen(false);
            setStatusTarget(null);
            await loadEmployees();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update status.");
        }
    };

    // ── Format helpers ────────────────────────────────────────────────────────

    const formatDate = (val) => {
        if (!val) return "—";
        return new Date(val).toLocaleDateString();
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-7xl xl:max-w-[80vw] px-4 py-10">

            {/* Page header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage employee records and access.</p>
                </div>
                <Button onClick={openAddModal}>Add Employee</Button>
            </div>

            {/* Feedback */}
            {error          && <p className="mb-4 text-sm text-red-600">{error}</p>}
            {successMessage && <p className="mb-4 text-sm text-green-600">{successMessage}</p>}

            {/* Filters */}
            <Card className="p-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <TextInput
                        label="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ID, email, name, department..."
                    />
                    <Dropdown
                        label="Status"
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val)}
                        options={statusFilterOptions}
                    />
                    <Dropdown
                        label="Department"
                        value={deptFilter}
                        onChange={(val) => setDeptFilter(val)}
                        options={deptFilterOptions}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Dropdown
                            label="Sort By"
                            value={sortBy}
                            onChange={(val) => setSortBy(val)}
                            options={sortOptions}
                        />
                        <Dropdown
                            label="Direction"
                            value={sortDirection}
                            onChange={(val) => setSortDirection(val)}
                            options={[
                                { label: "Ascending",  value: "asc" },
                                { label: "Descending", value: "desc" },
                            ]}
                        />
                    </div>
                </div>

                <Separator className="my-6" />

                {loading ? (
                    <p className="text-sm text-gray-500">Loading employees...</p>
                ) : filteredEmployees.length === 0 ? (
                    <p className="text-sm text-gray-500">No employees found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-2">
                            <thead>
                            <tr className="text-left text-sm text-gray-500">
                                <th className="px-3 py-2">Employee ID</th>
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Work Email</th>
                                <th className="px-3 py-2">Job Title</th>
                                <th className="px-3 py-2">Department</th>
                                <th className="px-3 py-2">Location</th>
                                <th className="px-3 py-2">Hire Date</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Admin</th>
                                <th className="px-3 py-2">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pagedEmployees.map((emp) => (
                                <tr key={emp.employeeId} className="rounded-xl bg-gray-50 text-sm">
                                    <td className="px-3 py-3 font-medium text-gray-900">{emp.employeeId}</td>
                                    <td className="px-3 py-3">
                                        {`${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "—"}
                                    </td>
                                    <td className="px-3 py-3">{emp.workEmail}</td>
                                    <td className="px-3 py-3">{emp.jobTitle ?? "—"}</td>
                                    <td className="px-3 py-3">{emp.department ?? "—"}</td>
                                    <td className="px-3 py-3">{emp.workLocation}</td>
                                    <td className="px-3 py-3">{formatDate(emp.hireDate)}</td>
                                    <td className="px-3 py-3">
                                        <StatusBadge status={emp.status} />
                                    </td>
                                    <td className="px-3 py-3">
                                        {emp.isAdmin ? (
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">No</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(emp)}
                                            >
                                                Edit
                                            </Button>
                                            {emp.status !== "Active" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleQuickStatus(emp, "Active")}
                                                >
                                                    Activate
                                                </Button>
                                            )}
                                            {emp.status !== "OnLeave" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleQuickStatus(emp, "OnLeave")}
                                                >
                                                    On Leave
                                                </Button>
                                            )}
                                            {emp.status !== "Terminated" && !emp.isAdmin && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleQuickStatus(emp, "Terminated")}
                                                >
                                                    Terminate
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                    >
                                        ← Prev
                                    </Button>
                                    <span className="px-2 py-1 text-gray-500">
                                        Page {page + 1} of {totalPages}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                    >
                                        Next →
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>


            {/* ════════════════════════════════════════════════════════════════
                ADD EMPLOYEE MODAL
            ════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={resetAddModal}
                title="Add Employee"
                className="!max-w-2xl"
                contentClassName="!max-h-[78vh]"
            >
                <p className="mb-4 text-sm text-gray-500">
                    Look up an existing user by their user ID or email, then fill in their employment details.
                </p>

                {/* Step 1 — lookup */}
                <div className="mb-5 rounded-lg border border-gray-200 p-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">Step 1 — Find user</p>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <TextInput
                                name="lookupValue"
                                placeholder="User ID or email address"
                                value={addForm.lookupValue}
                                onChange={handleAddFormChange}
                            />
                        </div>
                        <div className="pt-0.5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleLookup}
                                disabled={lookupLoading || !addForm.lookupValue.trim()}
                            >
                                {lookupLoading ? "Looking up..." : "Look up"}
                            </Button>
                        </div>
                    </div>

                    {lookupError && (
                        <p className="mt-2 text-sm text-red-600">{lookupError}</p>
                    )}

                    {lookedUpUser && (
                        <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                            Found: <span className="font-medium">{lookedUpUser.firstName} {lookedUpUser.lastName}</span>
                            {" "}({lookedUpUser.email}) — ID: {lookedUpUser.userId}
                        </div>
                    )}
                </div>

                {/* Step 2 — employment details */}
                {lookedUpUser && (
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        <p className="text-sm font-medium text-gray-700">Step 2 — Employment details</p>

                        <TextInput
                            label="Employee Name"
                            value={formatPersonName(lookedUpUser.firstName, lookedUpUser.lastName)}
                            disabled
                            className="bg-gray-50"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <TextInput
                                label="Work Email"
                                name="workEmail"
                                type="email"
                                value={addForm.workEmail}
                                disabled
                                className="bg-gray-50"
                                required
                            />
                            <TextInput
                                label="Work Phone"
                                name="workPhone"
                                type="tel"
                                placeholder="Optional"
                                value={addForm.workPhone}
                                onChange={handleAddFormChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <TextInput
                                label="Job Title"
                                name="jobTitle"
                                placeholder="e.g. Flight Attendant"
                                value={addForm.jobTitle}
                                onChange={handleAddFormChange}
                            />
                            <Dropdown
                                label="Department"
                                value={addForm.department}
                                onChange={(val) => setAddForm((p) => ({ ...p, department: val }))}
                                options={deptFormOptions}
                                defaultValue="Select department..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <TextInput
                                label="Hire Date"
                                name="hire_date"
                                type="date"
                                value={addForm.hire_date}
                                onChange={handleAddFormChange}
                            />
                            <Dropdown
                                label="Work Location"
                                value={addForm.workLocation}
                                onChange={(val) => setAddForm((p) => ({ ...p, workLocation: val }))}
                                options={airportDropdownOptions}
                                defaultValue="Select airport..."
                            />
                        </div>

                        <p className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                            The user's role will be updated to <span className="font-medium">Employee</span> upon creation.
                        </p>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit">Create Employee</Button>
                            <Button type="button" variant="outline" onClick={resetAddModal}>Cancel</Button>
                        </div>
                    </form>
                )}

                {!lookedUpUser && (
                    <div className="flex justify-end">
                        <Button type="button" variant="outline" onClick={resetAddModal}>Cancel</Button>
                    </div>
                )}
            </Modal>


            {/* ════════════════════════════════════════════════════════════════
                EDIT EMPLOYEE MODAL
            ════════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={resetEditModal}
                title="Edit Employee"
                className="!max-w-2xl"
                contentClassName="!max-h-[78vh]"
            >
                <p className="mb-4 text-sm text-gray-500">
                    Update employment details for this employee.
                    Changing status to <span className="font-medium">Terminated</span> will update the user's role to Passenger.
                </p>

                <TextInput
                    label="Employee Name"
                    value={formatPersonName(editingEmployee?.firstName, editingEmployee?.lastName)}
                    disabled
                    className="bg-gray-50 mb-4"
                />

                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Work Email"
                            name="workEmail"
                            type="email"
                            value={editForm.workEmail}
                            disabled
                            className="bg-gray-50"
                            required
                        />
                        <TextInput
                            label="Work Phone"
                            name="workPhone"
                            type="tel"
                            value={editForm.workPhone}
                            onChange={handleEditFormChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Job Title"
                            name="jobTitle"
                            value={editForm.jobTitle}
                            onChange={handleEditFormChange}
                        />
                        <Dropdown
                            label="Department"
                            value={editForm.department}
                            onChange={(val) => setEditForm((p) => ({ ...p, department: val }))}
                            options={deptFormOptions}
                            defaultValue="Select department..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <TextInput
                            label="Hire Date"
                            name="hire_date"
                            type="date"
                            value={editForm.hire_date}
                            onChange={handleEditFormChange}
                        />
                        <Dropdown
                            label="Work Location"
                            value={editForm.workLocation}
                            onChange={(val) => setEditForm((p) => ({ ...p, workLocation: val }))}
                            options={airportDropdownOptions}
                            defaultValue="Select airport..."
                        />
                    </div>

                    <Dropdown
                        label="Status"
                        value={editForm.status}
                        onChange={(val) => setEditForm((p) => ({ ...p, status: val }))}
                        options={formStatusOptions}
                    />

                    <div className="flex gap-3 pt-2">
                        <Button type="submit">Save Changes</Button>
                        <Button type="button" variant="outline" onClick={resetEditModal}>Cancel</Button>
                    </div>
                </form>
            </Modal>


            {/* ════════════════════════════════════════════════════════════════
                QUICK STATUS CHANGE DIALOG
            ════════════════════════════════════════════════════════════════ */}
            <Dialog
                isOpen={isStatusDialogOpen}
                onClose={() => {
                    setIsStatusDialogOpen(false);
                    setStatusTarget(null);
                }}
                title="Change Employee Status"
                description={
                    statusTarget
                        ? `Change ${statusTarget.employeeId} (${statusTarget.workEmail}) status to "${pendingStatus === "OnLeave" ? "On Leave" : pendingStatus}"?`
                        : "Change employee status?"
                }
                confirmText={pendingStatus === "Terminated" ? "Terminate Employee" : "Confirm"}
                confirmVariant={pendingStatus === "Terminated" ? "danger" : "primary"}
                onConfirm={confirmStatusChange}
                className="!max-w-md"
            >
                {pendingStatus === "Terminated" && (
                    <div className="space-y-3">
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            This will mark the employee as Terminated and update their user role to Passenger.
                        </div>
                        {statusTarget && (
                            <div className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-700">
                                <p><span className="font-medium">Employee ID:</span> {statusTarget.employeeId}</p>
                                <p><span className="font-medium">Email:</span> {statusTarget.workEmail}</p>
                                <p><span className="font-medium">Department:</span> {statusTarget.department ?? "—"}</p>
                            </div>
                        )}
                    </div>
                )}
            </Dialog>

        </div>
    );
}
