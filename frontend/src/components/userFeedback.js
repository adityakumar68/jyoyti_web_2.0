
import React from 'react';

const userFeedbacks = [
  {
    id: 1,
    name: 'Jane Doe',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    feedback: 'This product has changed my life! Highly recommended.',
  },
  {
    id: 2,
    name: 'John Smith',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    feedback: 'Exceptional quality and fantastic customer service.',
  },
  {
    id: 3,
    name: 'Alice Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    feedback: 'A must-have for anyone looking for great value.',
  },
  // Add more feedbacks as needed
];

const UserFeedbacks = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">What Our Users Say</h2>
        <div className="flex flex-wrap -mx-4">
          {userFeedbacks.map((feedback) => (
            <div key={feedback.id} className="w-full md:w-1/2 lg:w-1/3 px-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <img
                    className="w-12 h-12 rounded-full mr-4"
                    src={feedback.avatar}
                    alt={feedback.name}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{feedback.name}</h3>
                  </div>
                </div>
                <p className="text-gray-600">{feedback.feedback}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UserFeedbacks;