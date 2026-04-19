import React from "react";
import Card from "../common/Card";
import Button from "../common/Button";

export default function FeatureCard({
       image,
       origin,
       destination,
       price,
       dateRange,
       isPromotion = false,
       onBook,
   }) {
    return (
        <Card className="w-full max-w-sm">
            <div className="h-48 w-full overflow-hidden">
                <img
                    src={image}
                    alt={`${origin} to ${destination}`}
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-[19px] font-semibold">
                            {origin} → {destination}
                        </h3>
                        <p className="text-sm text-gray-500">{dateRange}</p>
                    </div>

                    {isPromotion && (
                        <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
              Promotion!
            </span>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-lg font-bold">${price}</p>
                    <Button size="sm" onClick={onBook} className="cursor-pointer">
                        View Flight
                    </Button>
                </div>
            </div>
        </Card>
    );
}
