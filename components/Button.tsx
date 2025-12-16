import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "h-14 px-6 rounded-2xl font-medium transition-all active:scale-95 flex items-center justify-center";
  
  const variants = {
    primary: "bg-[#6FAE9A] text-white shadow-soft hover:bg-[#5D9A88]",
    secondary: "border-2 border-[#6FAE9A] text-[#6FAE9A] bg-transparent",
    ghost: "text-[#6FAE9A] bg-transparent hover:bg-gray-50"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;