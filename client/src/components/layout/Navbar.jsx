import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, ChevronDown, User, Ticket } from 'lucide-react';

const navLinkBase = "text-sm font-medium text-gray-700 transition-colors hover:text-blue-600";
const navLinkActive = "text-blue-600";

const SEARCH_PAGES = [
    { label: "Home", path: "/", keywords: ["home", "main", "start"] },
    { label: "Book a Flight", path: "/", keywords: ["book", "flight", "search", "ticket"] },
    { label: "Flight Search", path: "/flight-search", keywords: ["flight search", "find flight", "search flights"] },
    { label: "Manage Booking", path: "/bookings", keywords: ["manage", "booking", "my booking", "manage booking"] },
    { label: "My Profile", path: "/profile", keywords: ["profile", "account", "my account", "settings"] },
    { label: "Login", path: "/login", keywords: ["login", "sign in", "signin"] },
    { label: "Register", path: "/register", keywords: ["register", "sign up", "signup", "create account"] },
    { label: "Help", path: "/help", keywords: ["help", "support", "contact", "faq"] },
    { label: "Aircraft", path: "/aircraft", keywords: ["aircraft", "planes", "fleet"] },
    { label: "Flights", path: "/flights", keywords: ["flights", "schedule", "manage flights"] },
    { label: "Reports", path: "/reports", keywords: ["reports", "analytics", "demand", "revenue"] },
    { label: "Payment", path: "/booking/payment", keywords: ["payment", "pay", "checkout"] },
];

function searchPages(query) {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return SEARCH_PAGES.filter(
        (page) =>
            page.label.toLowerCase().includes(lower) ||
            page.keywords.some((k) => k.includes(lower))
    );
}

// FIX 1: Define SearchBox OUTSIDE the Navbar component
const SearchBox = ({
                       className,
                       searchValue,
                       setSearchValue,
                       searchResults,
                       showDropdown,
                       setShowDropdown,
                       activeIndex,
                       handleKeyDown,
                       handleSearch,
                       goToPage,
                       searchRef
                   }) => (
    <div ref={searchRef} className={`relative ${className}`}>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder="Search pages..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
                        {searchResults.map((result, i) => (
                            <button
                                key={result.path + result.label}
                                type="button"
                                // FIX 2: Use onMouseDown instead of onClick to prevent focus-loss issues
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    goToPage(result.path);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                    i === activeIndex
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <span className="font-medium">{result.label}</span>
                                <span className="ml-2 text-xs text-gray-400">{result.path}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <Button type="submit" size="sm" variant="outline">
                Search
            </Button>
        </form>
    </div>
);

export default function Navbar() {
    const [searchValue, setSearchValue] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const profileMenuRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        const results = searchPages(searchValue);
        setSearchResults(results);
        setShowDropdown(results.length > 0 && searchValue.trim() !== "");
        setActiveIndex(-1);
    }, [searchValue]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const role = (user?.userRole || user?.UserRole || "").trim().toLowerCase();

    const isAdmin = role === "administrator";
    const isEmployee = isAdmin || role === "employee";

    const handleSearch = (e) => {
        e.preventDefault();
        if (activeIndex >= 0 && searchResults[activeIndex]) {
            goToPage(searchResults[activeIndex].path);
        } else if (searchResults.length > 0) {
            goToPage(searchResults[0].path);
        }
    };

    const goToPage = (path) => {
        navigate(path);
        setSearchValue("");
        setShowDropdown(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Escape") {
            setShowDropdown(false);
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            goToPage(searchResults[activeIndex].path);
        }
    };

    const handleLogout = () => {
        setIsProfileMenuOpen(false);
        logout();
        navigate("/login");
    };

    // Props bundle to keep the return clean
    const searchProps = {
        searchValue, setSearchValue, searchResults,
        showDropdown, setShowDropdown, activeIndex,
        handleKeyDown, handleSearch, goToPage, searchRef
    };

    return (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                <Link to="/" className="shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                            3380
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">3380 Airlines</p>
                            <p className="text-xs text-gray-500">Fly smarter</p>
                        </div>
                    </div>
                </Link>

                <nav className="hidden items-center gap-6 md:flex">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive ? navLinkActive : ""}`
                        }
                    >
                        Book
                    </NavLink>

                    <NavLink
                        to="/manage"
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive ? navLinkActive : ""}`
                        }
                    >
                        Manage
                    </NavLink>

                    <NavLink
                        to="/help"
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive ? navLinkActive : ""}`
                        }
                    >
                        Help
                    </NavLink>
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    <SearchBox className="w-72" {...searchProps} />

                    {isAuthenticated && (
                        <div className="flex items-center gap-3 border-l border-gray-200 pl-3 mr-2">
                            {isAdmin && (
                                <NavLink to="/admin/dashboard" className={navLinkBase}>
                                    Admin
                                </NavLink>
                            )}
                            {isEmployee && (
                                <NavLink to="/employee/dashboard" className={navLinkBase}>
                                    Employee
                                </NavLink>
                            )}
                        </div>
                    )}



                    {!isAuthenticated ? (
                        <>
                            <NavLink to="/login">
                                <Button variant="outline" size="sm">
                                    Login
                                </Button>
                            </NavLink>

                            <NavLink to="/register">
                                <Button size="sm">Register</Button>
                            </NavLink>
                        </>
                    ) : (
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                type="button"
                                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                                className="flex items-center gap-2 rounded-xl border border-gray-200 px-2 py-1.5 hover:bg-gray-50 transition"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-white">
                                    <User size={20}/>
                                </div>

                                <span className="max-w-30 truncate text-sm font-medium text-gray-700">
                                    {user?.firstName || user?.username}
                                </span>

                                <ChevronDown size={16} className="text-gray-500" />
                            </button>

                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                                    <div className="border-b border-gray-100 px-3 py-2">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                        <p className="truncate text-xs text-gray-500">
                                            {user?.userRole}
                                        </p>
                                    </div>

                                    <div className="py-2">
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <User size={16} />
                                            Profile
                                        </Link>

                                        {isEmployee && (
                                            <Link
                                                to="/employee/dashboard"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-green-600 font-semibold hover:bg-green-50"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-green-600" />
                                                Employee Panel
                                            </Link>
                                        )}

                                        {isAdmin && (
                                            <Link
                                                to="/admin/dashboard"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50"
                                            >
                                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                                                Admin Panel
                                            </Link>
                                        )}

                                        <Link
                                            to="/bookings"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <Ticket size={16} />
                                            Bookings
                                        </Link>
                                    </div>

                                    <div className="border-t border-gray-100 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="cursor-pointer flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile View */}
            <div className="border-t border-gray-100 px-4 py-3 md:hidden">
                <SearchBox className="mb-3" {...searchProps} />
                <div className="mx-auto flex max-w-7xl flex-col gap-3">
                    <nav className="flex items-center justify-around">
                        <NavLink
                            to="/book"
                            className={({ isActive }) =>
                                `${navLinkBase} ${isActive ? navLinkActive : ""}`
                            }
                        >
                            Book
                        </NavLink>

                        <NavLink
                            to="/manage"
                            className={({ isActive }) =>
                                `${navLinkBase} ${isActive ? navLinkActive : ""}`
                            }
                        >
                            Manage
                        </NavLink>

                        <NavLink
                            to="/help"
                            className={({ isActive }) =>
                                `${navLinkBase} ${isActive ? navLinkActive : ""}`
                            }
                        >
                            Help
                        </NavLink>
                    </nav>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search..."
                            className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button type="submit" size="sm" variant="outline">
                            Search
                        </Button>
                    </form>

                    <div className="flex gap-2">
                        {!isAuthenticated ? (
                            <>
                                <NavLink to="/login" className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full">
                                        Login
                                    </Button>
                                </NavLink>

                                <NavLink to="/register" className="flex-1">
                                    <Button size="sm" className="w-full">
                                        Register
                                    </Button>
                                </NavLink>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={logout}
                            >
                                Logout
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
