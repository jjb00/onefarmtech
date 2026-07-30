import {SITE_NAME} from "@/lib/publicSeo";

export function OgImageContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#07120c",
        backgroundImage:
          "radial-gradient(circle at 82% 18%, rgba(31,122,63,0.55) 0%, rgba(7,18,12,0) 45%), radial-gradient(circle at 8% 92%, rgba(242,184,75,0.35) 0%, rgba(7,18,12,0) 45%)",
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 18}}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: "#1f7a3f",
            color: "#ffffff",
            fontSize: 30,
            fontWeight: 900,
          }}
        >
          OFT
        </div>
        <div style={{fontSize: 30, fontWeight: 900, color: "#ffffff", letterSpacing: -0.5}}>
          {SITE_NAME}
        </div>
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: 22, maxWidth: 980}}>
        <div
          style={{
            display: "flex",
            fontSize: 66,
            fontWeight: 900,
            lineHeight: 1.08,
            color: "#ffffff",
            letterSpacing: -1,
          }}
        >
          Fresh produce supply for Nigerian buyers
        </div>
        <div style={{display: "flex", fontSize: 28, lineHeight: 1.4, color: "rgba(255,255,255,0.72)"}}>
          WhatsApp-first ordering for restaurants, hotels, caterers, retailers, offices and buying groups.
        </div>
      </div>

      <div style={{display: "flex", gap: 14}}>
        {["Managed sourcing", "Group-buy support", "Secure payments"].map((label) => (
          <div
            key={label}
            style={{
              display: "flex",
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.18)",
              backgroundColor: "rgba(255,255,255,0.06)",
              color: "#F2B84B",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
