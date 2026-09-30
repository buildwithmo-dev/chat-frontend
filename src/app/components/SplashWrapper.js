"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashWrapper({ children }) {
  // Show the splash once per browser session, and briefly.
  const [loading, setLoading] = useState(() =>
    typeof window === "undefined" ? true : !sessionStorage.getItem("splash_seen")
  );

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      sessionStorage.setItem("splash_seen", "1");
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white z-50"
          >
            <div className="text-3xl font-bold tracking-wide">MyApp</div>
            <p className="mt-2 text-sm text-blue-100">Connecting conversations</p>
          </motion.div>
        )}
      </AnimatePresence>
      {!loading && children}
    </>
  );
}
