const config = {};

config["SUPABASE_API_KEY"] = import.meta.env.VITE_SUPABASE_API_KEY;
config["SUPABASE_URL_LC_CHATBOT"] =
  import.meta.env.VITE_SUPABASE_URL_LC_CHATBOT;
config["OPENAI_API_KEY"] = import.meta.env.VITE_OPENAI_API_KEY;

export default config;
