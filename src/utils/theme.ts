export const applyTheme = (theme: "light" | "dark") => {
  const root = window.document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
    // Add dark mode specific styles
    document.body.style.backgroundColor = "#1a1a1a";
    document.body.style.color = "#ffffff";
  } else {
    root.classList.remove("dark");
    // Reset to light mode styles
    document.body.style.backgroundColor = "";
    document.body.style.color = "";
  }
};
