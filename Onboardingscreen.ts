import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const OutfitGenerator = () => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState(null);
  const [error, setError] = useState(null);

  const generateGPTPrompt = (userDescription) => `
    Create a detailed outfit description and a DALL-E prompt based on this request: "${userDescription}"
    
    Provide your response in the following format:
    Description: [detailed outfit description]
    DALL-E Prompt: [optimized prompt for image generation]
  `;

  const callGPT4 = async (userDescription) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{
            role: "user",
            content: generateGPTPrompt(userDescription)
          }],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        throw new Error('GPT-4 API call failed');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse the response
      const description = content.match(/Description: (.*?)(?=DALL-E Prompt:|$)/s)?.[1].trim();
      const dallePrompt = content.match(/DALL-E Prompt: (.*?)$/s)?.[1].trim();

      return { description, dallePrompt };
    } catch (error) {
      throw new Error('Failed to generate outfit description');
    }
  };

  const generateImage = async (prompt) => {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        })
      });

      if (!response.ok) {
        throw new Error('DALL-E API call failed');
      }

      const data = await response.json();
      return data.data[0].url;
    } catch (error) {
      throw new Error('Failed to generate image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // First, get the outfit description and DALL-E prompt from GPT-4
      const { description, dallePrompt } = await callGPT4(userInput);
      
      // Then, generate the image using DALL-E
      const imageUrl = await generateImage(dallePrompt);
      
      setGeneratedOutfit({
        description,
        imagePrompt: dallePrompt,
        imageUrl
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Outfit Generator</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="outfitDescription" 
                className="block text-sm font-medium mb-2"
              >
                Describe the outfit you want
              </label>
              <textarea
                id="outfitDescription"
                className="w-full min-h-24 p-2 border rounded-md"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="E.g., A professional outfit for a job interview in the tech industry"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Outfit'
              )}
            </Button>
          </form>

          {generatedOutfit && (
            <div className="mt-8 space-y-4">
              <div className="aspect-square w-full bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={generatedOutfit.imageUrl}
                  alt="Generated outfit"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Outfit Description:</h3>
                  <p className="text-gray-600">{generatedOutfit.description}</p>
                </div>
                <div>
                  <h3 className="font-medium">Image Generation Prompt:</h3>
                  <p className="text-gray-600">{generatedOutfit.imagePrompt}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OutfitGenerator;