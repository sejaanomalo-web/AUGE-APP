import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        {/* Closed triangle outline — peak top, sharp miter corners,
         * matches the ꓥuge brand mark. Gold on pure black. */}
        <svg
          width="22"
          height="20"
          viewBox="0 0 22 20"
          fill="none"
          stroke="#C9953A"
          strokeWidth="2.4"
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
