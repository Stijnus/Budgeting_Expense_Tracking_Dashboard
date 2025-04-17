// Allow requests from the specific VITE preview URL and local development environments
// IMPORTANT: Adjust the origin list for your production deployment
const allowedOrigins = [
    'http://localhost:5173', // Default Vite dev port
    'http://localhost:4173', // Default Vite preview port
    // Add your deployed frontend URL here, e.g., 'https://your-app.vercel.app'
    // Add the WebContainer preview URL if needed (it changes)
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or restrict to allowedOrigins.join(',')
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS
};
