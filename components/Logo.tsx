export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.16" />
      <rect x="1" y="1" width="38" height="38" rx="9" stroke="white" strokeOpacity="0.25" />
      {/* Stylized "E" mark with a bolt accent, evoking fast/flexible device financing */}
      <path
        d="M13 10.5C13 9.67157 13.6716 9 14.5 9H25.5C26.3284 9 27 9.67157 27 10.5C27 11.3284 26.3284 12 25.5 12H16V18H24C24.8284 18 25.5 18.6716 25.5 19.5C25.5 20.3284 24.8284 21 24 21H16V28H25.5C26.3284 28 27 28.6716 27 29.5C27 30.3284 26.3284 31 25.5 31H14.5C13.6716 31 13 30.3284 13 29.5V10.5Z"
        fill="white"
      />
      <path
        d="M22.5 14L19 20.5H21.5L20 26L25 19H22.5L24 14H22.5Z"
        fill="#0052FF"
      />
    </svg>
  );
}
