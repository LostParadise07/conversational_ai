import axios from 'axios';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;


export async function getChatGPTResponse(prompt: string): Promise<string> {
    try {
        const precisePrompt = `You're in an interview, use simple english. Provide a concise and precise answer. Provide like normal person would answer. ${prompt}`;
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'mistralai/mistral-7b-instruct:free',
            messages: [
              { role: 'user', content: precisePrompt }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'http://localhost:5173',
              'X-Title': 'Vue Speech App' 
            }
          }
        );
    
        return response.data.choices[0].message.content;
      } catch (error) {
        console.error('Mistral API error:', error);
        return 'Sorry, something went wrong.';
      }
  }
  

