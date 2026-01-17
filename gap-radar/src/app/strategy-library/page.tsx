'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Strategy {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  framework: string;
  example_script: string;
  when_to_use: string;
  best_for: string[];
  effectiveness_score: number;
  difficulty: string;
  icon: string;
}

interface WinningAd {
  id: string;
  brand_name: string;
  niche: string;
  platform: string;
  hook: string;
  promise: string;
  cta: string;
  ad_format: string;
  strategy_used: string;
  why_it_works: string;
  key_elements: Record<string, string>;
  is_featured: boolean;
}

interface Playbook {
  id: string;
  niche: string;
  niche_display_name: string;
  description: string;
  market_size: string;
  competition_level: string;
  growth_trend: string;
  target_audience: string;
  pain_points: string[];
  top_strategies: string[];
  recommended_hooks: string[];
  recommended_formats: string[];
}

export default function StrategyLibraryPage() {
  const [activeTab, setActiveTab] = useState<'strategies' | 'ads' | 'playbooks'>('strategies');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [winningAds, setWinningAds] = useState<WinningAd[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [strategiesRes, adsRes, playbooksRes] = await Promise.all([
        fetch('/api/strategies'),
        fetch('/api/strategies/winning-ads?featured=true'),
        fetch('/api/strategies/playbooks'),
      ]);

      const [strategiesData, adsData, playbooksData] = await Promise.all([
        strategiesRes.json(),
        adsRes.json(),
        playbooksRes.json(),
      ]);

      setStrategies(strategiesData.strategies || []);
      setWinningAds(adsData.ads || []);
      setPlaybooks(playbooksData.playbooks || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }

  const filteredStrategies = categoryFilter === 'all' 
    ? strategies 
    : strategies.filter(s => s.category === categoryFilter);

  const categories = [...new Set(strategies.map(s => s.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">📚 Strategy Library</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Proven ad strategies, winning examples, and complete playbooks to help you 
            know exactly what ads to run and what to build next.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'strategies', label: '🎯 Ad Strategies', count: strategies.length },
              { id: 'ads', label: '🏆 Winning Ads', count: winningAds.length },
              { id: 'playbooks', label: '📖 Niche Playbooks', count: playbooks.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Strategies Tab */}
            {activeTab === 'strategies' && (
              <div>
                {/* Category Filter */}
                <div className="mb-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      categoryFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All Strategies
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                        categoryFilter === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Strategy Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStrategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      onClick={() => setSelectedStrategy(strategy)}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-3xl">{strategy.icon}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            strategy.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                            strategy.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {strategy.difficulty}
                          </span>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {strategy.effectiveness_score}/10
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{strategy.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{strategy.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {(strategy.best_for || []).slice(0, 3).map((tag, i) => (
                          <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Winning Ads Tab */}
            {activeTab === 'ads' && (
              <div className="space-y-6">
                {winningAds.map((ad) => (
                  <div
                    key={ad.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{ad.brand_name}</h3>
                          {ad.is_featured && (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span className="capitalize">{ad.platform}</span>
                          <span>•</span>
                          <span className="capitalize">{ad.niche?.replace(/-/g, ' ')}</span>
                          <span>•</span>
                          <span className="capitalize">{ad.ad_format?.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {ad.strategy_used}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hook</p>
                        <p className="text-gray-900 font-medium">"{ad.hook}"</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Promise</p>
                        <p className="text-gray-900 font-medium">{ad.promise}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">CTA</p>
                        <p className="text-gray-900 font-medium">{ad.cta}</p>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Why It Works</p>
                      <p className="text-green-800">{ad.why_it_works}</p>
                    </div>

                    {ad.key_elements && Object.keys(ad.key_elements).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(ad.key_elements).map(([key, value]) => (
                          <span key={key} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            <span className="font-medium capitalize">{key}:</span> {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Playbooks Tab */}
            {activeTab === 'playbooks' && (
              <div className="grid lg:grid-cols-2 gap-6">
                {playbooks.map((playbook) => (
                  <div
                    key={playbook.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">{playbook.niche_display_name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          playbook.growth_trend === 'emerging' ? 'bg-green-400 text-green-900' :
                          playbook.growth_trend === 'growing' ? 'bg-blue-400 text-blue-900' :
                          playbook.growth_trend === 'mature' ? 'bg-yellow-400 text-yellow-900' :
                          'bg-red-400 text-red-900'
                        }`}>
                          {playbook.growth_trend}
                        </span>
                      </div>
                      <p className="text-indigo-100 text-sm">{playbook.description}</p>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{playbook.market_size}</p>
                          <p className="text-xs text-gray-500">Market Size</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${
                            playbook.competition_level === 'low' ? 'text-green-600' :
                            playbook.competition_level === 'medium' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {playbook.competition_level}
                          </p>
                          <p className="text-xs text-gray-500">Competition</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {(playbook.pain_points || []).length}
                          </p>
                          <p className="text-xs text-gray-500">Pain Points</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Target Audience</p>
                        <p className="text-gray-700 text-sm">{playbook.target_audience}</p>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Top Pain Points</p>
                        <ul className="space-y-1">
                          {(playbook.pain_points || []).slice(0, 3).map((pain, i) => (
                            <li key={i} className="text-gray-700 text-sm flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              {pain}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Recommended Hooks</p>
                        <div className="space-y-2">
                          {(playbook.recommended_hooks || []).slice(0, 2).map((hook, i) => (
                            <p key={i} className="text-gray-900 text-sm italic bg-gray-50 p-2 rounded">
                              "{hook}"
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(playbook.recommended_formats || []).map((format, i) => (
                          <span key={i} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs capitalize">
                            {format.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Strategy Detail Modal */}
      {selectedStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{selectedStrategy.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedStrategy.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="capitalize text-gray-500">{selectedStrategy.category}</span>
                      <span className="text-gray-300">•</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        selectedStrategy.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                        selectedStrategy.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {selectedStrategy.difficulty}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        Effectiveness: {selectedStrategy.effectiveness_score}/10
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStrategy(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-6">{selectedStrategy.description}</p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                    The Framework
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                    {selectedStrategy.framework}
                  </div>
                </div>

                {selectedStrategy.example_script && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                      Example
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 whitespace-pre-wrap text-blue-800">
                      {selectedStrategy.example_script}
                    </div>
                  </div>
                )}

                {selectedStrategy.when_to_use && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                      When to Use
                    </h3>
                    <p className="text-gray-700">{selectedStrategy.when_to_use}</p>
                  </div>
                )}

                {selectedStrategy.best_for && selectedStrategy.best_for.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                      Best For
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedStrategy.best_for.map((item, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedStrategy(null)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
