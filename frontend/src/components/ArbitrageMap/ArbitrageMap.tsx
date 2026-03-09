import { useEffect, useState, useMemo } from 'react';
import {
  MapContainer,
  GeoJSON,
  useMap,
  Polyline,
  CircleMarker,
  Tooltip,
} from 'react-leaflet';
import { feature } from 'topojson-client';
import 'leaflet/dist/leaflet.css';
import './ArbitrageMap.css';

interface CountryData {
  code: string;
  avgPrice: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}

interface ArbitrageResponse {
  countries: CountryData[];
  overallAvg: number;
  priceRange: {
    min: number;
    max: number;
  };
}

interface ArbitrageMapProps {
  manufacturers?: string[];
  fuelTypes?: string[];
}

const GEO_BOUNDS = {
  west: 1,
  south: 36,
  east: 25,
  north: 56,
};

const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  AT: [47.5, 14.5],
  DE: [51.2, 10.4],
  IT: [41.9, 12.6],
  NL: [52.1, 5.3],
  BE: [50.5, 4.5],
  HU: [47.2, 19.5],
  SK: [48.7, 19.7],
  LU: [49.8, 6.1],
  CZ: [49.8, 15.5],
  PL: [51.9, 19.1],
  CH: [46.8, 8.2],
};

const ISO_TO_CODE: Record<string, string> = {
  AUT: 'AT',
  DEU: 'DE',
  ITA: 'IT',
  NLD: 'NL',
  ESP: 'ES',
  BEL: 'BE',
  SVN: 'SI',
  HUN: 'HU',
  SVK: 'SK',
  LUX: 'LU',
  CZE: 'CZ',
  POL: 'PL',
  HRV: 'HR',
  RSR: 'RS',
  CHE: 'CH',
  BGR: 'BG',
  ROU: 'RO',
  LTU: 'LT',
  GBR: 'GB',
  TUR: 'TR',
};

interface GeoJsonFeature {
  type: 'Feature';
  geometry: unknown;
  properties: Record<string, unknown>;
}

interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

function MapEvents() {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds([
      [GEO_BOUNDS.south, GEO_BOUNDS.west],
      [GEO_BOUNDS.north, GEO_BOUNDS.east],
    ]);
  }, [map]);

  return null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ArbitrageMap = ({
  manufacturers,
  fuelTypes,
}: ArbitrageMapProps) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonCollection | null>(
    null,
  );
  const [countryData, setCountryData] = useState<Map<string, CountryData>>(
    new Map(),
  );

  const maxCount = useMemo(() => {
    if (countryData.size === 0) return 1000;
    return Math.max(...Array.from(countryData.values()).map((c) => c.count));
  }, [countryData]);

  useEffect(() => {
    fetch('/concentrated europe map.json')
      .then((res) => res.json())
      .then((topology) => {
        const geojson = feature(
          topology as unknown as Parameters<typeof feature>[0],
          topology.objects.ne_10m_admin_0_countries as unknown as Parameters<
            typeof feature
          >[1],
        ) as unknown as GeoJsonCollection;
        setGeoJsonData(geojson);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (manufacturers && manufacturers.length > 0) {
      params.append('manufacturers', manufacturers.join(','));
    }
    if (fuelTypes && fuelTypes.length > 0) {
      params.append('fuelTypes', fuelTypes.join(','));
    }

    const url = `${API_URL}/analytics/arbitrage${params.toString() ? `?${params.toString()}` : ''}`;

    fetch(url)
      .then((res) => res.json())
      .then((data: ArbitrageResponse) => {
        const map = new Map<string, CountryData>();
        data.countries.forEach((c) => map.set(c.code, c));
        setCountryData(map);
      })
      .catch(console.error);
  }, [manufacturers?.join(','), fuelTypes?.join(',')]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStyle = (feature: any) => {
    const isoCode = feature.properties?.ISO_A3 as string;
    const countryCode = ISO_TO_CODE[isoCode];
    const country = countryData.get(countryCode);

    if (country && country.count > 0) {
      const normalizedCount = (country.count / maxCount) * 100;
      return {
        fillColor: getColor(normalizedCount),
        weight: 1,
        opacity: 1,
        color: '#666',
        fillOpacity: 1,
      };
    }

    return {
      fillColor: '#e8e8e8',
      weight: 1,
      opacity: 1,
      color: '#999',
      fillOpacity: 1,
    };
  };

  const getColor = (normalizedCount: number): string => {
    const colors = [
      '#ffffcc',
      '#c7e9b4',
      '#7fcdbb',
      '#41b6c4',
      '#1d91c0',
      '#225ea8',
      '#253494',
      '#081d58',
    ];

    if (normalizedCount <= 12.5) return colors[0];
    if (normalizedCount <= 25) return colors[1];
    if (normalizedCount <= 37.5) return colors[2];
    if (normalizedCount <= 50) return colors[3];
    if (normalizedCount <= 62.5) return colors[4];
    if (normalizedCount <= 75) return colors[5];
    if (normalizedCount <= 87.5) return colors[6];
    return colors[7];
  };

  if (!geoJsonData) {
    return <div className="loading-map">Loading map...</div>;
  }

  const latLines = [];
  for (
    let lat = Math.ceil(GEO_BOUNDS.south / 4) * 4;
    lat <= GEO_BOUNDS.north;
    lat += 4
  ) {
    latLines.push(lat);
  }
  const lngLines = [];
  for (
    let lng = Math.ceil(GEO_BOUNDS.west / 4) * 4;
    lng <= GEO_BOUNDS.east;
    lng += 4
  ) {
    lngLines.push(lng);
  }

  return (
    <div className="leaflet-container">
      <MapContainer
        center={[45.5, 8]}
        zoom={6.5}
        minZoom={6.5}
        maxZoom={11}
        maxBounds={[
          [GEO_BOUNDS.south, GEO_BOUNDS.west],
          [GEO_BOUNDS.north, GEO_BOUNDS.east],
        ]}
        maxBoundsViscosity={10.0}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <MapEvents />
        {latLines.map((lat) => (
          <Polyline
            key={`lat-${lat}`}
            positions={[
              [lat, GEO_BOUNDS.west],
              [lat, GEO_BOUNDS.east],
            ]}
            pathOptions={{ color: '#666', weight: 0.5, opacity: 0.5 }}
          />
        ))}
        {lngLines.map((lng) => (
          <Polyline
            key={`lng-${lng}`}
            positions={[
              [GEO_BOUNDS.south, lng],
              [GEO_BOUNDS.north, lng],
            ]}
            pathOptions={{ color: '#666', weight: 0.5, opacity: 0.5 }}
          />
        ))}
        <GeoJSON
          data={geoJsonData as unknown as GeoJSON.GeoJSON}
          style={getStyle}
        />
        {Array.from(countryData.entries()).map(([code, data]) => {
          const centroid = COUNTRY_CENTROIDS[code];
          if (!centroid || data.count <= 0) return null;
          return (
            <CircleMarker
              key={code}
              center={centroid}
              radius={0}
              pathOptions={{ fillOpacity: 0, stroke: false }}
            >
              <Tooltip direction="center" permanent>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '12px',
                    color: '#1e293b',
                  }}
                >
                  {code}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};
