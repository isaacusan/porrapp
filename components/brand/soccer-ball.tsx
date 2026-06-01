import * as React from "react";

/** Simple, crisp soccer ball used in the PORRAPP wordmark and empty states. */
export function SoccerBall({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="24" cy="24" r="22" fill="currentColor" />
      <path
        d="M24 9.5l8.5 6.2-3.25 10h-10.5l-3.25-10L24 9.5z"
        fill="#0b3d22"
      />
      <path
        d="M24 9.5V4m8.5 11.7l4.9-3.1m-1.65 13.1l5.2.3M29.25 25.7l3.2 9.1m-17.9-9.1l-3.2 9.1m-1.6-9.4l-5.2.3M11.1 15.7L6.2 12.6"
        stroke="#0b3d22"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
