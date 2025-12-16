import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'standard' | 'highlight';
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'standard', 
  className = '',
  onClick
}) => {
  const baseStyles = "rounded-2xl p-5 transition-shadow";
  
  const variants = {
    standard: "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]",
    highlight: "bg-[#EAF4F0] text-[#1C1C1C]"
  };

  return (
    <div 
      className={`${baseStyles} ${variants[variant]} ${className} ${onClick ? 'cursor-pointer active:opacity-90' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;