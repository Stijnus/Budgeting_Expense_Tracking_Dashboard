import {
  listUsers,
  deleteUser,
  getUserByEmail,
} from "../src/utils/admin-tools";

async function main() {
  const command = process.argv[2];
  const param = process.argv[3];
  let users;
  let user;

  switch (command) {
    case "list":
      users = await listUsers();
      console.log("Users:", users);
      break;

    case "delete":
      if (!param) {
        console.error("Please provide a user ID");
        process.exit(1);
      }
      await deleteUser(param);
      console.log("User deleted successfully");
      break;

    case "find":
      if (!param) {
        console.error("Please provide an email address");
        process.exit(1);
      }
      user = await getUserByEmail(param);
      console.log("User:", user);
      break;

    default:
      console.log("Available commands:");
      console.log("- list: List all users");
      console.log("- delete <userId>: Delete a user");
      console.log("- find <email>: Find a user by email");
      break;
  }
}

main().catch(console.error);
