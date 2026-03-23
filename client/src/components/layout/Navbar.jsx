import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Button from "../common/Button";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const navLinkBase =
    "text-sm font-medium text-gray-700 transition-colors hover:text-blue-600";

const navLinkActive = "text-blue-600";

export default function Navbar() {
    const [searchValue, setSearchValue] = useState("");
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        console.log("Search:", searchValue);
        // TODO: Connect search functionality to backend
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
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

                <div className="hidden items-center gap-3 lg:flex">
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search..."
                            className="w-64 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button type="submit" size="sm" variant="outline">
                            Search
                        </Button>
                    </form>

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
                        <div className="flex items-center gap-3">
                            {/* Profile */}
                            <Link to="/profile">
                                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                                    {user?.firstName?.[0] || user?.username?.[0] || "U"}
                                </div>
                            </Link>

                            {/* Logout */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="text-red-600 border-red-600 cursor-pointer hover:bg-red-100"
                            >
                                Logout
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-gray-100 px-4 py-3 md:hidden">
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
