import React, { useState } from 'react';

interface ImageCarouselProps {
    images: string[];
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;

    const nextSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    return (
        <div className="relative w-full aspect-video bg-black group overflow-hidden">
            <div
                className="w-full h-full bg-contain bg-center bg-no-repeat transition-all duration-300"
                style={{ backgroundImage: `url(${images[currentIndex]})` }}
                onClick={() => window.open(images[currentIndex], '_blank')}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <span className="material-symbols-outlined text-xl">chevron_left</span>
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <span className="material-symbols-outlined text-xl">chevron_right</span>
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                className={`size-2 rounded-full shadow-sm transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>

                    {/* Index Indicator */}
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {currentIndex + 1}/{images.length}
                    </div>
                </>
            )}
        </div>
    );
};
