import React, { useState } from 'react';
import { PlayCircle, Youtube, Maximize2, Minimize2 } from 'lucide-react';

const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const videos = [
  {
    id: 1,
    title: 'Jyoti AI Pro by Torchit Demonstration at High Court of Jharkhand: Empowering the Visually Impaired',
    link: 'https://www.youtube.com/watch?v=YhwtgAYiGSk&t=3s',
  },
  {
    id: 2,
    title: 'Jyoti AI Pro by Torchit: Revolutionary Assistive Device for the Visually Impaired',
    link: 'https://youtu.be/Gh3w5mvRmFU?si=XUgSAXXKW9OGWWF3',
  },
  {
    id: 3,
    title: 'Thank You ONGC: Empowering 15,000 Visually Impaired Individuals Through Saarthi',
    link: 'https://www.youtube.com/watch?v=DTNUcU6aHRs',
  },
  {
    id: 4,
    title: 'IRCTC & Torchit: Empowering Visually Impaired Friends for a Brighter Future',
    link: 'https://www.youtube.com/watch?v=IXczBQLXvIQ',
  },
  {
    id: 5,
    title: 'Jyoti AI, how our visually impaired friends can \'See with Sound\' and the passion that drives us',
    link: 'https://youtu.be/pALPwGcO-Dk?si=v19gbAkKzva5lbRB',
  },
];

const VideoCard = ({ video }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = getYouTubeVideoId(video.link);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : '/api/placeholder/640/360';

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
   
        <div className="bg-white shadow-md overflow-hidden transition-all duration-300">
          <div className="relative" style={{ height: '300px' }}>
            {isPlaying ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            ) : (
              <>
                <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <button onClick={togglePlay} className="text-red-600">
                    <PlayCircle className="w-16 h-16" />
                  </button>
                </div>
                <span className="absolute bottom-2 right-2 bg-black text-white px-2 py-1 text-xs">
                  {video.duration}
                </span>
              </>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 line-clamp-2">{video.title}</h3>
          </div>
        </div>
      );
    };
    
    const VideoGallery = () => {
      return (
        <div className="container mx-auto lg:px-0 px-4 sm:px-6 py-8">
          <h2 className="text-3xl font-bold mb-6">Our Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      );
    };
    
    export default VideoGallery;