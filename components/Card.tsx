import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'standard' | 'highlight' | 'glass';
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'standard', 
  className = '',
  onClick
}) => {
  const baseStyles = "rounded-3xl p-6 transition-all duration-300 relative overflow-hidden";
  
  const variants = {
    // Subtle white-to-gray gradient for standard cards
    standard: "bg-gradient-to-b from-white to-[#F9FAFB] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/60 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)]",
    // Highlight uses the brand green gradient
    highlight: "bg-gradient-to-br from-[#F0FDF9] via-white to-[#E6F4F1] border border-[#6FAE9A]/20 shadow-[0_8px_30px_rgba(111,174,154,0.15)]",
    glass: "glass-card bg-white/60"
  };

  return (
    <div 
      className={`${baseStyles} ${variants[variant]} ${className} ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;