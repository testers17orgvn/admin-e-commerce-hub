 import { useEffect, useRef, useState, useCallback } from 'react';
 import { Loader2, MapPin, AlertCircle } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 // Google Maps types
 declare global {
   interface Window {
     google: typeof google;
   }
 }
 
 interface LatLng {
   lat: number;
   lng: number;
 }
 
 interface GoogleMapProps {
   shipperLocation?: LatLng | null;
   destinationLocation?: LatLng | null;
   onShipperMove?: (location: LatLng) => void;
   isShipperMode?: boolean;
   className?: string;
   showRoute?: boolean;
 }
 
 export function GoogleMap({
   shipperLocation,
   destinationLocation,
   onShipperMove,
   isShipperMode = false,
   className,
   showRoute = true,
 }: GoogleMapProps) {
   const mapRef = useRef<HTMLDivElement>(null);
   const [map, setMap] = useState<google.maps.Map | null>(null);
   const [shipperMarker, setShipperMarker] = useState<google.maps.Marker | null>(null);
   const [destinationMarker, setDestinationMarker] = useState<google.maps.Marker | null>(null);
   const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
 
   // Load Google Maps script
   useEffect(() => {
     if (!apiKey) {
       setError('Google Maps API key chưa được cấu hình');
       setLoading(false);
       return;
     }
 
     if (window.google?.maps) {
       initializeMap();
       return;
     }
 
     const script = document.createElement('script');
     script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
     script.async = true;
     script.defer = true;
     script.onload = () => initializeMap();
     script.onerror = () => {
       setError('Không thể tải Google Maps');
       setLoading(false);
     };
     document.head.appendChild(script);
 
     return () => {
       // Cleanup if needed
     };
   }, [apiKey]);
 
   const initializeMap = useCallback(() => {
     if (!mapRef.current || !window.google) return;
 
     const defaultCenter = shipperLocation || destinationLocation || { lat: 21.0285, lng: 105.8542 }; // Hanoi
 
     const mapInstance = new google.maps.Map(mapRef.current, {
       center: defaultCenter,
       zoom: 15,
       disableDefaultUI: false,
       zoomControl: true,
       mapTypeControl: false,
       streetViewControl: false,
       fullscreenControl: true,
       styles: [
         {
           featureType: 'poi',
           elementType: 'labels',
           stylers: [{ visibility: 'off' }],
         },
       ],
     });
 
     setMap(mapInstance);
     setLoading(false);
 
     // Initialize directions renderer
     const renderer = new google.maps.DirectionsRenderer({
       suppressMarkers: true,
       polylineOptions: {
         strokeColor: '#3b82f6',
         strokeWeight: 4,
       },
     });
     renderer.setMap(mapInstance);
     setDirectionsRenderer(renderer);
   }, [shipperLocation, destinationLocation]);
 
   // Update shipper marker
   useEffect(() => {
     if (!map || !window.google) return;
 
     if (shipperLocation) {
       if (shipperMarker) {
         // Animate marker movement
         const start = shipperMarker.getPosition();
         const end = new google.maps.LatLng(shipperLocation.lat, shipperLocation.lng);
         
         if (start) {
           animateMarker(shipperMarker, start, end, 1000);
         } else {
           shipperMarker.setPosition(shipperLocation);
         }
       } else {
         const marker = new google.maps.Marker({
           position: shipperLocation,
           map,
           title: 'Shipper',
           icon: {
             path: google.maps.SymbolPath.CIRCLE,
             scale: 12,
             fillColor: '#3b82f6',
             fillOpacity: 1,
             strokeColor: '#ffffff',
             strokeWeight: 3,
           },
           animation: google.maps.Animation.DROP,
         });
         setShipperMarker(marker);
       }
     }
   }, [map, shipperLocation]);
 
   // Update destination marker
   useEffect(() => {
     if (!map || !window.google) return;
 
     if (destinationLocation) {
       if (destinationMarker) {
         destinationMarker.setPosition(destinationLocation);
       } else {
         const marker = new google.maps.Marker({
           position: destinationLocation,
           map,
           title: 'Điểm giao hàng',
           icon: {
             path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
             scale: 8,
             fillColor: '#ef4444',
             fillOpacity: 1,
             strokeColor: '#ffffff',
             strokeWeight: 2,
           },
         });
         setDestinationMarker(marker);
       }
     }
   }, [map, destinationLocation]);
 
   // Draw route
   useEffect(() => {
     if (!map || !directionsRenderer || !showRoute || !shipperLocation || !destinationLocation) return;
 
     const directionsService = new google.maps.DirectionsService();
     
     directionsService.route(
       {
         origin: shipperLocation,
         destination: destinationLocation,
         travelMode: google.maps.TravelMode.DRIVING,
       },
       (result, status) => {
         if (status === 'OK' && result) {
           directionsRenderer.setDirections(result);
         }
       }
     );
   }, [map, directionsRenderer, shipperLocation, destinationLocation, showRoute]);
 
   // Animate marker smoothly
   const animateMarker = (marker: google.maps.Marker, start: google.maps.LatLng, end: google.maps.LatLng, duration: number) => {
     const startTime = performance.now();
     
     const animate = (currentTime: number) => {
       const elapsed = currentTime - startTime;
       const progress = Math.min(elapsed / duration, 1);
       
       // Ease out cubic
       const easeProgress = 1 - Math.pow(1 - progress, 3);
       
       const lat = start.lat() + (end.lat() - start.lat()) * easeProgress;
       const lng = start.lng() + (end.lng() - start.lng()) * easeProgress;
       
       marker.setPosition({ lat, lng });
       
       if (progress < 1) {
         requestAnimationFrame(animate);
       }
     };
     
     requestAnimationFrame(animate);
   };
 
   // Shipper mode: track current location
   useEffect(() => {
     if (!isShipperMode || !onShipperMove) return;
 
     const watchId = navigator.geolocation.watchPosition(
       (position) => {
         onShipperMove({
           lat: position.coords.latitude,
           lng: position.coords.longitude,
         });
       },
       (error) => {
         console.error('Geolocation error:', error);
       },
       {
         enableHighAccuracy: true,
         maximumAge: 10000,
         timeout: 5000,
       }
     );
 
     return () => {
       navigator.geolocation.clearWatch(watchId);
     };
   }, [isShipperMode, onShipperMove]);
 
   // Fit bounds to show both markers
   useEffect(() => {
     if (!map || !window.google) return;
     
     if (shipperLocation && destinationLocation) {
       const bounds = new google.maps.LatLngBounds();
       bounds.extend(shipperLocation);
       bounds.extend(destinationLocation);
       map.fitBounds(bounds);
     } else if (shipperLocation) {
       map.panTo(shipperLocation);
     } else if (destinationLocation) {
       map.panTo(destinationLocation);
     }
   }, [map, shipperLocation, destinationLocation]);
 
   if (error) {
     return (
       <div className={cn('flex flex-col items-center justify-center bg-muted rounded-lg p-8', className)}>
         <AlertCircle className="h-12 w-12 text-destructive mb-4" />
         <p className="text-muted-foreground text-center">{error}</p>
       </div>
     );
   }
 
   return (
     <div className={cn('relative rounded-lg overflow-hidden', className)}>
       {loading && (
         <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       )}
       <div ref={mapRef} className="w-full h-full min-h-[300px]" />
     </div>
   );
 }