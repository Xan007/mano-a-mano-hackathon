import { Loader2 } from "lucide-react";
import { GoogleMark } from "./GoogleMark";

export function GooglePending() {
  return (
    <button type="button" disabled aria-busy="true" className="btn btn-ghost w-full">
      <GoogleMark className="h-5 w-5" />
      Continuar con Google
      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
    </button>
  );
}
