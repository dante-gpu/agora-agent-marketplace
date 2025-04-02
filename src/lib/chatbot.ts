import { KeywordMap } from '../types/chat';

const responses: KeywordMap = {
  // Greetings
  hello: "Hello! I'm Beatrice, how can I help you today?",
  hi: "Hi there! What can I do for you?",
  hey: "Hey! How can I assist you?",
  
  // Questions
  "how are you": "I'm doing great, thanks for asking! How can I help you?",
  "what can you do": "I can help you with various tasks like answering questions, providing information, and assisting with basic tasks. What would you like to know?",
  
  // Programming
  javascript: "JavaScript is a versatile programming language primarily used for web development. Would you like to learn more about any specific aspect?",
  python: "Python is known for its simplicity and readability. It's great for beginners and powerful enough for experts. What would you like to know about Python?",
  react: "React is a popular JavaScript library for building user interfaces. It's component-based and very efficient. Need any specific React tips?",
  
  // Default responses
  default: [
    "I understand what you're asking. Could you rephrase that?",
    "Interesting question! Could you provide more details?",
    "I'm here to help! Could you be more specific?",
    "Let me know if you need any clarification on that.",
    "I'm processing your request. Could you elaborate a bit more?"
  ]
};

export function generateLocalResponse(input: string): string {
  // Convert input to lowercase for matching
  const lowercaseInput = input.toLowerCase();
  
  // Check for exact matches first
  for (const [key, response] of Object.entries(responses)) {
    if (lowercaseInput.includes(key)) {
      return typeof response === 'string' ? response : response[0];
    }
  }
  
  // If no match found, return a random default response
  const defaultResponses = responses.default as string[];
  const randomIndex = Math.floor(Math.random() * defaultResponses.length);
  return defaultResponses[randomIndex];
}

// Add more sophisticated response generation here
export function generateResponse(input: string): Promise<string> {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const response = generateLocalResponse(input);
      resolve(response);
    }, 500);
  });
}