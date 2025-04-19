import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../api/supabase/client";
import type { Database } from "../../../api/types/database.types";
import { retryQuery, tryWithFallback } from "../../../utils/db-helpers";
import { Loader2, CheckCircle, AlertTriangle, Tag } from "lucide-react"; // Import icons

type Category = Database["public"]["Tables"]["categories"]["Row"];
type TagType = Database["public"]["Tables"]["tags"]["Row"]; // Use TagType alias
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

interface ExpenseFormProps {
  onExpenseAdded: () => void; // Callback to notify parent when an expense is added
}

// Helper function to handle tag creation and linking
async function handleTags(
  userId: string,
  expenseId: string,
  tagString: string
): Promise<string[]> {
  const tagNames = tagString
    .split(",")
    .map((tag) => tag.trim().toLowerCase()) // Normalize: trim whitespace, convert to lowercase
    .filter((tag) => tag.length > 0 && tag.length <= 50) // Filter empty tags and enforce max length
    .slice(0, 10); // Limit number of tags per expense

  if (tagNames.length === 0) return []; // No tags to process

  const uniqueTagNames = [...new Set(tagNames)]; // Ensure unique tags
  const errors: string[] = [];

  // 1. Find existing tags or create new ones
  const tagPromises = uniqueTagNames.map(
    async (name): Promise<TagType | null> => {
      try {
        // Use retryQuery to handle potential network issues
        return await retryQuery(async () => {
          // Check if tag exists for the user (case-insensitive)
          const existingTagResult = await tryWithFallback("tags", (client) =>
            client
              .from("tags")
              .select("id, name, user_id, created_at") // Select all columns needed for TagType
              .eq("user_id", userId)
              .ilike("name", name) // Case-insensitive search
              .maybeSingle()
          );

          if (existingTagResult) {
            return existingTagResult;
          } else {
            // Create new tag if it doesn't exist
            try {
              const newTagResult = await tryWithFallback("tags", (client) =>
                client
                  .from("tags")
                  .insert({ user_id: userId, name: name })
                  .select("id, name, user_id, created_at") // Select all columns
                  .single()
              );

              return newTagResult;
            } catch (createError: any) {
              // Handle potential unique constraint violation if another process created it concurrently
              if (createError.code === "23505") {
                // Try fetching again just in case it was created concurrently
                const retryTagResult = await tryWithFallback("tags", (client) =>
                  client
                    .from("tags")
                    .select("id, name, user_id, created_at")
                    .eq("user_id", userId)
                    .ilike("name", name)
                    .maybeSingle()
                );

                if (retryTagResult) return retryTagResult;

                errors.push(
                  `Failed to create or find tag "${name}" after conflict.`
                );
                return null;
              } else {
                errors.push(
                  `Error creating tag "${name}": ${createError.message}`
                );
                return null;
              }
            }
          }
        }, 2); // Only retry twice for tags to avoid too many retries
      } catch (error: any) {
        errors.push(`Error processing tag "${name}": ${error.message}`);
        return null;
      }
    }
  );

  const resolvedTags = (await Promise.all(tagPromises)).filter(
    (tag): tag is TagType => tag !== null
  ); // Filter out nulls from errors

  // 2. Link tags to the expense
  if (resolvedTags.length > 0) {
    try {
      const links = resolvedTags.map((tag) => ({
        transaction_id: expenseId,
        tag_id: tag.id,
      }));

      await tryWithFallback("transaction_tags", (client) =>
        client.from("transaction_tags").insert(links)
      );
    } catch (linkError: any) {
      // Ignore primary key violations (tag already linked), log others
      if (linkError.code !== "23505") {
        errors.push(`Error linking tags: ${linkError.message}`);
      }
    }
  }

  return errors; // Return array of error messages, if any
}

export default function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tags, setTags] = useState(""); // State for comma-separated tags
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fetchingCategories, setFetchingCategories] = useState(true);

  const descriptionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      setFetchingCategories(true);
      setError(null);
      try {
        // Use retryQuery to get the current user with retries
        const user = await retryQuery(async () => {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError || !user)
            throw userError || new Error("User not logged in");
          return user;
        });

        // Use tryWithFallback to attempt the query with regular client first, then admin if needed
        const categoriesData = await tryWithFallback("categories", (client) =>
          client
            .from("categories")
            .select("id, name")
            .eq("user_id", user.id)
            .order("name", { ascending: true })
        );

        if (isMounted) {
          setCategories(categoriesData || []);
        }
      } catch (error: any) {
        console.error("Error fetching categories for form:", error);
        if (isMounted) {
          setError("Could not load categories. Please try refreshing.");
        }
      } finally {
        if (isMounted) {
          setFetchingCategories(false);
        }
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    if (!expenseDate) {
      setError("Please select a date.");
      return;
    }

    setLoading(true);
    let newExpenseId: string | null = null;

    try {
      // Use retryQuery to get the current user with retries
      const user = await retryQuery(async () => {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw userError || new Error("User not found");
        return user;
      });

      // 1. Insert Expense as a transaction
      const transactionData: TransactionInsert = {
        user_id: user.id,
        amount: parseFloat(amount),
        description: description.trim() || null,
        date: expenseDate,
        category_id: selectedCategoryId || null,
        type: "EXPENSE",
        currency: "USD", // Default currency
      };

      // Use tryWithFallback to attempt the insert with regular client first, then admin if needed
      const newExpense = await tryWithFallback(
        "transactions",
        async (client) => {
          return await client
            .from("transactions")
            .insert(transactionData)
            .select("id") // Select only the ID
            .single(); // Expect a single row back
        }
      );

      if (!newExpense?.id) throw new Error("Failed to get new expense ID.");
      newExpenseId = newExpense.id;

      // 2. Handle Tags
      const tagErrors = await handleTags(user.id, newExpenseId, tags);
      if (tagErrors.length > 0) {
        // Show tag errors, but the expense was still added
        setError(
          `Expense added, but failed to process some tags: ${tagErrors.join(
            ", "
          )}`
        );
      } else {
        setSuccessMessage("Expense and tags added successfully!");
      }

      // Reset form
      setAmount("");
      setDescription("");
      setSelectedCategoryId(null);
      setTags(""); // Clear tags input
      setExpenseDate(new Date().toISOString().split("T")[0]);
      descriptionInputRef.current?.focus();

      onExpenseAdded(); // Notify parent component

      // Clear success/error message after a few seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null); // Also clear error if it was just a tag error
      }, 4000);
    } catch (error: any) {
      console.error("Error adding expense or tags:", error);
      // If expense insert failed, newExpenseId will be null
      // If tag handling failed after expense insert, newExpenseId will exist
      setError(`Failed to add expense: ${error.message}`);
      // Consider if cleanup is needed if expense was added but tags failed critically
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Add New Expense
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description, Amount, Date fields remain the same */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <input
            ref={descriptionInputRef}
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder="e.g., Coffee, Lunch"
            maxLength={200}
            disabled={loading}
          />
        </div>
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700"
          >
            Amount *
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label
            htmlFor="expenseDate"
            className="block text-sm font-medium text-gray-700"
          >
            Date *
          </label>
          <input
            type="date"
            id="expenseDate"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            required
            disabled={loading}
          />
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="category"
            value={selectedCategoryId ?? ""}
            onChange={(e) => setSelectedCategoryId(e.target.value || null)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100"
            disabled={loading || fetchingCategories}
          >
            <option value="">-- Select Category (Optional) --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fetchingCategories && (
            <p className="mt-1 text-xs text-gray-500 flex items-center">
              <Loader2 className="animate-spin h-3 w-3 mr-1" /> Loading
              categories...
            </p>
          )}
          {!fetchingCategories && categories.length === 0 && !error && (
            <p className="mt-1 text-xs text-gray-500">
              No categories found. Add some in the Categories section!
            </p>
          )}
        </div>

        {/* Tags Input */}
        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700"
          >
            Tags{" "}
            <span className="text-xs text-gray-500">(comma-separated)</span>
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="e.g., work, travel, project-alpha"
              disabled={loading}
              maxLength={200} // Limit overall input length
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Max 10 tags, 50 chars each. Lowercase, trimmed.
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle size={16} /> {error}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle size={16} /> {successMessage}
          </p>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading || fetchingCategories}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </form>
    </div>
  );
}
