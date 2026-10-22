// Matching paper and ink colors keep the writing readable without covering the photo.
const APPEARANCES: Record<
  string,
  { paper: string; ink: string; accent: string }
> = {
  mar: { paper: "#e1f5ef", ink: "#163d42", accent: "#3ca4aa" },
  bosque: { paper: "#e7ede1", ink: "#253c2d", accent: "#73977a" },
  nubes: { paper: "#faeaf2", ink: "#513349", accent: "#ce8eae" },
  dunas: { paper: "#f8ebd6", ink: "#4e3828", accent: "#ca975e" },
  cerezo: { paper: "#fff0f5", ink: "#442c3c", accent: "#cf7a9c" },
  flores: { paper: "#edf5e5", ink: "#263c2b", accent: "#81a862" },
  fogata: { paper: "#38221e", ink: "#fff1dc", accent: "#f99a59" },
  noche: { paper: "#202841", ink: "#f4efff", accent: "#b6a1ff" },
  llano: { paper: "#fff0ce", ink: "#49341c", accent: "#e1a545" },
  lluvia: { paper: "#23394a", ink: "#eff9ff", accent: "#8ac9e7" },
};
export function noteAppearance(cover: string) {
  return (
    APPEARANCES[cover] ?? {
      paper: "#fffdf7",
      ink: "#17233b",
      accent: "#b9af99",
    }
  );
}
