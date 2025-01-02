import React from 'react';
import { ChevronDown } from 'lucide-react';

const LanguageDropdown = () => {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'gu', name: 'ગુજરાતી' }
  ];

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    console.log('Selected language:', selectedLanguage);
  };

  return (
    <div className="relative inline-block">
      <select
        onChange={handleLanguageChange}
        className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-4 pr-10 leading-tight focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-gray-400 transition-colors"
        defaultValue="en"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <ChevronDown className="h-5 w-5 text-gray-500" />
      </div>
    </div>
  );
};

export default LanguageDropdown;