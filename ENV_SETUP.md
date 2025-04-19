# Environment Setup Guide

This document explains how to set up the environment variables for the Budget Tracker application.

## Environment Files

The application uses different environment files for different deployment environments:

- `.env.development` - Used for local development
- `.env.production` - Used for production deployment
- `.env` - Default fallback

## Required Environment Variables

### Client-Side Variables (Exposed to Browser)

These variables are prefixed with `VITE_` and are accessible in the client-side code:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Server-Side Variables (Not Exposed to Browser)

These variables are not prefixed with `VITE_` and should only be used in server-side code:

```
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Temporary Backward Compatibility

During the transition period, we're maintaining both formats of the service role key:

```
# New format (preferred)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Old format (for backward compatibility)
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The old format with the `VITE_` prefix will be removed in a future update once all code has been updated to use the new format.

## Security Considerations

1. **Never expose the service role key to client-side code**

   - The service role key has admin privileges and should only be used in secure server-side environments
   - Do not prefix it with `VITE_` as this would expose it to the client

2. **Use environment-specific files**

   - Use `.env.development` for local development
   - Use `.env.production` for production deployment
   - Consider using different Supabase projects or keys for different environments

3. **Key Rotation**
   - Periodically rotate your keys, especially the service role key, for better security

## Setting Up for Development

1. Copy `.env.example` to `.env.development`
2. Fill in your Supabase URL and keys
3. Run the application with `npm run dev`

## Setting Up for Production

1. Copy `.env.example` to `.env.production`
2. Fill in your production Supabase URL and keys
3. Build the application with `npm run build`

## Troubleshooting

If you encounter issues with environment variables:

1. Make sure the variables are defined in the correct file
2. Check that the variable names match exactly what's expected in the code
3. Restart the development server after changing environment variables
