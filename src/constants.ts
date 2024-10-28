import { PeliasGeoJSONFeature } from '@stadiamaps/api';
import { LatLngExpression } from 'leaflet'
export const INITIAL_BOUNDS = [6, -75] as LatLngExpression // Centered on Medellin, Colombia
export const INITIAL_ZOOM = 6.25;
export const ADDITIONAL_FEATURES: PeliasGeoJSONFeature[] = [
  {
    type: "Feature",
    properties: {
      label: "Océano Pacífico",
      country_a: "PO"
    },
    geometry: {
      type: "Point",
      coordinates: [3, -99]
    }
  },
  {
    type: "Feature",
    properties: {
      label: "Mar Caribe",
      country_a: "CS"
    },
    geometry: {
      type: "Point",
      coordinates: [14, -75]
    }
  }
];