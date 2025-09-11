// CustomShape.jsx
export default function CustomShape({
  color = "bg-green-600", // Tailwind background color
  width = "w-32",         // Tailwind width
  height = "h-64",        // Tailwind height
}) {
  return (
    <div className={`${width} ${height} relative`}>
      {/* Hidden SVG for clip-path */}
      <svg width="0" height="0">
        <clipPath id="customShape" clipPathUnits="objectBoundingBox">
          <path
            d="M0,0.1 
               Q0,0 0.1,0 
               H0.9 
               Q1,0 1,0.1 
               V0.9 
               Q1,1 0.9,1 
               H0.1 
               Q0,1 0,0.9 
               Z 
               M0.40,0 
               a0.05,0.05 0 1,0 0.2,0 
               a0.05,0.05 0 1,0 -0.1,0"
          />
        </clipPath>
      </svg>

      {/* Main shape */}
      <div
        className={`w-full h-full ${color}`}
        style={{ clipPath: "url(#customShape)" }}
      ></div>
    </div>
  );
}
