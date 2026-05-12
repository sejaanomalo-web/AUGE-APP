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
          height="110"
          viewBox="0 0 22 20"
          fill="none"
          stroke="#C9953A"
          strokeWidth="2"
          strokeLinejoin="miter"
          strokeMiterlimit="10"
        >
          <path d="M11 2 L20 18 L2 18 Z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
