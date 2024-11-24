import { proxy } from "valtio";

import type { Category, Type, Incident } from "./types";

type State = {
  Categories: { [key: string]: Category };
  Types: { [key: string]: Type };
  Incidents: { [key: string]: Incident };
};

export const state = proxy<State>(); // TODO: initialization
