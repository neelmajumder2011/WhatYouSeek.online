import { useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { ApiService, SearchResult } from './services/api';
import { FavoritesProvider, useFavorites } from './context/FavoritesContext';
import './App.css';

const SearchResults = ({ results }: { results: SearchResult[] }) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  return (
    <div className="mt-8 space-y-4">
      {results.map((result) => (
        <div key={result.url} className="bg-gray-900 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">{result.title}</h3>
              <p className="text-gray-400 mt-2">{result.description}</p>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
              >
                Visit Website
              </a>
            </div>
            <button
              onClick={() => isFavorite(result.url) ? removeFavorite(result.url) : addFavorite(result)}
              className={`p-2 rounded-full ${
                isFavorite(result.url) ? 'text-yellow-400' : 'text-gray-400'
              }`}
            >
              {isFavorite(result.url) ? '★' : '☆'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const websiteTypes = [
    'a coding tutorial website',
    'a recipe website',
    'a fitness tracker',
    'a language learning platform',
    'a meditation app',
    'a travel blog',
    'a music streaming service',
    'a book recommendation site'
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const apiServiceInstance = ApiService.getInstance();
      const searchResults = await apiServiceInstance.searchWebsites(query);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FavoritesProvider>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-primary-white animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-primary-black opacity-100 inline-block !text-opacity-100">What</h1>
          <h1 className="text-5xl font-black text-primary-black opacity-100 inline-block ml-2 !text-opacity-100 hover:scale-105 transition-all duration-300">You</h1>
          <h1 className="text-5xl font-black text-primary-black opacity-100 inline-block ml-2 !text-opacity-100 hover:scale-105 transition-all duration-300">Seek</h1>
          <span className="text-xs font-bold ml-1 bg-primary-black text-primary-white px-2 py-1 rounded-full animate-pulse">.online</span>
        </div>
        
        <div className="text-2xl mb-8 text-center">
          <span className="text-primary-black">I want </span>
          <TypeAnimation
            sequence={websiteTypes.flatMap(type => [type, 2000])}
            wrapper="span"
            speed={50}
            repeat={Infinity}
            className="text-primary-black font-bold animate-gentle-pulse"
          />
        </div>

        <div className="w-full max-w-xl search-container">
          <div className="flex shadow-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the web..."
              className="flex-grow p-3 bg-gray-200 text-primary-black border-2 border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-black transition-all duration-300 animate-subtle-bounce"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-primary-black text-primary-white px-4 rounded-r-lg hover:opacity-90 transition-all duration-300 animate-subtle-bounce"
            >
              Search
            </button>
          </div>
          {loading && (
            <div className="flex justify-center items-center mt-4">
              <div className="w-8 h-8 border-4 border-primary-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="mt-6 space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-gray-100 border-2 border-gray-300 rounded-lg p-5 shadow-md result-card hover-effect animate-slide-up"
              >
                <h2 className="text-xl font-bold mb-2 text-primary-black !opacity-100">{result.title}</h2>
                <p className="text-primary-black !opacity-100 mb-2">{result.description}</p>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-black !opacity-100 underline hover:text-gray-600 transition-colors duration-300"
                >
                  {result.url}
                </a>
              </div>
            ))}
          </div>
        </div>

        {results.length > 0 && <SearchResults results={results} />}
      </div>
    </FavoritesProvider>
  );
}

export default App;