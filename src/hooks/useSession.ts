import { useEffect, useState } from "react";
import type { Session } from "@/types/session";

export function useSession(id: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((data) => { setSession(data); setLoading(false); });
  }, [id]);

  return { session, loading };
}
