const CustomButton = ({ onClick, children, variant = "primary" }) => {
    const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors";
    const variants = {
      primary: "bg-blue-500 text-white hover:bg-blue-600",
      secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };
  
    return (
      <button
        onClick={onClick}
        className={`${baseStyles} ${variants[variant]}`}
      >
        {children}
      </button>
    );
  };