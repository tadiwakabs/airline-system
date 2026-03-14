import React from "react";
import { cn } from "../../utils/cn";

export default function Card({ children, className = "" }) {
    return (
        <div
            className={cn(
                "bg-white rounded-md shadow-md border border-gray-200 overflow-hidden",
                className
            )}
        >
            {children}
        </div>
    );
}
