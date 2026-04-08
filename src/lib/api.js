import axios from "axios";
import { createClient } from "@/utils/supabase/client"; // 1. Import your client creator

const supabase = createClient(); // 2. Initialize it here

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// 3. Add the interceptor to attach the token
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error("Auth session error:", error);
  }
  return config;
});

export default api;