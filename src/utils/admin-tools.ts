import { supabaseAdmin } from "../../scripts/supabase-admin";

export async function listUsers() {
  try {
    const {
      data: { users },
      error,
    } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    return users;
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const {
      data: { users },
      error,
    } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    return users.find((user) => user.email === email);
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}
