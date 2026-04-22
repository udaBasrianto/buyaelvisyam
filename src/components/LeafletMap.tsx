import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LeafletMapProps {
  lat: number;
  lng: number;
  locationName?: string;
  height?: string;
}

export function LeafletMap({ lat, lng, locationName, height = "300px" }: LeafletMapProps) {
  if (!lat || !lng) return null;

  return (
    <div style={{ height, width: '100%', borderRadius: '1rem', overflow: 'hidden' }} className="border card-shadow">
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          {locationName && (
            <Popup>
              <div className="font-bold text-sm">{locationName}</div>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
