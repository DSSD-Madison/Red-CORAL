import { useSnapshot } from "valtio";

import { state } from "./state";

export const useStore = () => {
  return useSnapshot(state);
};
