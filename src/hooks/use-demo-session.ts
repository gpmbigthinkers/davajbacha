"use client";

import { useEffect, useState } from "react";

export function useDemoSession(presentationMode = false) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function createSession() {
      try {
        const response = await fetch("/api/demo/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ presentationMode }),
        });
        const data = (await response.json()) as { sessionToken?: string };

        if (active && data.sessionToken) {
          setSessionToken(data.sessionToken);
        }
      } catch {
        if (active) {
          setSessionToken(crypto.randomUUID());
        }
      }
    }

    createSession();

    return () => {
      active = false;
    };
  }, [presentationMode]);

  return sessionToken;
}
