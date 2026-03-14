import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar />
            <main>{children}</main>
            <Footer />
        </div>
    );
}
