import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppLayout({ children }) {
    return (
        <div className="min-h-screen bg-transparent text-slate-900 flex flex-col">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
        </div>
    );
}
