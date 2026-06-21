import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

interface StoreLocationMapProps {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  zoom?: number;
  height?: string;
  className?: string;
  editable?: boolean;
  onChange?: (lat: number, lng: number) => void;
}

// Custom pin: gradient circle with store icon (SVG, no external assets)
const createPinIcon = (color: string = '#ef4444') =>
  L.divIcon({
    className: 'store-pin-icon',
    html: `
      <div style="position:relative;width:42px;height:54px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.35));">
        <svg viewBox="0 0 42 54" width="42" height="54" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
              <stop offset="100%" stop-color="#7f1d1d" stop-opacity="1"/>
            </linearGradient>
          </defs>
          <path d="M21 53 C21 53 3 32 3 18 A18 18 0 0 1 39 18 C39 32 21 53 21 53 Z" fill="url(#pg)" stroke="#fff" stroke-width="2.5"/>
          <circle cx="21" cy="18" r="8.5" fill="#fff"/>
          <path d="M16 14 h10 v2 l-1 6 h-8 l-1 -6 z M17 22 h8 v6 h-8 z" fill="${color}"/>
        </svg>
        <span style="position:absolute;left:50%;bottom:-4px;transform:translateX(-50%);width:14px;height:5px;background:rgba(0,0,0,.25);border-radius:50%;filter:blur(2px);"></span>
      </div>
    `,
    iconSize: [42, 54],
    iconAnchor: [21, 52],
    popupAnchor: [0, -48],
  });

function ClickHandler({ onChange }: { onChange?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export function StoreLocationMap({
  lat,
  lng,
  name,
  address,
  zoom = 16,
  height = '420px',
  className,
  editable = false,
  onChange,
}: StoreLocationMapProps) {
  const markerRef = useRef<L.Marker>(null);
  const icon = useMemo(() => createPinIcon('#ef4444'), []);

  // Auto-open popup once mounted
  useEffect(() => {
    const t = setTimeout(() => markerRef.current?.openPopup(), 300);
    return () => clearTimeout(t);
  }, [lat, lng]);

  return (
    <div
      className={cn('relative rounded-2xl overflow-hidden ring-1 ring-border shadow-xl', className)}
      style={{ height }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={lat} lng={lng} />
        {editable && <ClickHandler onChange={onChange} />}
        <Marker
          ref={markerRef}
          position={[lat, lng]}
          icon={icon}
          draggable={editable}
          eventHandlers={{
            dragend: (e) => {
              const m = e.target as L.Marker;
              const p = m.getLatLng();
              onChange?.(p.lat, p.lng);
            },
          }}
        >
          <Popup closeButton={false} className="store-popup">
            <div className="min-w-[180px]">
              <p className="font-bold text-sm text-foreground mb-0.5">
                {name || 'Cửa hàng của chúng tôi'}
              </p>
              {address && <p className="text-xs text-muted-foreground leading-snug">{address}</p>}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs font-medium text-accent hover:underline"
              >
                Chỉ đường →
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      {editable && (
        <div className="pointer-events-none absolute top-3 left-3 z-[400] rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium shadow-md border">
          💡 Nhấp lên bản đồ hoặc kéo pin để chọn vị trí
        </div>
      )}
    </div>
  );
}
