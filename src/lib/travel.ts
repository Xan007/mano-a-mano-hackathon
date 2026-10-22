import { createContext, useContext } from "react";

export type TravelRequest = {
  imagePath?: string;
  name: string;
  hasNote?: boolean;
  note?: string;
};
export type TravelRunner = <T>(
  request: TravelRequest,
  submit: () => Promise<T>,
) => Promise<T>;
export const TravelContext = createContext<TravelRunner | null>(null);
export function useTravel() {
  const run = useContext(TravelContext);
  if (!run) throw new Error("TravelExperience missing");
  return run;
}

export class TravelCancelled extends Error {}
