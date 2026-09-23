export const thStyle = {
  textAlign: "left",
  padding: "14px 12px",
  borderBottom: "2px solid #D4AF57",
  fontSize: 13,
  color: "#F2DE95",
  textTransform: "uppercase",
  letterSpacing: "1px",
  background: "#0E1B16"
};

export const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid rgba(212,175,87,0.15)",
  color: "#E7D8B8",
  background: "#13231D"
};

export const menuBtn = {
  width: "100%",
  padding: "12px 14px",
  textAlign: "left",
  background: "#13231D",
  color: "#E7D8B8",
  border: "1px solid #3B2A18",
  borderRadius: 10,
  cursor: "pointer",
  transition: "all .2s ease",
  fontWeight: 500,
  boxShadow: "inset 0 0 0 1px rgba(212,175,87,0.08)"
};

export const activeMenuBtn = {
  ...menuBtn,
  background:
    "linear-gradient(135deg, #D4AF57 0%, #F2DE95 100%)",
  color: "#111",
  border: "1px solid #F2DE95",
  fontWeight: 700,
  boxShadow:
    "0 0 16px rgba(212,175,87,.35)"
};