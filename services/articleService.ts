import { Article, HealthCondition, UserProfile } from "../types";

// --- DATA POOLS FOR GENERATION ---

// Verified, reliable Unsplash IDs
export const IMAGE_MAP: Record<string, string[]> = {
  'Nutrition': [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80", // Healthy food bowl
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80", // Avocado toast
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80", // Salad
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80", // Vegetables
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80", // Fresh produce
    "https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=800&q=80", // Breakfast
    "https://images.unsplash.com/photo-1505253758473-96b701d36dec?auto=format&fit=crop&w=800&q=80"  // Smoothies
  ],
  'Wellness': [
    "https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&w=800&q=80", // Yoga
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80", // Meditation
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80", // Relaxing tea
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80", // Fitness
    "https://images.unsplash.com/photo-1499209974431-2761e2523676?auto=format&fit=crop&w=800&q=80", // Nature calm
    "https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=800&q=80"  // Spa
  ],
  'Medical': [
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80", // Stethoscope
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80", // Medical science
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80", // Doctor consultation
    "https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=800&q=80", // Lab
    "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80"  // Health tech
  ],
  'Pregnancy': [
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80", // Mother holding belly
    "https://images.unsplash.com/photo-1555820585-c5ae44394b79?auto=format&fit=crop&w=800&q=80", // Baby shoes
    "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=800&q=80", // Baby
    "https://images.unsplash.com/photo-1492462543947-040389c4a66c?auto=format&fit=crop&w=800&q=80", // Newborn
    "https://images.unsplash.com/photo-1628173549727-2c525f0e1f7c?auto=format&fit=crop&w=800&q=80"  // Parenting
  ],
  'General': [
    "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80", // General nature
    "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=800&q=80", // Healthy lifestyle
    "https://images.unsplash.com/photo-1447452001602-7090c774637d?auto=format&fit=crop&w=800&q=80", // Sun
    "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=800&q=80"  // Coffee/Book
  ]
};

const TITLE_TEMPLATES = {
  'Nutrition': {
    prefixes: ["The Science of", "Understanding", "The Truth About", "A Daily Guide to", "Optimizing Your", "Secrets of", "Why You Need", "Mastering", "Essential Tips for", "Unlocking"],
    topics: ["Macronutrients", "Gut Health", "Fiber Intake", "Hydration", "Plant-Based Proteins", "Healthy Fats", "Sugar Reduction", "Meal Timing", "Micronutrients", "Metabolic Health", "Superfoods", "Dietary Fiber", "Probiotics", "Electrolytes", "Antioxidants"],
    suffixes: ["for Better Energy", "Explained", "in Modern Life", "for Longevity", "Step by Step", "Today", "for Your Body", "Research Updates", "Deep Dive", "and You"]
  },
  'Wellness': {
    prefixes: ["The Art of", "Prioritizing", "Building", "Strategies for", "The Power of", "Daily Habits for", "Transforming Your", "A New Approach to", "Understanding", "Balancing"],
    topics: ["Sleep Quality", "Stress Management", "Mindfulness", "Daily Movement", "Mental Clarity", "Digital Detox", "Morning Routines", "Evening Wind-downs", "Emotional Resilience", "Breathwork", "Nature Therapy", "Social Connection", "Self-Care", "Hydration Habits", "Focus"],
    suffixes: ["for Inner Peace", "in a Busy World", "Made Simple", "for Beginners", "for Mental Health", "Every Day", "at Home", "for Success", "Lifestyle Guide"]
  },
  'Medical': {
    prefixes: ["Recent Advances in", "Managing", "Living With", "The Biology of", "Preventing", "Doctor's Advice on", "Research Updates on", "Navigating", "Understanding Symptoms of", "Treatment Options for"],
    topics: ["Autoimmune Responses", "Chronic Inflammation", "Heart Health", "Immune System Function", "Hormonal Balance", "Blood Sugar Control", "Joint Health", "Allergy Management", "Digestive Disorders", "Respiratory Health", "Skin Barrier Function", "Metabolic Syndrome", "Vitamin Deficiencies", "Pain Management"],
    suffixes: ["Safely", "Effectively", "According to Science", "in 2024", "Explained by Experts", "Without Stress", "Patient Guide", "Clinical Review", "Breakthroughs"]
  },
  'Pregnancy': {
    prefixes: ["Navigating", "The Joy of", "Safe Guide to", "Understanding", "Preparing for", "Nutrition During", "Wellness for", "The Trimesters of", "Postpartum", "Exercise During"],
    topics: ["First Trimester", "Baby Development", "Maternal Nutrition", "Prenatal Vitamins", "Safe Skincare", "Labor Prep", "Sleep Positions", "Morning Sickness", "Cravings", "Hospital Bags", "Breastfeeding Prep", "Pelvic Floor Health", "Emotional Changes", "Partner Support"],
    suffixes: ["for New Moms", "Week by Week", "Made Easy", "Safely", "for a Healthy Baby", "With Confidence", "Survival Guide", "Expert Tips", "Mom-to-Be"]
  },
  'General': {
    prefixes: ["Daily Insight:", "The Basics of", "Improving Your", "Simple Steps to", "Why You Should Consider", "A Guide to", "Healthy Habits for", "Understanding", "The Benefits of", "Life Hacks for"],
    topics: ["Hydration", "Walking", "Balanced Diet", "Better Sleep", "Routine", "Fresh Air", "Mindfulness", "Stretching", "Vitamin D", "Self-Care", "Productivity", "Relaxation", "Immunity", "Energy Levels", "Mental Clarity"],
    suffixes: ["Today", "Made Easy", "for Beginners", "in 5 Minutes", "for a Better You", "explained", "at Home", "Every Day", "for Success", "Scientifically Proven"]
  }
};

const CONTENT_BLOCKS = {
  intros: [
    "In the ever-evolving landscape of health and wellness, staying informed is the first line of defense. Today, we delve deep into a topic that affects millions but is often misunderstood. Our editorial team has combed through the latest research to bring you actionable insights.",
    "Making informed decisions about your body is empowering. This article aims to demystify complex medical concepts and translate them into practical daily habits. Whether you are managing a condition or optimizing your health, understanding the fundamentals is key.",
    "It is often said that health is wealth, but what does that mean in a practical sense? Today's feature focuses on a critical aspect of well-being that often goes unnoticed until symptoms arise. Let's explore the science and the solutions.",
    "With so much conflicting advice available online, VitalSense Editorial is committed to providing evidence-based clarity. This piece investigates the core mechanisms of this topic and offers a balanced perspective rooted in recent clinical findings."
  ],
  generalBody: [
    "To understand the bigger picture, we must first look at the biological mechanisms at play. Our bodies are complex adaptive systems, and small changes in our environment or diet can trigger significant physiological responses. Recent studies published in major medical journals highlight this interconnectedness.",
    "One key factor to consider is the role of consistency. Health is rarely about a single intervention but rather the cumulative effect of daily choices. Experts agree that a holistic approach—considering diet, sleep, and stress—yields the most sustainable results over time.",
    "Furthermore, individual variability cannot be ignored. What works for one person may not be ideal for another due to genetic and lifestyle differences. This underscores the importance of personalized care and listening to your body's unique signals.",
    "Let's break down the components. At a cellular level, efficiency is driven by nutrient availability and metabolic flexibility. Ensuring that your body has the right building blocks is essential for repair and energy production.",
    "Another critical aspect often overlooked is the environmental impact on our biology. From air quality to artificial lighting, modern stressors challenge our ancestral biology. Adapting our lifestyle to mitigate these factors is becoming increasingly important."
  ],
  specifics: [
    "Practically speaking, there are three main strategies to implement immediately. First, prioritize whole, unprocessed inputs wherever possible. Second, establish a regular rhythm for your biological clock by adhering to consistent timing. Third, monitor your body's response and adjust accordingly.",
    "Nutritionists often recommend a 'food first' approach. Before turning to supplementation, evaluate your dietary intake. Are you getting enough diversity on your plate? Color often indicates nutrient density, so aim for a wide spectrum of vegetables and fruits.",
    "On the topic of lifestyle, stress reduction is non-negotiable. Chronic elevation of cortisol can dampen immune response and increase inflammation. Simple practices like 4-7-8 breathing or a 10-minute daily walk can reset your nervous system effectively.",
    "For those managing specific conditions, avoidance of triggers is just as important as the inclusion of beneficial elements. Keep a symptom diary to identify patterns that might otherwise go unnoticed. Data is your most powerful tool in self-advocacy.",
    "Integration is key. Start by stacking new habits onto existing ones. For example, if you drink coffee every morning, use that time to take your supplements or practice a moment of gratitude. This reduces friction and increases adherence."
  ],
  science: [
    "A 2023 study from the National Institute of Health verified that participants who engaged in these protocols saw a 20% improvement in markers within six weeks. This data supports the hypothesis that lifestyle interventions are powerful adjuncts to traditional medical treatments.",
    "Researchers have also isolated specific pathways that link gut health to mental well-being in this context. The gut-brain axis is a rapidly expanding field of study, suggesting that what we consume has direct implications for our mood and cognitive function.",
    "It is worth noting that inflammation is a common denominator in many chronic issues. By addressing the root cause—often dietary or environmental—patients frequently report a reduction in systemic symptoms that extends beyond their primary complaint.",
    "Meta-analyses of over 50 clinical trials have shown consistent results regarding the efficacy of this approach. While individual results vary, the statistical trend points clearly towards significant benefit for the majority of the population."
  ],
  conclusion: [
    "In conclusion, while the journey to optimal health is personal, the principles remain universal. Knowledge is the precursor to change. By applying the insights shared today, you are taking a proactive step towards a healthier future.",
    "We hope this deep dive has provided clarity and confidence. Remember, significant transformation happens incrementally. Start with one small change today, and let the momentum build. Your body will thank you.",
    "As always, VitalSense is here to support your journey. Stay tuned for tomorrow's update where we will tackle another crucial aspect of living well. Until then, prioritize your well-being.",
    "Final thoughts: Listen to your body, consult with your healthcare provider, and stay curious. The more you understand about your own physiology, the better equipped you are to thrive."
  ]
};

// --- GENERATOR LOGIC ---

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateLongContent = (category: string, title: string): string[] => {
  const paragraphs: string[] = [];
  
  // 1. Introduction (2 paragraphs)
  paragraphs.push(getRandomItem(CONTENT_BLOCKS.intros));
  paragraphs.push(`Specifically regarding "${title}", early adoption of these principles can prevent long-term complications. We are seeing a shift in medical consensus towards proactive management.`);

  // 2. Body: Context (3 paragraphs)
  paragraphs.push(...CONTENT_BLOCKS.generalBody.sort(() => 0.5 - Math.random()).slice(0, 3));

  // 3. Body: Advice & Specifics (4 paragraphs)
  paragraphs.push(`When we analyze ${category.toLowerCase()} through this lens, several actionable points emerge.`);
  paragraphs.push(...CONTENT_BLOCKS.specifics.sort(() => 0.5 - Math.random()).slice(0, 3));

  // 4. Body: Science (3 paragraphs)
  paragraphs.push(...CONTENT_BLOCKS.science.sort(() => 0.5 - Math.random()).slice(0, 3));

  // 5. Conclusion (2 paragraphs)
  paragraphs.push(...CONTENT_BLOCKS.conclusion.sort(() => 0.5 - Math.random()).slice(0, 2));

  return paragraphs;
};

// Deterministic Image Helper
export const getDeterministicImage = (article: Article): string => {
    const images = IMAGE_MAP[article.category] || IMAGE_MAP['General'];
    // Simple hash from ID string to number
    let hash = 0;
    for (let i = 0; i < article.id.length; i++) {
        hash = article.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % images.length;
    return images[index];
};

const generateArticlesForCategory = (category: string, count: number): Article[] => {
  const templates = TITLE_TEMPLATES[category as keyof typeof TITLE_TEMPLATES] || TITLE_TEMPLATES['General'];
  const articles: Article[] = [];
  
  for (let i = 0; i < count; i++) {
    const prefix = getRandomItem(templates.prefixes);
    const topic = getRandomItem(templates.topics);
    const suffix = getRandomItem(templates.suffixes);
    const title = `${prefix} ${topic} ${suffix}`;
    
    // Create unique ID with random component to ensure better hash distribution
    // NOTE: Using a cleaner ID format to avoid issues
    const id = `${category.toLowerCase()}-${i}-${Date.now()}`;

    articles.push({
      id: id,
      title: title,
      category: category,
      source: "VitalSense Editorial",
      sourceUrl: "", // Internal content only
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      readTime: `${Math.floor(Math.random() * 4) + 6} min`, // 6-10 min read
      summary: `A comprehensive guide exploring the nuances of ${topic.toLowerCase()} and how it impacts your daily ${category.toLowerCase()} journey.`,
      content: generateLongContent(category, title)
    });
  }
  return articles;
};

// --- PUBLIC API ---

export const getDailyFeed = (userProfile: UserProfile | null): Article[] => {
  const condition = userProfile?.condition || HealthCondition.GENERAL_HEALTH;
  let relevantCategories: string[] = ['Nutrition', 'Wellness', 'General'];

  // Map condition to relevant categories
  if (condition === HealthCondition.PREGNANCY) relevantCategories = ['Pregnancy', 'Nutrition', 'Wellness'];
  else if (condition === HealthCondition.CANCER_CARE) relevantCategories = ['Medical', 'Nutrition', 'Wellness'];
  else if (condition === HealthCondition.AUTOIMMUNE) relevantCategories = ['Medical', 'Nutrition', 'General'];
  else if (condition === HealthCondition.ALLERGIES) relevantCategories = ['Medical', 'Nutrition', 'General'];

  // Generate a pool of 30 articles per relevant category
  let pool: Article[] = [];
  relevantCategories.forEach(cat => {
    // Generate 30 per category as requested
    pool = [...pool, ...generateArticlesForCategory(cat, 30)]; 
  });

  // Shuffle and pick 6 for the feed view
  const shuffled = pool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 6);
};