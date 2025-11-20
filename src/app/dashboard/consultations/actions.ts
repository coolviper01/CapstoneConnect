'use server';

import { generateTalkingPoints, GenerateTalkingPointsInput } from '@/ai/flows/generate-talking-points';

export async function getTalkingPoints(input: Omit<GenerateTalkingPointsInput, 'projectDetails'>) {
  try {
    // The AI flow expects projectDetails, but the call from the component doesn't provide it.
    // We will provide a default or generic value for now.
    // A more robust solution would be to ensure projectDetails is always available in the consultation object.
    const fullInput = {
      ...input,
      projectDetails: 'Details about the capstone project.'
    };
    const { talkingPoints } = await generateTalkingPoints(fullInput);
    return { success: true, talkingPoints };
  } catch (error: any) {
    console.error('Error getting talking points:', error);
    return { success: false, error: error.message || 'Failed to generate talking points.' };
  }
}
