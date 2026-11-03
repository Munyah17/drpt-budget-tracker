"use client";

/**
 * Root error boundary — replaces Next's default "couldn't load" screen.
 * Shows the real exception so failures are diagnosable, and offers a
 * one-tap recovery that clears local app state before reloading.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const clearAndReload = () => {
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith("drpatie-")) localStorage.removeItem(k);
      }
      sessionStorage.clear();
    } catch { /* storage may be unavailable */ }
    window.location.assign("/");
  };

  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fdf5f7",
          color: "#2b1a22",
        }}
      >
        <div style={{ maxWidth: 460, textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚠</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
            This page couldn&apos;t load
          </h1>
          <p style={{ fontSize: 14, opacity: 0.7, margin: "0 0 18px" }}>
            Reload to try again, or go back.
          </p>
          {error?.message && (
            <pre
              style={{
                fontSize: 11.5,
                textAlign: "left",
                background: "#fff",
                border: "1px solid #ecd8de",
                borderRadius: 10,
                padding: "10px 12px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 140,
                overflow: "auto",
                color: "#8a2044",
              }}
            >
              {error.message}
              {error?.digest ? `\ndigest: ${error.digest}` : ""}
            </pre>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                background: "#b03060",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
            <button
              onClick={clearAndReload}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "1px solid #d8b8c4",
                background: "#fff",
                color: "#4a2a38",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear data &amp; restart
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
