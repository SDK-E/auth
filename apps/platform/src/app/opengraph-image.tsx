import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Auth — multi-tenant authentication infrastructure by SDK Enterprises";

const sage = "#d7e8d3";
const brand = "#2cdb16";
const dark = "#082003";
const fog = "#abc4a6";

function A() {
  return (
    <div
      style={{
        position: "relative",
        width: 126,
        height: 126,
        display: "flex",
      }}
    >
      <div
        style={{
          width: 126,
          height: 126,
          borderRadius: 9999,
          borderWidth: 27,
          borderStyle: "solid",
          borderColor: sage,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 27,
          height: 126,
          background: sage,
        }}
      />
    </div>
  );
}

function U() {
  return (
    <div
      style={{
        width: 111,
        height: 126,
        borderLeftWidth: 27,
        borderRightWidth: 27,
        borderBottomWidth: 27,
        borderLeftStyle: "solid",
        borderRightStyle: "solid",
        borderBottomStyle: "solid",
        borderLeftColor: sage,
        borderRightColor: sage,
        borderBottomColor: sage,
        boxSizing: "border-box",
        borderRadius: "0 0 56px 56px",
      }}
    />
  );
}

function T() {
  return (
    <div
      style={{
        position: "relative",
        width: 102,
        height: 156,
        display: "flex",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 102,
          height: 27,
          background: sage,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 38,
          width: 27,
          height: 156,
          background: sage,
        }}
      />
    </div>
  );
}

function H() {
  return (
    <div
      style={{
        position: "relative",
        width: 111,
        height: 180,
        display: "flex",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 27,
          height: 180,
          background: sage,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 111,
          height: 100,
          borderTopWidth: 27,
          borderLeftWidth: 27,
          borderRightWidth: 27,
          borderTopStyle: "solid",
          borderLeftStyle: "solid",
          borderRightStyle: "solid",
          borderTopColor: sage,
          borderLeftColor: sage,
          borderRightColor: sage,
          boxSizing: "border-box",
          borderRadius: "56px 56px 0 0",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 73,
          right: 0,
          width: 27,
          height: 107,
          background: sage,
        }}
      />
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: dark,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 96,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
          <A />
          <U />
          <T />
          <H />
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 9999,
              background: brand,
              marginLeft: 36,
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: sage, fontSize: 34, lineHeight: 1.4 }}>
            Multi-tenant authentication infrastructure
          </div>
          <div
            style={{
              color: fog,
              fontSize: 19,
              letterSpacing: 6,
              textTransform: "uppercase",
              marginTop: 18,
            }}
          >
            OIDC · OAuth 2.1 · Universal login · Management API
          </div>
          <div style={{ color: fog, fontSize: 19, marginTop: 26 }}>
            auth.sdk.enterprises
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
