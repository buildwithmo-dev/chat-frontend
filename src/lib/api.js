import axios from "axios";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const { data, error } = await supabase.auth.getSession();
  if (!error && data?.session?.access_token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);

export default api;
