import { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      // prevents crypto app crash
    }
  }, []);

  return (
    <>
      {/* Cc */}
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-4928876343257599"
        data-ad-slot="8327013930"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </>
  );
}
