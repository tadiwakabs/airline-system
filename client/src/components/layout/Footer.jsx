import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-300 mt-20">
            <div className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
                
                {/* Brand Column */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-500/20">
                            33
                        </div>
                        <div>
                            <p className="text-xl font-black text-white tracking-tight">3380 Airlines</p>
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Sky is not the limit</p>
                        </div>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-400">
                        Experience world-class travel with 3380 Airlines. From luxury seating to seamless bookings, we make every journey feel like home.
                    </p>
                </div>

                {/* Navigation Columns */}
                <div>
                    <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-white">Explore</h3>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link to="/book" className="hover:text-blue-400 transition-colors">Book a Flight</Link></li>
                        <li><Link to="/manage" className="hover:text-blue-400 transition-colors">Manage Booking</Link></li>
                        <li><Link to="/help" className="hover:text-blue-400 transition-colors">Help & Contact</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-white">Legal</h3>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link to="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                        <li><Link to="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                        <li><Link to="#" className="hover:text-blue-400 transition-colors">Cookie Policy</Link></li>
                    </ul>
                </div>

                {/* Contact Column */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-white">Contact Us</h3>
                    <div className="space-y-3 text-sm">
                        <p className="flex justify-between font-medium">Email: <span className="text-white">support@3380.com</span></p>
                        <p className="flex justify-between font-medium">Phone: <span className="text-white">+1 (800) 338-0000</span></p>
                        <div className="pt-4 border-t border-white/10">
                            <p className="text-[10px] uppercase font-black text-slate-500">Support Hours</p>
                            <p className="text-xs text-slate-300 font-bold">24/7 Global Assistance</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5 bg-black/20">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    <p>© 2026 3380 Airlines. Built for COSC 3380.</p>
                    <div className="flex gap-6">
                        <span className="text-slate-600 italic">Redefining modern air travel</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}