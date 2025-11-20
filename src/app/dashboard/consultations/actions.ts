
'use server';

import { generateTalkingPoints, GenerateTalkingPointsInput } from '@/ai/flows/generate-talking-points';

export async function getTalkingPoints(input: GenerateTalkingPointsInput) {
  try {
    const { talkingPoints } = await generateTalkingPoints(input);
    return { success: true, talkingPoints };
  } catch (error: any) {
    console.error('Error getting talking points:', error);
    return { success: false, error: error.message || 'Failed to generate talking points.' };
  }
}
