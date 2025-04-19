import { supabase, supabaseAdmin } from '../api/supabase/client';

/**
 * Utility function to retry a database query with exponential backoff
 * @param queryFn Function that performs the database query
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @returns Result of the query or throws an error after all retries fail
 */
export async function retryQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If not the first attempt, log retry information
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
      }

      // Execute the query
      return await queryFn();
    } catch (error) {
      console.error(`Query failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      lastError = error;

      // If this was the last attempt, don't delay, just throw
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before the next retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw lastError;
}

/**
 * Utility function to try a query with the regular client first, then fall back to admin client if needed
 * @param tableName The table to query
 * @param queryBuilder Function that builds the query using the provided client
 * @returns Result of the query or throws an error if both clients fail
 */
export async function tryWithFallback<T>(
  tableName: string,
  queryBuilder: (client: typeof supabase) => Promise<{ data: T | null; error: any }>
): Promise<T> {
  console.log(`Attempting query on ${tableName} with regular client`);
  
  try {
    // First try with regular client
    const { data, error } = await queryBuilder(supabase);
    
    if (error) {
      console.error(`Regular client query error on ${tableName}:`, error);
      console.log(`Falling back to admin client for ${tableName}`);
      
      // Try with admin client if regular client fails
      const adminResult = await queryBuilder(supabaseAdmin);
      
      if (adminResult.error) {
        console.error(`Admin client query error on ${tableName}:`, adminResult.error);
        throw adminResult.error;
      }
      
      console.log(`Admin client query on ${tableName} succeeded`);
      return adminResult.data as T;
    }
    
    return data as T;
  } catch (error) {
    console.error(`Error in tryWithFallback for ${tableName}:`, error);
    throw error;
  }
}

/**
 * Utility function to check if a table exists in the database
 * @param tableName The table to check
 * @returns True if the table exists, false otherwise
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    // Try to get a single row from the table with a limit
    const { error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(1);
    
    // If there's no error, the table exists
    return !error;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Utility function to get a user's transactions with retry and fallback mechanisms
 * @param userId The user ID to get transactions for
 * @returns Array of transactions or empty array if none found
 */
export async function getUserTransactions(userId: string) {
  try {
    return await retryQuery(async () => {
      const result = await tryWithFallback('transactions', (client) => 
        client
          .from('transactions')
          .select('amount, type, date')
          .eq('user_id', userId)
      );
      
      return result || [];
    });
  } catch (error) {
    console.error('Failed to get user transactions after retries:', error);
    return [];
  }
}
