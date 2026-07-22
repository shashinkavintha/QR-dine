"use client";

import CookieConsent from "react-cookie-consent";

export default function CookieBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept All"
      declineButtonText="Decline"
      enableDeclineButton
      cookieName="cookieConsent"
      style={{ background: "#2B373B", zIndex: 9999 }}
      buttonStyle={{ background: "#f97316", color: "white", fontSize: "14px", borderRadius: "6px", fontWeight: "bold" }}
      declineButtonStyle={{ background: "transparent", color: "#d1d5db", fontSize: "14px", textDecoration: "underline" }}
      expires={150}
      onAccept={() => {
        if (typeof window !== "undefined") {
          localStorage.setItem("cookieConsent", "true");
        }
      }}
      onDecline={() => {
        if (typeof window !== "undefined") {
          localStorage.setItem("cookieConsent", "false");
        }
      }}
    >
      We use cookies to improve your experience. By continuing to visit this site you agree to our use of cookies.
    </CookieConsent>
  );
}
