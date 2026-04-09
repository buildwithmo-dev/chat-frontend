import axios from "axios";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// -----------------------------
// TOKEN CACHE (CRITICAL FIX)
// -----------------------------
let cachedToken = null;
let tokenExpiry = null;

// -----------------------------
// SAFE TOKEN FETCH
// -----------------------------
const getToken = async () => {
  const now = Date.now();

  // use cached token if still valid (5 min buffer)
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (!session?.access_token) return null;

  cachedToken = session.access_token;
  tokenExpiry = now + 50 * 60 * 1000; // assume ~1h token validity

  return cachedToken;
};

// -----------------------------
// REQUEST INTERCEPTOR
// -----------------------------
api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Auth token error:", error);
  }

  return config;
});

export default api;