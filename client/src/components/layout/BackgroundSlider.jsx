import React, { useState, useEffect } from "react";

const images = [
    "https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=1920&auto=format&fit=crop", 
     //"https://images.unsplash.com/photo-1543160732-37839659028a?q=80&w=1920&auto=format&fit=crop", //problem pic
    "https://images.unsplash.com/photo-1529074963764-98f45c47344b?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542296332-2e4473faf563?q=80&w=1920&auto=format&fit=crop"

];

const BackgroundSlider = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); // Changes every 5 seconds

        return () => clearInterval(interval); // Cleanup timer on unmount
    }, []);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            {images.map((img, i) => (
                <div
                    key={img}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        i === index ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${img})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            ))}
        </div>
    );
};

export default BackgroundSlider;