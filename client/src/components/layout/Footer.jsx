import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="mt-12 border-t border-gray-200 bg-white">
            <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                            33
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">3380 Airlines</p>
                            <p className="text-sm text-gray-500">
                                Book and manage your travel with ease.
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Explore
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <Link to="/book" className="block hover:text-blue-600">
                            Book a Flight
                        </Link>
                        <Link to="/manage" className="block hover:text-blue-600">
                            Manage Booking
                        </Link>
                        <Link to="/help" className="block hover:text-blue-600">
                            Help & Contact
                        </Link>
                    </div>
                </div>

                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Account
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <Link to="/login" className="block hover:text-blue-600">
                            Login
                        </Link>
                        <Link to="/register" className="block hover:text-blue-600">
                            Register
                        </Link>
                    </div>
                </div>

                <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900">
                        Contact
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>Email: support@3380airlines.com</p>
                        <p>Phone: +1 (800) 338-0000</p>
                        <p>Hours: 24/7 Customer Support</p>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-100">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-gray-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
                    <p>© 2026 3380 Airlines. All rights reserved.</p>
                    <p>Built for the COSC 3380 Airline Ticketing System project.</p>
                </div>
            </div>
        </footer>
    );
}
