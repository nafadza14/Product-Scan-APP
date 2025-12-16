import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, BookOpen, Clock, ChevronLeft, Share2, Bookmark } from 'lucide-react';
import { UserProfile, HealthCondition } from '../types';
import Card from './Card';
import Button from './Button';

interface ExploreViewProps {
  userProfile: UserProfile | null;
}

interface Article {
  id: string;
  title: string;
  category: string;
  image: string;
  readTime: string;
  author: string;
  date: string;
  content: string[]; // Array of paragraphs
  isTrending?: boolean;
}

const ExploreView: React.FC<ExploreViewProps> = ({ userProfile }) => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  // Generate Dummy Data based on Category
  useEffect(() => {
    const condition = userProfile?.condition || HealthCondition.GENERAL_HEALTH;
    const generatedArticles = generateArticles(condition);
    setArticles(generatedArticles);
  }, [userProfile]);

  // --- MOCK DATA GENERATOR ---
  const generateArticles = (condition: HealthCondition): Article[] => {
    const commonContent = [
      "In today's fast-paced world, understanding what goes into our bodies is more important than ever. This comprehensive guide breaks down the latest research and practical tips to help you make informed decisions.",
      "Many people overlook the importance of checking labels, but small changes can lead to significant health improvements. We interviewed top nutritionists and dermatologists to bring you the facts without the fear-mongering.",
      "Whether you are shopping at a local grocery store or browsing online, keeping these key factors in mind will ensure you stay safe and healthy. Remember, your health journey is personal, and what works for others might not work for you.",
      "Conclusion: Always consult with your healthcare provider before making drastic changes to your diet or skincare routine. Stay curious, stay safe, and keep scanning!"
    ];

    const specificContent = (topic: string) => [
      `When it comes to ${topic}, there are several myths that need debunking. Let's dive deep into the science behind it.`,
      ...commonContent
    ];

    const baseArticles: Article[] = [
      {
        id: "gen-1", title: "The Hidden Dangers of E-Numbers", category: "Education", readTime: "5 min", author: "Dr. Sarah Smith", date: "Oct 12, 2023", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        content: specificContent("food additives")
      },
      {
        id: "gen-2", title: "Understanding 'Natural' Flavors", category: "Nutrition", readTime: "4 min", author: "Mark Johnson", date: "Oct 10, 2023", image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        content: specificContent("natural flavoring agents")
      },
      {
        id: "gen-3", title: "How to Read a Nutrition Label", category: "Guide", readTime: "6 min", author: "Emily Chen", date: "Oct 08, 2023", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        content: specificContent("nutrition labels")
      },
      {
        id: "gen-4", title: "The Truth About Sugar Substitutes", category: "Wellness", readTime: "5 min", author: "Dr. A. B. Cook", date: "Oct 05, 2023", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        content: specificContent("artificial sweeteners")
      },
      {
        id: "gen-5", title: "Top 5 Ingredients to Avoid", category: "Safety", readTime: "3 min", author: "VitalSense Team", date: "Oct 01, 2023", image: "https://images.unsplash.com/photo-1580913428023-02c695666d61?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        content: specificContent("harmful preservatives")
      }
    ];

    let categoryArticles: Article[] = [];

    switch (condition) {
      case HealthCondition.PREGNANCY:
        categoryArticles = [
          {
            id: "preg-1", title: "Skincare Ingredients to Avoid While Pregnant", category: "Maternal Health", readTime: "7 min", author: "Dr. Emily Rose", date: "Nov 01, 2023", isTrending: true,
            image: "https://images.unsplash.com/photo-1555820585-c5ae44394b79?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("retinoids and salicylic acid")
          },
          {
            id: "preg-2", title: "Safe Superfoods for Your Trimester", category: "Nutrition", readTime: "5 min", author: "Nutritionist Jane", date: "Oct 28, 2023",
            image: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("prenatal nutrition")
          },
          {
            id: "preg-3", title: "Managing Morning Sickness Naturally", category: "Wellness", readTime: "4 min", author: "Midwife Sarah", date: "Oct 25, 2023",
            image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("ginger and vitamin B6")
          },
          {
            id: "preg-4", title: "Caffeine Limits: What You Need to Know", category: "Diet", readTime: "3 min", author: "Dr. Lee", date: "Oct 20, 2023",
            image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("caffeine intake")
          },
          {
            id: "preg-5", title: "Postpartum Prep: Essential Checklist", category: "Planning", readTime: "6 min", author: "Mom & Co", date: "Oct 15, 2023",
            image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("hospital bags")
          }
        ];
        break;

      case HealthCondition.ALLERGIES:
        categoryArticles = [
          {
            id: "all-1", title: "Navigating Hidden Allergens in Processed Foods", category: "Safety", readTime: "6 min", author: "Allergy UK", date: "Nov 02, 2023", isTrending: true,
            image: "https://images.unsplash.com/photo-1607613009820-a29f7bb6dcaf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("cross-contamination risks")
          },
          {
            id: "all-2", title: "The Rise of Nut-Free Schools", category: "Community", readTime: "4 min", author: "Reporter Mike", date: "Oct 30, 2023",
            image: "https://images.unsplash.com/photo-1599599810769-bcde5a8158fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("school policies")
          },
          {
            id: "all-3", title: "Dining Out with Severe Allergies", category: "Lifestyle", readTime: "8 min", author: "Chef Gordon", date: "Oct 22, 2023",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("communicating with chefs")
          },
          {
            id: "all-4", title: "Soy Lethicin: Is it Safe?", category: "Deep Dive", readTime: "5 min", author: "Dr. Science", date: "Oct 18, 2023",
            image: "https://images.unsplash.com/photo-1615485925600-97237c4fc1ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("soy derivatives")
          },
          {
            id: "all-5", title: "Gluten-Free vs Wheat-Free", category: "Education", readTime: "5 min", author: "Baker Tom", date: "Oct 12, 2023",
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("celiac disease")
          }
        ];
        break;

      case HealthCondition.GENERAL_HEALTH:
      default:
        categoryArticles = [
           {
            id: "hlth-1", title: "Hidden Sugar in 'Healthy' Protein Bars", category: "Trending", readTime: "4 min", author: "FitLife Mag", date: "Nov 03, 2023", isTrending: true,
            image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("sugar alcohols and syrups")
           },
           {
            id: "hlth-2", title: "5 Habits for Better Sleep", category: "Wellness", readTime: "6 min", author: "Sleep Doctor", date: "Oct 29, 2023",
            image: "https://images.unsplash.com/photo-1541781777621-cf13028198f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("circadian rhythms")
           },
           {
            id: "hlth-3", title: "Meal Prepping 101", category: "Lifestyle", readTime: "7 min", author: "Chef Anna", date: "Oct 21, 2023",
            image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("batch cooking")
           },
           {
            id: "hlth-4", title: "The Benefits of Hydration", category: "Health", readTime: "3 min", author: "Coach Steve", date: "Oct 15, 2023",
            image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("water intake")
           },
           {
            id: "hlth-5", title: "Understanding Gut Health", category: "Science", readTime: "8 min", author: "Dr. Gut", date: "Oct 10, 2023",
            image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            content: specificContent("microbiome diversity")
           }
        ];
        break;
    }

    return [...categoryArticles, ...baseArticles];
  };

  const displayCondition = userProfile?.customConditionName || userProfile?.condition || "You";

  // --- FULL ARTICLE RENDERER ---
  if (selectedArticle) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom-10 flex flex-col no-scrollbar">
        {/* Hero Image */}
        <div className="relative h-72 sm:h-80 w-full flex-shrink-0">
          <img 
            src={selectedArticle.image} 
            alt={selectedArticle.title} 
            className="w-full h-full object-cover"
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
              <button className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/80 to-transparent">
             <span className="inline-block px-3 py-1 bg-[#6FAE9A] text-white text-xs font-bold rounded-md mb-3 shadow-md uppercase tracking-wider">
               {selectedArticle.category}
             </span>
             <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1C] leading-tight shadow-sm">
                {selectedArticle.title}
             </h1>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 pb-32 max-w-2xl mx-auto">
          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-400 mb-8 border-b border-gray-100 pb-4">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                  <img src={`https://ui-avatars.com/api/?name=${selectedArticle.author}&background=random`} alt="Author" />
                </div>
                <span className="font-semibold text-gray-700">{selectedArticle.author}</span>
             </div>
             <div className="flex items-center gap-3">
                <span>{selectedArticle.date}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="flex items-center gap-1"><Clock size={12} /> {selectedArticle.readTime}</span>
             </div>
          </div>

          {/* Text Content */}
          <div className="prose prose-lg prose-green mx-auto">
             {selectedArticle.content.map((paragraph, index) => (
               <p key={index} className="text-gray-700 leading-relaxed mb-6 font-medium text-lg">
                 {paragraph}
               </p>
             ))}
          </div>

          <div className="mt-12 p-6 bg-[#F0FDF9] rounded-2xl border border-[#6FAE9A]/20">
             <h4 className="font-bold text-[#6FAE9A] mb-2">Disclaimer</h4>
             <p className="text-xs text-gray-500 leading-relaxed">
               This content is for informational purposes only and does not constitute medical advice. Always consult with your healthcare provider before making decisions about your health.
             </p>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN FEED RENDERER ---
  return (
    <div className="p-6 pt-12 animate-in fade-in duration-500 pb-32">
        {/* Header */}
        <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-[#1C1C1C] tracking-tight">Explore</h2>
            <p className="text-gray-500 font-medium mt-1">Curated insights for <span className="text-[#6FAE9A] font-bold">{displayCondition}</span></p>
        </div>

        <div className="space-y-8">
          
          {/* Trending / Hero Section */}
          {articles.length > 0 && (
            <div 
              onClick={() => setSelectedArticle(articles[0])}
              className="relative group cursor-pointer transform hover:scale-[1.01] transition-transform duration-300"
            >
               {/* Glowing effect behind card */}
               <div className="absolute inset-0 bg-[#6FAE9A] rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
               
               <div className="relative h-80 rounded-3xl overflow-hidden shadow-2xl">
                  <img src={articles[0].image} alt="Trending" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                      <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-lg">
                            <Sparkles size={16} className="text-yellow-300 fill-yellow-300" />
                      </div>
                      <span className="text-xs font-bold text-white bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg tracking-widest uppercase border border-white/10">Trending Now</span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="font-bold text-2xl mb-3 leading-tight drop-shadow-md">{articles[0].title}</h3>
                      <p className="text-sm opacity-90 mb-4 font-medium leading-relaxed line-clamp-2 text-gray-200">{articles[0].content[0]}</p>
                      <button className="text-xs font-bold bg-white text-[#1C1C1C] px-5 py-3 rounded-xl shadow-lg hover:bg-gray-100 transition-colors">Read Full Article</button>
                  </div>
               </div>
            </div>
          )}

          {/* Latest Articles List */}
          <div>
             <div className="flex items-center gap-2 mb-4 px-2">
                <BookOpen size={20} className="text-[#6FAE9A]" />
                <h3 className="font-bold text-lg text-[#1C1C1C]">Latest Articles</h3>
             </div>
             
             <div className="space-y-4">
                {articles.slice(1).map((article, idx) => (
                   <Card 
                      key={article.id} 
                      variant="standard" 
                      onClick={() => setSelectedArticle(article)}
                      className="flex gap-4 items-stretch p-3 hover:shadow-xl hover:border-[#6FAE9A]/30 group transition-all duration-300 !rounded-2xl cursor-pointer"
                   >
                      <div className="w-28 h-28 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative shadow-inner">
                         <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                         <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                      </div>
                      <div className="flex-1 py-1 flex flex-col justify-between">
                         <div>
                            <span className="text-[10px] font-bold text-[#6FAE9A] uppercase tracking-wider bg-[#6FAE9A]/10 px-2 py-0.5 rounded-md inline-block mb-2">{article.category}</span>
                            <h4 className="font-bold text-base text-gray-800 leading-snug group-hover:text-[#6FAE9A] transition-colors line-clamp-2">{article.title}</h4>
                         </div>
                         <div className="flex items-center justify-between text-xs text-gray-400 font-medium mt-2">
                            <span className="flex items-center gap-1"><Clock size={10} /> {article.readTime}</span>
                            <span className="flex items-center gap-1 text-[#6FAE9A] group-hover:translate-x-1 transition-transform font-bold">
                                Read <ExternalLink size={10} />
                            </span>
                         </div>
                      </div>
                   </Card>
                ))}
             </div>
          </div>

        </div>
    </div>
  );
};

export default ExploreView;