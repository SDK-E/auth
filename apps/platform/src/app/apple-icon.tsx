import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const sage = "#d7e8d3";
const brand = "#2cdb16";
const dark = "#082003";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: dark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div
            style={{
              position: "relative",
              width: 84,
              height: 84,
              display: "flex",
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 9999,
                borderWidth: 18,
                borderStyle: "solid",
                borderColor: sage,
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                right: -18,
                width: 18,
                height: 84,
                background: sage,
              }}
            />
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9999,
              background: brand,
              marginLeft: 20,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
