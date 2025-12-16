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
  const baseStyles = "h-14 px-8 rounded-full font-bold transition-all active:scale-95 flex items-center justify-center tracking-wide";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#6FAE9A] to-[#5D9A88] text-white shadow-[0_10px_20px_rgba(111,174,154,0.3)] hover:shadow-[0_15px_25px_rgba(111,174,154,0.4)] hover:translate-y-[-1px]",
    secondary: "bg-white/80 backdrop-blur-sm border-2 border-[#6FAE9A]/20 text-[#6FAE9A] hover:bg-white",
    ghost: "text-[#6FAE9A] bg-transparent hover:bg-[#6FAE9A]/10"
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