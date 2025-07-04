import React, { useState, lazy, Suspense } from 'react';
import loadable from '@loadable/component';
import { List, WindowScroller } from 'react-virtualized';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ArrowRight,
  User
} from 'lucide-react';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#90C641]"></div>
  </div>
);

const Footer = loadable(() => import('../../components/Footer'), {
  fallback: <LoadingSpinner />
});

const preloadImages = () => {
  const images = [
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
    'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg'
  ];
  
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: ['No Brokers,', 'Connect buyers', 'and Sellers'],
      subtitle: 'No negotiation needed',
      image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg'
    },
    {
      title: "Discover a place you'll love to live",
      subtitle: 'Find your perfect home today',
      image: 'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg'
    }
  ];

  const featuredHomes = [
    { title: 'Recommended Homes', count: '8 Properties', image: 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg' },
    { title: 'New Listings', count: '2 Properties', image: 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg' },
    { title: 'House', count: '1 Property', image: 'https://images.pexels.com/photos/1876045/pexels-photo-1876045.jpeg' },
    { title: 'Cabin', count: '2 Properties', image: 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg' }
  ];

  const featuredCities = [
    { image: 'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg', city: 'Visakhapatnam', listings: 2, price: '₹ 1,125,062', featured: true },
    { image: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg', city: 'Visakhapatnam', listings: 2, price: '₹ 1,125,062', featured: false },
    { image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', city: 'Visakhapatnam', listings: 2, price: '₹ 1,125,062', featured: false }
  ];

  const testimonials = [
    { name: 'Andrew', image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg', text: "We've used Hyra over a handful of times and it's been great every single time. Definitely recommend." },
    { name: 'Lynette', image: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg', text: 'I never imagined this could be the source of income it is today.' },
    { name: 'Paige', image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg', text: 'Hosting is always fun, simple.' },
    { name: 'Marcus', image: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg', text: 'I never imagined this could be the source of income it is today.' }
  ];

  const cities = [
    ['Machilipatnam', 'Narasaraopet', 'Yerraguntla', 'Guntur'],
    ['Pithapuram', 'Gudivada', 'Samalkot', 'Sullurpeta'],
    ['Vijayawada', 'Kadiri', 'Mahbubnagar', 'Khammam'],
    ['Warangal', 'Rayachoti', 'Nagari', 'Repalle'],
    ['Jaggaiahpet', 'Dharmavaram', 'Karimnagar', 'Bhimavaram'],
    ['Tadepalligudem', 'Tenali', 'Chirala', 'Adoni'],
    ['Kovvur', 'Narayanpet', 'Bellampalle', 'Palwancha']
  ];

  React.useEffect(() => {
    preloadImages();
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{ 
            backgroundImage: `url(${slides[currentSlide].image})`,
            willChange: 'transform'
          }} 
        />
        <div className="absolute inset-0 bg-black opacity-60" />
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-7xl">
          <div className="backdrop-blur-md bg-white/90 rounded-2xl shadow-lg border border-white/20">
            <div className="flex justify-between items-center px-8 py-4">
              <img 
                src="https://qnaixvfssjdwdwhmvnyt.supabase.co/storage/v1/object/sign/Foodlu-Pickles/Home&Own-Logo.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGb29kbHUtUGlja2xlcy9Ib21lJk93bi1Mb2dvLnBuZyIsImlhdCI6MTc0NTEzNDI2MiwiZXhwIjoxNzc2NjcwMjYyfQ.5kNyGYdfvAjCj8yNDgBq0hWcPC3GZAOQkixhs5jp-hA" 
                alt="Home & Own" 
                className="h-16 w-auto" // Increased logo size
              />
              <div className="flex items-center gap-8">
                <a href="#" className="text-xl font-semibold text-gray-700 hover:text-[#90C641]">Buy</a>
                <a href="#" className="text-xl font-semibold text-gray-700 hover:text-[#90C641]">Sell</a>
                <a href="#" className="text-xl font-semibold text-gray-700 hover:text-[#90C641]">Agent</a>
                <a href="/login" className="bg-[#90C641] text-white p-3 rounded-full hover:bg-[#7DAF35] transform hover:scale-105">
                  <User size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            {currentSlide === 0 ? (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">
                <span className="text-white">{slides[0].title[0]} </span>
                <span className="text-[#90C641]">{slides[0].title[1]} </span>
                <span className="text-white">{slides[0].title[2]}</span>
              </h1>
            ) : (
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-2">
                {slides[currentSlide].title}
              </h1>
            )}
            <p className="text-2xl md:text-3xl text-[#90C641] font-semibold">
              {slides[currentSlide].subtitle}
            </p>
          </div>
          <div className="flex gap-4 mt-8">
            <button className="bg-[#90C641] text-white px-10 py-4 rounded-xl hover:bg-[#7DAF35] transform hover:scale-105 font-semibold">Buy</button>
            <button className="bg-white/20 backdrop-blur-md text-white px-10 py-4 rounded-xl hover:bg-white/30 transform hover:scale-105 font-semibold">Sell</button>
          </div>
          <div className="mt-10 w-full max-w-4xl">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 flex gap-3 shadow-xl">
              <input type="text" placeholder="Enter Keyword" className="flex-1 p-4 rounded-xl bg-gray-50 text-gray-800 focus:ring-2 focus:ring-[#90C641]" />
              <select className="w-48 p-4 rounded-xl bg-gray-50 text-gray-800 focus:ring-2 focus:ring-[#90C641]">
                <option>All Type</option><option>House</option><option>Apartment</option><option>Villa</option>
              </select>
              <button className="bg-[#90C641] text-white px-8 py-4 rounded-xl hover:bg-[#7DAF35] transform hover:scale-105 flex items-center gap-2 font-semibold">
                <Search size={20} /> Search
              </button>
            </div>
          </div>
        </div>
        <button onClick={prevSlide} className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:bg-[#90C641] transform hover:scale-110">
          <ChevronLeft size={24} />
        </button>
        <button onClick={nextSlide} className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:bg-[#90C641] transform hover:scale-110">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Featured Homes */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#061D58] mb-2">Featured Homes</h2>
          <p className="text-center text-gray-600 mb-12">Step Into Luxury: Explore Our Featured Homes Today!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredHomes.map((home, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden">
                <img 
                  src={home.image} 
                  alt={home.title} 
                  className="w-full h-64 object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-6">
                  <div className="text-white">
                    <h3 className="text-xl font-semibold">{home.title}</h3>
                    <p>{home.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Work With Us */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#061D58] mb-2">Why You Should Work With Us</h2>
          <p className="text-center text-gray-600 mb-12">Your Success Is Our Mission — Here's Why We're the Right Choice!</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-[#90C641]" />
              <h3 className="text-xl font-semibold mb-2">Wide Range of Properties</h3>
              <p className="text-gray-600">We offer expert legal help for all related property items in India.</p>
            </div>
            <div className="text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-[#90C641]" />
              <h3 className="text-xl font-semibold mb-2">Buy or Sell Properties</h3>
              <p className="text-gray-600">We sell your home at the best market price quickly and efficiently.</p>
            </div>
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-[#90C641]" />
              <h3 className="text-xl font-semibold mb-2">Trusted by Thousands</h3>
              <p className="text-gray-600">We offer free consultancy to help secure loans for your new home.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Take the first step */}
      <div className="bg-[#061D58] py-16">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Take the first step</h2>
            <p className="text-white opacity-80">Select your goal and we'll guide you on your journey</p>
          </div>
          <button className="bg-[#90C641] text-white px-6 py-3 rounded-lg hover:bg-[#7DAF35] inline-flex items-center gap-2">
            Enquiry now <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Featured Cities */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#061D58] mb-2">Featured Cities</h2>
          <p className="text-gray-600 mb-6">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <div className="flex justify-center gap-4 mb-12">
            <button className="bg-[#90C641] text-white px-6 py-2 rounded-full">All Properties</button>
            <button className="text-gray-600 hover:text-[#90C641]">Buy</button>
            <button className="text-gray-600 hover:text-[#90C641]">Sell</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCities.map((city, i) => (
              <div key={i} className="rounded-lg overflow-hidden shadow-lg group">
                <div className="relative">
                  <img src={city.image} alt={city.city} className="w-full h-64 object-cover" loading="lazy" decoding="async" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-[#061D58] text-white px-3 py-1 rounded-full text-sm">FOR SALE</span>
                    {city.featured && <span className="bg-[#F5C934] text-white px-3 py-1 rounded-full text-sm">FEATURED</span>}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin size={16} /> <span>{city.listings} Listings for sale</span>
                  </div>
                  <p className="text-lg font-semibold mb-1">{city.city}</p>
                  <p className="text-lg font-semibold">
                    {city.price} <span className="text-sm font-normal">Median Listing Home Price</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Discover Section */}
      <div className="relative h-screen">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slides[1].image})` }} />
        <div className="absolute inset-0 bg-[#061D58] bg-opacity-90" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">Discover a place you'll love to live</h2>
            <p className="text-lg text-white mb-8">
              Looking to buy your dream home or sell your current property? We make the process smooth, simple, and stress-free. Whether you're searching for the perfect place to call home or want to get the best value for your property, our expert team is here to guide you every step of the way. Buy with confidence. Sell with success.
            </p>
            <button className="bg-[#90C641] text-white px-8 py-3 rounded-lg hover:bg-[#7DAF35] inline-flex items-center gap-2">
              View Properties <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#061D58] mb-2">Meet our community</h2>
          <p className="text-center text-gray-600 mb-12">See what people are saying about Home & Own</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="text-center">
                <img src={t.image} alt={t.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" loading="lazy" decoding="async" />
                <h3 className="text-xl font-semibold mb-2">Meet {t.name}</h3>
                <p className="text-gray-600">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Property CTA */}
      <div className="bg-[#061D58] py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0A2468] rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Looking for the new Property?</h3>
            <p className="mb-6">10 new offers every day. 350 offers on site, trusted by a community of thousands of users.</p>
            <button className="bg-[#90C641] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
              Get Started <ArrowRight size={20} />
            </button>
          </div>
          <div className="bg-[#0A2468] rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Want to sell your Property?</h3>
            <p className="mb-6">10 new offers every day. 350 offers on site, trusted by a community of thousands of users.</p>
            <button className="bg-[#90C641] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
              Get Started <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Search By homes by City */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#061D58] mb-2">Search By homes by City</h2>
          <p className="text-gray-600 mb-8">Find Your Dream Home in Your Favorite City!</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cities.map((col, cIdx) => (
              <div key={cIdx} className="space-y-2 text-gray-800">
                {col.map((cityName, idx) => (
                  <a key={idx} href="#" className="block hover:text-[#90C641] transition-colors">
                    {cityName} Homes
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Become Agent CTA */}
      <div className="bg-[#061D58] py-16">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Become a Real Estate Agent</h2>
            <p className="text-white opacity-80">We only work with the best companies around India</p>
          </div>
          <button className="bg-[#90C641] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
            Enquiry now <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Footer with Suspense */}
      <Suspense fallback={<LoadingSpinner />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Home;