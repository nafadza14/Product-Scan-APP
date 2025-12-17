import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Clock, ChevronLeft, Share2, Bookmark, ExternalLink } from 'lucide-react';
import { UserProfile, Article } from '../types';
import Card from './Card';
import { getDailyFeed, getDeterministicImage } from '../services/articleService';

interface ExploreViewProps {
  userProfile: UserProfile | null;
}

// Fallback image if source fails
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1499209974431-2761e2523676?auto=format&fit=crop&w=800&q=80";

const ExploreView: React.FC<ExploreViewProps> = ({ userProfile }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    // Fetch instant static data
    const feed = getDailyFeed(userProfile);
    setArticles(feed);
  }, [userProfile]);

  const displayCondition = userProfile?.customConditionName || userProfile?.condition || "General Health";

  // Handle Image Error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      e.currentTarget.src = FALLBACK_IMAGE;
  };

  // --- FULL ARTICLE RENDERER ---
  if (selectedArticle) {
    const heroImage = getDeterministicImage(selectedArticle);
    
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom-10 flex flex-col no-scrollbar">
        {/* Hero Image */}
        <div className="relative h-72 sm:h-80 w-full flex-shrink-0 bg-gray-100">
          <img 
            src={heroImage} 
            alt={selectedArticle.title} 
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent"></div>
          
          {/* Navigation Bar */}
          <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex justify-between items-center text-white">
            <button 
              onClick={() => setSelectedArticle(null)}
              className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex gap-3">
              <button className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors">
                <Bookmark size={20} />
              </button>
              <button 
                 onClick={() => {
                     if (navigator.share) {
                         navigator.share({
                             title: selectedArticle.title,
                             url: window.location.href
                         }).catch(console.error);
                     }
                 }}
                 className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/90 to-transparent">
             <span className="inline-block px-3 py-1 bg-[#6FAE9A] text-white text-xs font-bold rounded-md mb-3 shadow-md uppercase tracking-wider">
               {selectedArticle.category}
             </span>
             <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] leading-tight shadow-sm">
                {selectedArticle.title}
             </h1>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 pb-32 max-w-2xl mx-auto w-full">
          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-8 border-b border-gray-100 pb-4">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#6FAE9A] overflow-hidden flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    VS
                </div>
                <span className="font-bold text-gray-700">{selectedArticle.source}</span>
             </div>
             <div className="flex items-center gap-3">
                <span>{selectedArticle.date}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="flex items-center gap-1"><Clock size={12} /> {selectedArticle.readTime}</span>
             </div>
          </div>

          {/* Text Content - Long Form Generated */}
          <div className="prose prose-lg prose-green mx-auto">
             {selectedArticle.content.map((paragraph, index) => (
               <p key={index} className="text-gray-700 leading-relaxed mb-6 font-medium text-lg text-justify">
                 {paragraph}
               </p>
             ))}
          </div>
          
          {/* External Link - Only if sourceUrl is valid and not empty */}
          {selectedArticle.sourceUrl && selectedArticle.sourceUrl !== "#" && selectedArticle.sourceUrl !== "" && (
            <div className="mt-8 mb-4">
                <a 
                    href={selectedArticle.sourceUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-gray-100 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                >
                    Read Original Source <ExternalLink size={16} />
                </a>
            </div>
          )}
          
          <div className="mt-8 mb-12 p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
             <p className="text-gray-500 font-medium mb-4">Enjoyed this article?</p>
             <div className="flex justify-center gap-4">
                 <button className="px-6 py-3 bg-white border border-gray-200 rounded-full font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">Save for Later</button>
                 <button className="px-6 py-3 bg-[#6FAE9A] text-white rounded-full font-bold shadow-lg shadow-[#6FAE9A]/30 hover:bg-[#5D9A88] transition-colors">Share</button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN FEED RENDERER (INSTANT) ---
  return (
    <div className="p-6 pt-12 animate-in fade-in duration-500 pb-32">
        {/* Header */}
        <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-[#1C1C1C] tracking-tight">Explore</h2>
            <div className="flex justify-between items-end">
                <p className="text-gray-500 font-medium mt-1">Daily insights for <span className="text-[#6FAE9A] font-bold">{displayCondition}</span></p>
                <span className="text-[10px] font-bold text-gray-300 uppercase bg-gray-50 px-2 py-1 rounded-md border border-gray-100">Updated Today</span>
            </div>
        </div>

        <div className="space-y-8">
          
          {/* Trending / Hero Section (First Article) */}
          {articles.length > 0 && (
            <div 
              onClick={() => setSelectedArticle(articles[0])}
              className="relative group cursor-pointer transform hover:scale-[1.01] transition-transform duration-300"
            >
               {/* Glowing effect behind card */}
               <div className="absolute inset-0 bg-[#6FAE9A] rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
               
               <div className="relative h-80 rounded-3xl overflow-hidden shadow-2xl bg-gray-200">
                  <img 
                    src={getDeterministicImage(articles[0])} 
                    alt="Trending" 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={handleImageError}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                      <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-lg">
                            <Sparkles size={16} className="text-yellow-300 fill-yellow-300" />
                      </div>
                      <span className="text-xs font-bold text-white bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg tracking-widest uppercase border border-white/10">Top Story</span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="font-bold text-2xl mb-3 leading-tight drop-shadow-md line-clamp-2">{articles[0].title}</h3>
                      <p className="text-sm opacity-90 mb-4 font-medium leading-relaxed line-clamp-2 text-gray-200">{articles[0].summary}</p>
                      <button className="text-xs font-bold bg-white text-[#1C1C1C] px-5 py-3 rounded-xl shadow-lg hover:bg-gray-100 transition-colors">Read Full Article</button>
                  </div>
               </div>
            </div>
          )}

          {/* Latest Articles List */}
          {articles.length > 1 ? (
              <div>
                <div className="flex items-center gap-2 mb-4 px-2">
                    <BookOpen size={20} className="text-[#6FAE9A]" />
                    <h3 className="font-bold text-lg text-[#1C1C1C]">Today's Reads</h3>
                </div>
                
                <div className="space-y-4">
                    {articles.slice(1).map((article, idx) => (
                    <Card 
                        key={article.id} 
                        variant="standard" 
                        onClick={() => setSelectedArticle(article)}
                        className="flex gap-4 items-stretch p-3 hover:shadow-xl hover:border-[#6FAE9A]/30 group transition-all duration-300 !rounded-2xl cursor-pointer"
                    >
                        <div className="w-28 h-28 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 relative shadow-inner">
                            <img 
                                src={getDeterministicImage(article)} 
                                alt="" 
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                onError={handleImageError}
                                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700" 
                            />
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <div className="flex-1 py-1 flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-[#6FAE9A] uppercase tracking-wider bg-[#6FAE9A]/10 px-2 py-0.5 rounded-md inline-block mb-2">{article.category}</span>
                                <h4 className="font-bold text-base text-gray-800 leading-snug group-hover:text-[#6FAE9A] transition-colors line-clamp-2">{article.title}</h4>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400 font-medium mt-2">
                                <span className="flex items-center gap-1"><Clock size={10} /> {article.readTime}</span>
                                <span className="font-bold text-gray-300">{article.source}</span>
                            </div>
                        </div>
                    </Card>
                    ))}
                </div>
            </div>
          ) : articles.length === 0 && (
              <div className="text-center py-10 opacity-50">
                  <p>No articles available for this condition.</p>
              </div>
          )}

        </div>
    </div>
  );
};

export default ExploreView;