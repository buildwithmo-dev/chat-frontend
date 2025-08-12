"use client";

import { useState, useEffect } from "react";

export default function SplashWrapper({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center vh-100 bg-primary text-white"
      >
        My App Logo / Cover
      </div>
    );
  }

  return children;
}
