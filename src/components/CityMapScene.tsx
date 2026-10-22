import { useId } from "react";
import { CITY_TERRITORIES } from "../../config/cityMap";

export function CityMapScene({ rescued = [], nextId }: {
  rescued?: readonly string[];
  nextId?: string;
}) {
  const id = useId();
  return (
    <svg viewBox="0 0 1000 500" aria-hidden="true"
      className="city-territories pointer-events-none absolute inset-0 h-full w-full select-none">
      <defs>
        <image id={`${id}-city`} href="/maps/ciudad-territorios.webp" width="1000" height="500" />
        <filter id={`${id}-gray`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
        </filter>
        {CITY_TERRITORIES.map(territory => (
          <clipPath key={territory.slug} id={`${id}-${territory.slug}`}>
            <polygon points={territory.polygon} />
          </clipPath>
        ))}
      </defs>
      <use href={`#${id}-city`} filter={`url(#${id}-gray)`} />
      {CITY_TERRITORIES.map(territory => {
        const complete = rescued.includes(territory.slug);
        return (
          <g key={territory.slug} data-territory={territory.slug} data-restored={complete}>
            <g clipPath={`url(#${id}-${territory.slug})`}>
              <use href={`#${id}-city`} className="city-territory-color" opacity={complete ? 1 : 0} />
            </g>
            <polygon points={territory.polygon} fill="none" vectorEffect="non-scaling-stroke"
              stroke={territory.slug === nextId ? "#fff4d3" : "#fff8eb"}
              strokeOpacity={territory.slug === nextId ? .98 : .82}
              strokeWidth={territory.slug === nextId ? 5 : 3}
              strokeLinejoin="round" />
            <polygon points={territory.polygon} fill="none" vectorEffect="non-scaling-stroke"
              stroke={territory.slug === nextId ? "#c78316" : "#283b54"}
              strokeOpacity={territory.slug === nextId ? .98 : .58}
              strokeWidth={territory.slug === nextId ? 2.25 : 1.15}
              strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
}
