import React from 'react';
import { Clock, Tag, ChevronRight } from 'lucide-react';

// Sample data structure with added URLs and category colors
const articles = [
  {
    id: 1,
    "title": "Torchit’s JyotiAI Wins Prestigious SDG Digital Pioneers Award at UNGA79",
    "description": "Torchit’s JyotiAI, an innovative smart AI glasses and reader, has been honored with the SDG Digital Pioneers Award at the United Nations General Assembly’s 79th session. Out of 1,000+ global nominees, this recognition highlights the groundbreaking work in assistive technology and Torchit’s contribution to the Sustainable Development Goals (SDGs). The award celebrates a major milestone in inclusive tech, furthering the mission of accessibility for all.",
    "date": "2024-09-22",
    "category": "Achievements",
  
    "url": "https://www.linkedin.com/posts/torchit_jyotiai-unga79-pactforthefuture-activity-7243577282777239554-jsC0?utm_source=share&utm_medium=member_desktop",
    "categoryColor": "green"
  },

  {
    id: 3,
    "title": "Torch-It Recognized as Finalists for Social Entrepreneur of the Year & Receives AI Innovation Award",
    "description": "Torch-It Electronics Pvt Ltd is honored to be recognized as a finalist for the Social Entrepreneur of the Year (SEOY) by Jubilant Bhartia Foundation and Schwab Foundation, with the award presented by Shri Hardeep Singh Puri, Minister of Petroleum & Natural Gas. Additionally, TorchIt received the AI Innovation Award for its Jyoti AI at the Global Bio India Summit, awarded by the Department of Science & Technology, Ministry of Health & Family Welfare, and BIRAC. TorchIt was also featured on CNBC-TV18, showcasing its strides in assistive technology.",
    "date": "2024-09-15",
    "category": "Recognition",
    "url": "https://www.linkedin.com/posts/torchit_seoy-youngturks-changmakers-activity-7241040589658415104-CMA1?utm_source=share&utm_medium=member_desktop",
    "categoryColor": "purple"
  },
  {
    id: 4,
    "title": "TorchIt Showcases Jyoti AI at Jharkhand State Level Consultation on Disability Inclusion",
    "description": "On August 17th, 2024, TorchIt participated in the Jharkhand State Level Stakeholders Consultation on the Protection of Children with Disabilities, hosted by the Juvenile Justice-cum-POCSO Committee and the High Court of Jharkhand, in partnership with UNICEF and the Department of Women, Child Development & Social Security. TorchIt proudly presented the Jyoti AI glasses and Enable Mart kits to esteemed attendees, including Hon'ble Mr. Justice Sujit Narayan Prasad and other High Court Judges, supporting a shared mission toward inclusivity.",
    "date": "2024-08-17",
    "category": "Community Engagement",
    "url": "/news/jharkhand-consultation-jyoti-ai-showcase",
    "categoryColor": "orange"
  },
  {
    id: 5,
    "title": "Successful Launch of Jyoti AI: Empowering Vision Beyond Sight",
    "description": "Torch-It is thrilled to announce the launch of Jyoti AI, a pioneering assistive technology designed to empower individuals with visual impairments. This launch marks a significant milestone in our commitment to enhancing accessibility and independence. Stay tuned for more updates and upcoming innovations.",
    "date": "2024-06-20",
    "category": "Product Launch",
    "url": "https://www.linkedin.com/posts/torchit_torchit-jyotiai-empoweringvision-activity-7209482776838864896-yf_S?utm_source=share&utm_medium=member_desktop",
    "categoryColor": "emerald"
  },
  {
    id: 2,
    "title": "Torch-It Electronics Pvt Ltd Receives National Award 2020",
    "description": "Torch-It Electronics Pvt Ltd is honored with the National Award 2020, presented by H.E. The President of India, the Ministry of Social Justice, and the Government of India. As one of the pioneering startups from PDEU IIC, Torch-It has been recognized with over 45 national and international awards for its dedication to innovation. This achievement marks another significant milestone in our journey to create impactful solutions in assistive technology.",
    "date": "2021-12-04",
    "category": "Awards",
    "url": "https://www.linkedin.com/posts/torchit_torch-it-electronics-pvt-ltd-has-been-awarded-activity-6872890279884574720-kbBn?utm_source=share&utm_medium=member_desktop",
    "categoryColor": "blue"
  },
];


const getCategoryStyle = (colorName) => {
  const styles = {
    indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };
  return styles[colorName] || styles.indigo;
};

const NewsArticles = () => {
  const [expandedArticles, setExpandedArticles] = React.useState(new Set());

  const handleReadMore = (articleId) => {
    setExpandedArticles((prevState) => {
      const newState = new Set(prevState);
      newState.has(articleId) ? newState.delete(articleId) : newState.add(articleId);
      return newState;
    });
  };

  return (
    <div className="max-w-8xl mx-auto py-6 px-4 sm:px-6 lg:px-32">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-600">
          Latest News
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 mt-2">
          Stay updated with our latest announcements and developments
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {articles.map((article) => (
          <div
            key={article.id}
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden p-4 sm:p-6"
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span 
                  className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getCategoryStyle(article.categoryColor)}`}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {article.category}
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {article.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(article.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <p 
                className={`text-sm sm:text-base text-gray-600 dark:text-gray-300 
                  ${!expandedArticles.has(article.id) ? 'line-clamp-3' : ''}`}
              >
                {article.description}
              </p>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleReadMore(article.id)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 
                    transition-colors duration-200 flex items-center text-sm sm:text-base"
                >
                  {expandedArticles.has(article.id) ? 'Read Less' : 'Read More'}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
                {expandedArticles.has(article.id) && (
                  <a
                    href={article.url}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 
                      transition-colors duration-200 flex items-center text-sm sm:text-base"
                  >
                    Read Post
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsArticles;