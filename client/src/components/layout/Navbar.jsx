import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { useAuth } from "../../contexts/AuthContext";
import {
    LogOut,
    ChevronDown,
    User,
    Ticket,
    LayoutDashboard,
} from "lucide-react";

const navLinkBase = "text-sm font-semibold transition-all duration-300 drop-shadow-sm";

const SEARCH_PAGES = [
    { label: "Book a Flight", path: "/", keywords: ["book", "home", "flight", "search", "ticket"] },
    { label: "Flight Search", path: "/flight-search", keywords: ["flight search", "find flight", "search flights"] },
    { label: "Manage Your Bookings", path: "/manage", keywords: ["manage", "booking", "my booking", "manage booking"] },
    { label: "My Profile", path: "/profile", keywords: ["profile", "account", "my account", "settings"] },
    { label: "Login", path: "/login", keywords: ["login", "sign in", "signin"] },
    { label: "Register", path: "/register", keywords: ["register", "sign up", "signup", "create account"] },
    { label: "Help", path: "/help", keywords: ["help", "support", "contact", "faq"] },
    { label: "Manage Aircraft", path: "/aircraft", keywords: ["aircraft", "planes", "fleet"] },
    { label: "Manage Flights", path: "/flights", keywords: ["flights", "schedule", "manage flights"] },
    { label: "View Reports", path: "/reports", keywords: ["reports", "analytics", "demand", "revenue"] },
];

function searchPages(query, { isAuthenticated, isAdmin, isFlightOps }) {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();

    return SEARCH_PAGES
        .filter((page) => {
            if ((page.path === "/login" || page.path === "/register") && isAuthenticated) return false;
            if (page.path === "/aircraft" || page.path === "/flights") return isAdmin || isFlightOps;
            if (page.path === "/reports") return isAdmin;
            return true;
        })
        .filter(
            (page) =>
                page.label.toLowerCase().includes(lower) ||
                page.keywords.some((k) => k.includes(lower))
        );
}

const SearchBox = ({
    isScrolled,
    searchValue,
    setSearchValue,
    searchResults,
    showDropdown,
    setShowDropdown,
    activeIndex,
    handleKeyDown,
    handleSearch,
    goToPage,
    searchRef,
}) => (
    <div ref={searchRef} className="relative w-64 lg:w-72">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder="Search pages..."
                    className={`w-full rounded-full border px-4 py-1.5 text-sm outline-none transition-all ${
                        isScrolled
                            ? "bg-gray-100 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500"
                            : "bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20"
                    }`}
                />
                {showDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-2xl z-[100] overflow-hidden">
                        {searchResults.map((result, i) => (
                            <button
                                key={result.path + result.label}
                                type="button"
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
                                <span className="font-semibold">{result.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </form>
    </div>
);

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const profileMenuRef = useRef(null);
    const searchRef = useRef(null);

    const role = (user?.userRole || user?.UserRole || "").trim().toLowerCase();
    const isAdmin = role === "administrator";
    const isEmployee = role === "employee";
    const department = (user?.department || "").replace(/\s+/g, "").trim().toLowerCase();
    const isFlightOps = isEmployee && department === "flightops";

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 30);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const results = searchPages(searchValue, { isAuthenticated, isAdmin, isFlightOps });
        setSearchResults(results);
        setShowDropdown(results.length > 0 && searchValue.trim() !== "");
        setActiveIndex(-1);
    }, [searchValue, isAuthenticated, isAdmin, isFlightOps]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) setShowDropdown(false);
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setIsProfileMenuOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const goToPage = (path) => {
        navigate(path);
        setSearchValue("");
        setShowDropdown(false);
        setActiveIndex(-1);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (activeIndex >= 0 && searchResults[activeIndex]) {
            goToPage(searchResults[activeIndex].path);
        } else if (searchResults.length > 0) {
            goToPage(searchResults[0].path);
        }
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

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
                isScrolled
                    ? "bg-white/90 backdrop-blur-lg shadow-md py-2 border-b border-gray-200"
                    : "bg-white/10 backdrop-blur-md py-5 border-b border-white/10"
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
                
                {/* --- LOGO & TAGLINE SECTION --- */}
                <Link to="/" className="flex items-end gap-3 group">
                    <div className="flex h-10 w-auto items-center">
                        <img 
                            src="/logo.png" 
                            alt="Divided Airline Logo" 
                            className="h-full w-auto object-contain transition-transform group-hover:scale-105" 
                            onError={(e) => console.log("Image failed to load:", e.target.src)}
                        />
                    </div>
                    <div className="flex flex-col pb-0.5">
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] italic transition-colors duration-300 ${
                            isScrolled ? "text-blue-600" : "text-blue-400"
                        }`}>
                            Fly Smarter
                        </span>
                    </div>
                </Link>

                <nav
                    className={`hidden md:flex items-center gap-8 ${
                        isScrolled ? "text-slate-600" : "text-white"
                    }`}
                >
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive ? "text-blue-500" : "hover:text-blue-400"}`
                        }
                    >
                        Book
                    </NavLink>
                    <NavLink
                        to="/manage"
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive ? "text-blue-500" : "hover:text-blue-400"}`
                        }
                    >
                        Manage
                    </NavLink>
                    <NavLink
                        to="/help"
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive ? "text-blue-500" : "hover:text-blue-400"}`
                        }
                    >
                        Help
                    </NavLink>
                </nav>

                <div className="flex items-center gap-5">
                    <SearchBox
                        isScrolled={isScrolled}
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        searchResults={searchResults}
                        showDropdown={showDropdown}
                        setShowDropdown={setShowDropdown}
                        activeIndex={activeIndex}
                        handleKeyDown={handleKeyDown}
                        handleSearch={handleSearch}
                        goToPage={goToPage}
                        searchRef={searchRef}
                    />

                    {!isAuthenticated ? (
                        <div className="flex gap-2">
                            <Link to="/login">
                                <Button
                                    variant={isScrolled ? "outline" : "ghost"}
                                    size="sm"
                                    className={!isScrolled ? "text-white border-white/20 hover:bg-white/10 shadow-sm" : ""}
                                >
                                    Login
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button size="sm" className="shadow-lg shadow-blue-500/20">
                                    Register
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className={`flex items-center gap-2 rounded-full border px-2 py-1 transition-all ${
                                    isScrolled
                                        ? "border-slate-200 bg-slate-50"
                                        : "border-white/20 bg-white/10 text-white"
                                }`}
                            >
                                <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                    <User size={16} />
                                </div>
                                <span className="text-sm font-bold">
                                    {user?.firstName || user?.username}
                                </span>
                                <ChevronDown size={14} />
                            </button>

                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl">
                                    <div className="px-3 py-3 border-b border-gray-50">
                                        <p className="text-sm font-bold text-slate-900">
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">
                                            {user?.userRole || user?.UserRole}
                                        </p>
                                    </div>
                                    <div className="py-2 space-y-1">
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                                        >
                                            <User size={16} /> Profile
                                        </Link>
                                        {isEmployee && (
                                            <Link
                                                to="/employee/dashboard"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-green-50 rounded-lg"
                                            >
                                                <LayoutDashboard size={16} className="text-green-600" /> Employee Dashboard
                                            </Link>
                                        )}
                                        {isAdmin && (
                                            <Link
                                                to="/admin/dashboard"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <LayoutDashboard size={16} /> Admin Dashboard
                                            </Link>
                                        )}
                                        <Link
                                            to="/manage"
                                            onClick={() => setIsProfileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                                        >
                                            <Ticket size={16} /> Bookings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}