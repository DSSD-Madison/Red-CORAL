export type Category = {
  name: string;
  color: string;
  deleted?: boolean;

  typeIDS: string[];
};

export type Type = {
  name: string;
  deleted?: boolean;

  categoryID: string;
  incidentIDS: string[];
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Incident = {
  description: string;
  date: Date;
  location: Coordinates;
  country: string;
  department: string;
  municipality: string;
  deleted?: boolean;

  typeID: string;
};
