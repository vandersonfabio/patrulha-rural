"use client";

import React, { useEffect, useRef, useState } from "react";
import { Property } from "../lib/db";

interface SeridoMapProps {
  properties: Property[];
  onSelectProperty: (id: number) => void;
}

export default function SeridoMap({ properties, onSelectProperty }: SeridoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // 1. Load Leaflet CSS dynamically to prevent SSR issues
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // 2. Load Leaflet JS dynamically
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        Promise.resolve().then(() => setLeafletLoaded(true));
      };
      document.head.appendChild(script);
    } else {
      if ((window as any).L) {
        Promise.resolve().then(() => setLeafletLoaded(true));
      } else {
        const script = document.getElementById("leaflet-js");
        if (script) {
          script.addEventListener("load", () => {
            Promise.resolve().then(() => setLeafletLoaded(true));
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Center of Seridó Potiguar (Caicó area, RN)
    // Latitude: -6.45, Longitude: -36.9
    const defaultCenter = [-6.45, -36.9]; 
    const defaultZoom = 9;

    // Initialize map if not already done
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView(defaultCenter, defaultZoom);

      // Add Google Hybrid layer (Satellite imagery with road and town labels)
      L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"]
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Custom pulsing marker icon styling using Tailwind
    const createCustomIcon = (name: string) => {
      return L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="flex flex-col items-center">
            <span class="relative flex h-4.5 w-4.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#bfcca1] opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-[#bfcca1] border-2 border-[#121410] shadow-md"></span>
            </span>
            <div class="bg-[#121410]/95 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded border border-[#bfcca1]/40 text-[#bfcca1] mt-1 shadow-lg whitespace-nowrap overflow-hidden max-w-[120px] text-ellipsis">
              ${name}
            </div>
          </div>
        `,
        iconSize: [120, 45],
        iconAnchor: [60, 22]
      });
    };

    // Add markers for all properties
    properties.forEach(prop => {
      if (!prop.gpsCoordinates) return;
      
      const parts = prop.gpsCoordinates.split(",");
      if (parts.length !== 2) return;
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(prop.name)
      }).addTo(map);

      marker.on("click", () => {
        if (prop.id !== undefined) {
          onSelectProperty(prop.id);
        }
      });

      markersRef.current.push(marker);
    });

  }, [leafletLoaded, properties, onSelectProperty]);

  return (
    <div className="w-full h-full relative bg-[#121410] rounded-xl overflow-hidden">
      {!leafletLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-semibold text-[#76786d] uppercase tracking-wider bg-[#121410] z-10">
          <span className="animate-pulse">Sincronizando Satélite...</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
