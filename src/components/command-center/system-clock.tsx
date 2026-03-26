"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function SystemClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return (
      <span className="font-mono text-xs tracking-wide text-[var(--cc-muted)]">SYS TIME — UTC</span>
    );
  }

  const utc = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const dateStr = `${pad(now.getUTCDate())} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  return (
    <div className="font-mono text-[11px] tracking-wide text-[var(--cc-muted)]">
      <span className="text-[var(--cc-cyan)]">SYS TIME</span> {utc} UTC{" "}
      <span className="text-slate-600">_</span>{" "}
      <span className="text-[var(--cc-cyan)]">DATE</span> {dateStr}
    </div>
  );
}
