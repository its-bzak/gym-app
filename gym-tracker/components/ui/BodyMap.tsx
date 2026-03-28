import React from "react";
import Svg, { Path, G } from "react-native-svg";

type Muscle =
  | "upperChest"
  | "middleChest"
  | "lowerChest"
  | "frontDelts"
  | "sideDelts"
  | "biceps"
  | "absUpper"
  | "absLower"
  | "obliques"
  | "quads"
  | "calves"
  | "upperTraps"
  | "middleTraps"
  | "lowerTraps"
  | "rearDelts"
  | "triceps"
  | "latsUpper"
  | "latsLower"
  | "lowerBack"
  | "glutes"
  | "hamstrings";

type Props = {
  primaryMuscles: Muscle[];
  secondaryMuscles?: Muscle[];
  view?: "front" | "back";
};

export function BodyMap({
  primaryMuscles,
  secondaryMuscles = [],
  view = "front",
}: Props) {
  const getFill = (muscle: Muscle) => {
    if (primaryMuscles.includes(muscle)) return "#ef4444";
    if (secondaryMuscles.includes(muscle)) return "#f97316";
    return "#e5e7eb";
  };

  return (
    <Svg width={300} height={600} viewBox="0 0 300 600">
      {view === "front" ? (
        <G>
          <Path
            d="M90 120 L210 120 L200 160 L100 160 Z"
            fill={getFill("upperChest")}
          />
          <Path
            d="M100 160 L200 160 L195 190 L105 190 Z"
            fill={getFill("middleChest")}
          />
          <Path
            d="M105 190 L195 190 L190 215 L110 215 Z"
            fill={getFill("lowerChest")}
          />

          <Path
            d="M70 140 C60 170 60 200 80 210 L100 190 L90 150 Z"
            fill={getFill("frontDelts")}
          />
          <Path
            d="M230 140 C240 170 240 200 220 210 L200 190 L210 150 Z"
            fill={getFill("sideDelts")}
          />

          <Path
            d="M80 220 C70 260 70 310 90 330 L110 300 L100 230 Z"
            fill={getFill("biceps")}
          />

          <Path
            d="M120 230 L180 230 L175 275 L125 275 Z"
            fill={getFill("absUpper")}
          />
          <Path
            d="M125 275 L175 275 L170 320 L130 320 Z"
            fill={getFill("absLower")}
          />
          <Path
            d="M110 230 C80 280 80 330 110 360 L130 320 L125 275 Z"
            fill={getFill("obliques")}
          />

          <Path
            d="M120 330 C100 380 100 460 130 500 L150 420 L180 500 C200 460 200 380 180 330 Z"
            fill={getFill("quads")}
          />
        </G>
      ) : (
        <G>
          <Path
            d="M120 110 L180 110 L200 150 L100 150 Z"
            fill={getFill("upperTraps")}
          />
          <Path
            d="M100 150 L200 150 L195 185 L105 185 Z"
            fill={getFill("middleTraps")}
          />
          <Path
            d="M105 185 L195 185 L180 230 L120 230 Z"
            fill={getFill("lowerTraps")}
          />

          <Path
            d="M70 150 C60 180 60 210 80 220 L100 200 L90 160 Z"
            fill={getFill("rearDelts")}
          />

          <Path
            d="M80 230 C70 280 70 330 90 360 L110 330 L100 260 Z"
            fill={getFill("triceps")}
          />

          <Path
            d="M120 230 C80 260 80 300 110 330 L130 300 L180 300 L190 260 Z"
            fill={getFill("latsUpper")}
          />
          <Path
            d="M110 330 C80 370 80 420 130 450 L170 450 C220 420 220 370 190 330 Z"
            fill={getFill("latsLower")}
          />

          <Path
            d="M130 450 L170 450 L165 500 L135 500 Z"
            fill={getFill("lowerBack")}
          />

          <Path
            d="M120 500 C100 530 100 560 140 575 L160 575 C200 560 200 530 180 500 Z"
            fill={getFill("glutes")}
          />

          <Path
            d="M130 575 C115 600 115 640 140 660 L160 660 C185 640 185 600 170 575 Z"
            fill={getFill("hamstrings")}
          />

          <Path
            d="M135 660 C120 700 130 740 150 750 L160 700 L170 750 C190 740 200 700 185 660 Z"
            fill={getFill("calves")}
          />
        </G>
      )}
    </Svg>
  );
}