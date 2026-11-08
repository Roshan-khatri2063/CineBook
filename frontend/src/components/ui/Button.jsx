const VARIANTS = {
  primary: "bg-red-800 text-white hover:bg-red-900",
  secondary: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "text-stone-700 hover:bg-stone-100",
};

export default function Button({ variant = "primary", size = "md", className = "", type = "button", ...props }) {
  const sizes = size === "sm" ? "px-2.5 py-1 text-sm" : "px-4 py-2";
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
