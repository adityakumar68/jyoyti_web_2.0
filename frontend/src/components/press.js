// src/components/PressReleaseLinks.jsx

import React from 'react';
import { ExternalLinkIcon } from '@heroicons/react/outline';

const pressReleases = [
  {
    id: 1,
    title: 'Company X Launches New Service',
    date: '2024-04-15',
    link: 'https://www.example.com/press-release-1',
  },
  {
    id: 2,
    title: 'Company X Recognized as Industry Leader',
    date: '2024-06-22',
    link: 'https://www.example.com/press-release-2',
  },
  {
    id: 3,
    title: 'Company X Partners with Y Corp',
    date: '2024-09-10',
    link: 'https://www.example.com/press-release-3',
  },
  // Add more press releases as needed
];

const PressReleaseLinks = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">Latest Press Releases</h2>
        <ul className="max-w-3xl mx-auto space-y-4">
          {pressReleases.map((release) => (
            <li key={release.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md hover:bg-gray-100 transition-colors duration-300">
              <div>
                <h3 className="text-lg font-medium text-gray-800">{release.title}</h3>
                <p className="text-sm text-gray-500">{new Date(release.date).toLocaleDateString()}</p>
              </div>
              <a
                href={release.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                Read More <ExternalLinkIcon className="w-5 h-5 ml-1" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default PressReleaseLinks;