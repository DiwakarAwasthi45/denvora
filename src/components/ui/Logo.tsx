export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path
        d="M12 5.4C10.4 3.8 7.9 3.3 6 4.6c-1.9 1.3-2.6 4-2.2 6.6.4 2.5.8 3.7 1.1 5.6.2 1.4.5 3.8 1.9 3.8 1.6 0 1.5-2.6 1.8-4 .2-.9.3-1.5 1-1.6.6-.1 1.3.4 1.8 1.3.5.9.7 4.3 1.6 4.3s1.1-3.4 1.6-4.3c.5-.9 1.2-1.4 1.8-1.3.7.1.8.7 1 1.6.3 1.4.2 4 1.8 4 1.4 0 1.7-2.4 1.9-3.8.3-1.9.7-3.1 1.1-5.6.4-2.6-.3-5.3-2.2-6.6-1.9-1.3-4.4-.8-6 1"
        fill="#0d9488"
      />
      <path
        d="M8.2 6.6c1.4-.9 3-.7 3.8.8"
        stroke="#99f6e4"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
