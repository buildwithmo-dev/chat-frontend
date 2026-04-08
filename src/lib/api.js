import axios from "axios";

const api = axios.create({
  // Ensure the environment variable in Vercel starts with https://
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add this interceptor to automatically attach your Supabase Token
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default api;