import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import Card from './Card';
import { UserProfile, HealthCondition } from '../types';

interface ExploreModalProps {
  onClose: () => void;
  userProfile: UserProfile | null;
}

const ExploreModal: React.FC<ExploreModalProps> = ({ onClose, userProfile }) => {
  
  // Mock articles based on condition
  const getArticles = () => {
    const baseArticles = [
      {
        title: "Understanding E-Numbers in Your Food",
        category: "General Knowledge",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        readTime: "5 min"
      }
    ];

    if (userProfile?.condition === HealthCondition.PREGNANCY) {
      return [
        {
          title: "Safe Skincare Ingredients During Pregnancy",
          category: "Maternal Health",
          image: "https://images.unsplash.com/photo-1555820585-c5ae44394b79?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          readTime: "3 min"
        },
        ...baseArticles
      ];
    } else if (userProfile?.condition === HealthCondition.GENERAL_HEALTH) {
      return [
        {
          title: "The Truth About 'Natural' Flavors",
          category: "Wellness",
          image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          readTime: "4 min"
        },
        ...baseArticles
      ];
    }
    
    return [
       {
          title: "Navigating Allergens in Processed Foods",
          category: "Safety",
          image: "https://images.unsplash.com/photo-1580913428023-02c695666d61?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          readTime: "6 min"
       },
       ...baseArticles
    ];
  };

  const articles = getArticles();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 pointer-events-auto transition-opacity" onClick={onClose}></div>
      
      <div className="bg-[#F8F9FA] w-full sm:w-[400px] h-[85vh] sm:rounded-3xl rounded-t-3xl overflow-hidden pointer-events-auto transform transition-transform duration-300 ease-out shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1C1C1C]">Explore</h2>
            <p className="text-sm text-gray-500">Curated for {userProfile?.condition}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="bg-[#6FAE9A] p-5 rounded-2xl text-white relative overflow-hidden">
             <div className="relative z-10">
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-md mb-2 inline-block">TRENDING</span>
                <h3 className="font-bold text-xl mb-1">Hidden Sugar in "Healthy" Snacks</h3>
                <p className="text-sm opacity-90 mb-3">Why your protein bar might be a candy bar in disguise.</p>
                <button className="text-xs font-bold bg-white text-[#6FAE9A] px-3 py-2 rounded-lg">Read Now</button>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          </div>

          <div>
             <h3 className="font-bold text-lg mb-4 text-[#1C1C1C]">Latest Articles</h3>
             <div className="space-y-4">
                {articles.map((article, idx) => (
                   <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm flex gap-4 items-center">
                      <div className="w-20 h-20 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                         <img src={article.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                         <span className="text-[10px] font-bold text-[#6FAE9A] uppercase">{article.category}</span>
                         <h4 className="font-bold text-sm text-gray-800 leading-tight mb-1">{article.title}</h4>
                         <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{article.readTime} read</span>
                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                            <span className="flex items-center gap-1">Read <ExternalLink size={10} /></span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExploreModal;