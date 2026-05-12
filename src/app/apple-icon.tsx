import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 22 22"
          fill="none"
          stroke="#C9953A"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 18 L11 4 L20 18" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
