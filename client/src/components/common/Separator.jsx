import React from "react";
import { cn } from "../../utils/cn";

export default function Separator({
      orientation = "horizontal",
      thickness = "1px",
      className = "my-2",
    }) {
    if (orientation === "vertical") {
        return (
            <div
                className={cn("bg-gray-200 self-stretch", className)}
                style={{ width: thickness }}
                aria-hidden="true"
            />
        );
    }

    return (
        <div
            className={cn("w-full bg-gray-200", className)}
            style={{ height: thickness }}
            aria-hidden="true"
        />
    );
}
