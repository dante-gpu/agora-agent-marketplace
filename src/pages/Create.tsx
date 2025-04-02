import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Upload, Trash2, Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAgentStore } from '../store/agentStore';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';

const capabilities = {
  chat: { name: 'Chat', description: 'Natural conversation abilities' },
  coding: { name: 'Coding', description: 'Programming assistance' },
  reasoning: { name: 'Reasoning', description: 'Complex problem solving' },
  quick_responses: { name: 'Fast', description: 'Quick response time' },
  web_development: { name: 'Web Dev', description: 'Web development expertise' },
  technical_design: { name: 'Design', description: 'Technical design assistance' },
  analysis: { name: 'Analysis', description: 'Data analysis capabilities' },
  research: { name: 'Research', description: 'Research and information gathering' },
};

const models = [
  { id: 'gpt-4', name: 'GPT-4', context: 128000, speed: 'fast' },
  { id: 'claude-3', name: 'Claude 3', context: 64000, speed: 'very_fast' },
  { id: 'gemini-pro', name: 'Gemini Pro', context: 32000, speed: 'medium' },
  { id: 'custom', name: 'Custom Model', context: 16000, speed: 'medium' },
];

function Create() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createAgent, loading, error } = useAgentStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [customConfig, setCustomConfig] = useState({
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });
  const [formError, setFormError] = useState('');

  const handleCapabilityToggle = (capability: string) => {
    setSelectedCapabilities(prev => 
      prev.includes(capability)
        ? prev.filter(c => c !== capability)
        : [...prev, capability]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      setFormError('You must be signed in to create an agent');
      return;
    }

    if (selectedCapabilities.length === 0) {
      setFormError('Please select at least one capability');
      return;
    }

    try {
      const selectedModelData = models.find(m => m.id === selectedModel);
      
      await createAgent({
        name,
        description,
        category,
        creator: user.id,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=500',
        model_name: selectedModel,
        technical_specs: {
          capabilities: selectedCapabilities,
          context_length: selectedModelData?.context,
          response_speed: selectedModelData?.speed,
          api_config: selectedModel === 'custom' ? customConfig : undefined
        },
        status: 'active'
      });
      
      navigate('/explore');
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Create an AI Agent</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
      </div>

      {(formError || error) && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 mb-6">
          {formError || error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Agent Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                placeholder="Give your agent a name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                placeholder="Describe what your agent does"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                required
              >
                <option value="">Select a category</option>
                <option value="Writing">Writing</option>
                <option value="Programming">Programming</option>
                <option value="Research">Research</option>
                <option value="Knowledge">Knowledge</option>
                <option value="Business">Business</option>
                <option value="Math">Math</option>
                <option value="Design">Design</option>
                <option value="Music">Music</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Capabilities</h2>
          <p className="text-gray-400 mb-4">Select the capabilities of your agent</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(capabilities).map(([key, { name, description }]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCapabilityToggle(key)}
                className={`
                  p-4 rounded-lg border text-left transition-colors
                  ${selectedCapabilities.includes(key)
                    ? 'border-[#e1ffa6] bg-[#e1ffa6]/5'
                    : 'border-gray-800 hover:border-gray-700'
                  }
                `}
              >
                <h3 className="font-medium mb-1">{name}</h3>
                <p className="text-sm text-gray-400">{description}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Model Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Base Model</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModel(model.id)}
                    className={`
                      p-4 rounded-lg border text-left transition-colors
                      ${selectedModel === model.id
                        ? 'border-[#e1ffa6] bg-[#e1ffa6]/5'
                        : 'border-gray-800 hover:border-gray-700'
                      }
                    `}
                  >
                    <h3 className="font-medium mb-1">{model.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge size="sm">{model.context.toLocaleString()} tokens</Badge>
                      <Badge size="sm" variant="success">
                        {model.speed.replace('_', ' ')}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedModel === 'custom' && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={customConfig.temperature}
                    onChange={(e) => setCustomConfig(prev => ({
                      ...prev,
                      temperature: parseFloat(e.target.value)
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Focused (0)</span>
                    <span>Balanced (1)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={customConfig.maxTokens}
                    onChange={(e) => setCustomConfig(prev => ({
                      ...prev,
                      maxTokens: parseInt(e.target.value)
                    }))}
                    className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Top P</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={customConfig.topP}
                      onChange={(e) => setCustomConfig(prev => ({
                        ...prev,
                        topP: parseFloat(e.target.value)
                      }))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Frequency Penalty</label>
                    <input
                      type="number"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={customConfig.frequencyPenalty}
                      onChange={(e) => setCustomConfig(prev => ({
                        ...prev,
                        frequencyPenalty: parseFloat(e.target.value)
                      }))}
                      className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Image</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-[#e1ffa6]"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-sm text-gray-400 mt-1">Leave empty to use a default image</p>
            </div>

            {imageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=500';
                  }}
                />
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            disabled={loading}
            icon={loading ? undefined : Bot}
          >
            {loading ? 'Creating Agent...' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Create;