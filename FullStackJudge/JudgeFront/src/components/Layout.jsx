import React from 'react';

/**
 * Layout component with Sokol 1900 background theme
 * Provides consistent background styling across all pages
 */
export default function Layout({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Layer with Sokol Image */}
      <div className="fixed inset-0 z-0">
        {/* Sokol Logo Background */}
        <img
          src="/banner.webp"
          alt=""
          className="w-full h-full object-cover object-center opacity-5"
        />
        {/* Gradient Overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/95 via-white/90 to-gray-100/95" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
