import { HfInference } from '@huggingface/inference';

// Initialize the Hugging Face Inference client with a token
const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);  // Using a valid token

// Use DialoGPT-medium for better responses while still being relatively fast
const MODEL_ID = 'microsoft/DialoGPT-medium';

export async function generateResponse(message: string): Promise<string> {
  try {
    // Use conversational task instead of text generation
    const response = await hf.conversational({
      model: MODEL_ID,
      inputs: {
        text: message,
        past_user_inputs: [],
        generated_responses: []
      },
      parameters: {
        temperature: 0.7,
        max_length: 150,
        top_p: 0.9,
        repetition_penalty: 1.2
      }
    });

    // Return the generated response
    return response.generated_text || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response. Please check your Hugging Face token and try again.');
  }
}