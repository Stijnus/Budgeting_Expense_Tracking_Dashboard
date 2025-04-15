import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../lib/database.types'
import { Trash2, Pencil, Save, XCircle } from 'lucide-react'; // Import icons

type Category = Database['public']['Tables']['categories']['Row']

export default function Categories() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null); // Track which category is being edited
  const [editingCategoryName, setEditingCategoryName] = useState(''); // Temp storage for the edited name
  const [updating, setUpdating] = useState(false); // State for update operation

  const editInputRef = useRef<HTMLInputElement>(null); // Ref for focusing the edit input

  useEffect(() => {
    fetchCategories()
  }, [])

  // Focus input when edit mode starts
  useEffect(() => {
    if (editingCategoryId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select(); // Select text for easy replacement
    }
  }, [editingCategoryId]);

  const fetchCategories = async () => {
    setError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session?.user) throw new Error('User not logged in')

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setCategories(data)

    } catch (error: any) {
      console.error('Error fetching categories:', error)
      setError(`Failed to load categories: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newCategoryName.trim()) {
      setError("Category name cannot be empty.")
      return
    }
    setAdding(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw userError || new Error('User not found')

      const { data, error } = await supabase
        .from('categories')
        .insert({ name: newCategoryName.trim(), user_id: user.id })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Category "${newCategoryName.trim()}" already exists.`)
        }
        throw error
      }

      if (data) {
        setCategories([data, ...categories])
        setNewCategoryName('')
      }
    } catch (error: any) {
      console.error('Error adding category:', error)
      setError(`Failed to add category: ${error.message}`)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Expenses using it will become uncategorized.')) {
      return;
    }
    setDeletingId(categoryId);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      if (deleteError) throw deleteError;
      await fetchCategories(); // Refetch after delete
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setError(`Failed to delete category: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setError(null); // Clear previous errors
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
    setError(null);
  };

  const handleUpdateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCategoryName.trim()) {
      setError("Category name cannot be empty.");
      return;
    }
    if (!editingCategoryId) return; // Should not happen

    const originalCategory = categories.find(cat => cat.id === editingCategoryId);
    if (originalCategory?.name === editingCategoryName.trim()) {
      // No change, just exit edit mode
      handleCancelEdit();
      return;
    }


    setUpdating(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editingCategoryName.trim() })
        .eq('id', editingCategoryId);

      if (error) {
         if (error.code === '23505') { // Handle unique constraint violation
          throw new Error(`Category "${editingCategoryName.trim()}" already exists.`)
        }
        throw error;
      }

      // Update local state for immediate feedback
      setCategories(categories.map(cat =>
        cat.id === editingCategoryId ? { ...cat, name: editingCategoryName.trim() } : cat
      ));
      handleCancelEdit(); // Exit edit mode

    } catch (error: any) {
      console.error('Error updating category:', error);
      setError(`Failed to update category: ${error.message}`);
      // Optionally revert local state or refetch on error
      // fetchCategories();
    } finally {
      setUpdating(false);
    }
  };


  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Spending Categories</h2>

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="mb-6 flex space-x-2">
        <input
          type="text"
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          disabled={adding || loading || !!editingCategoryId} // Disable if editing another category
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
          maxLength={100}
        />
        <button
          type="submit"
          disabled={adding || loading || !newCategoryName.trim() || !!editingCategoryId}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {adding ? 'Adding...' : 'Add'}
        </button>
      </form>

      {/* Error Display */}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Category List */}
      {loading ? (
        <p className="text-gray-500">Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500">No categories found. Add one above!</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className={`p-3 bg-gray-50 rounded-md border border-gray-200 flex justify-between items-center transition-opacity duration-300 ${deletingId === category.id || updating && editingCategoryId === category.id ? 'opacity-50' : ''}`}
            >
              {editingCategoryId === category.id ? (
                // Edit Mode
                <form onSubmit={handleUpdateCategory} className="flex-grow flex items-center space-x-2">
                   <input
                      ref={editInputRef}
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      disabled={updating}
                      className="flex-grow px-2 py-1 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      maxLength={100}
                    />
                    <button
                      type="submit"
                      disabled={updating || !editingCategoryName.trim()}
                      className="p-1 text-green-600 hover:text-green-800 rounded hover:bg-green-100 disabled:opacity-50"
                      title="Save Changes"
                    >
                      {updating ? <span className="text-xs">...</span> : <Save size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={updating}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                      title="Cancel Edit"
                    >
                      <XCircle size={16} />
                    </button>
                </form>
              ) : (
                // View Mode
                <>
                  <span className="text-gray-700">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {new Date(category.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleEditClick(category)}
                      disabled={deletingId === category.id || !!editingCategoryId} // Disable if deleting this or editing another
                      className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit Category"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={deletingId === category.id || !!editingCategoryId} // Disable if deleting this or editing another
                      className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Category"
                    >
                       {deletingId === category.id ? (
                         <span className="text-xs">...</span>
                       ) : (
                         <Trash2 size={14} />
                       )}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
