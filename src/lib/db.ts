import Dexie, { type EntityTable } from "dexie";

export const db = new Dexie("red-coral") as Dexie & {
  incidents: EntityTable<Incident>;
  categories: EntityTable<Category>;
  incidentTypes: EntityTable<IncidentType>;
};

type Incident = {
  id: string;
  description: string;
  date: Date;
  latitude: number;
  longitude: number;
  country: string;
  department: string;
  municipality: string;
  types: string[];
  hidden: number;
};

type Category = {
  id: string;
  name: string;
  color: string;
  hidden: number;
};

type IncidentType = {
  id: string;
  name: string;
  hidden: number;
};

db.version(1).stores({
  incidents:
    "++id,description,date,latitude,longitude,country,department,municipality,types,hidden",
  categories: "++id,name,color,hidden",
  incidentTypes: "++id,name,hidden",
});
