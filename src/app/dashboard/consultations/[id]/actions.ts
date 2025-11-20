'use server';

import { generateTalkingPoints as generateTalkingPointsAI, GenerateTalkingPointsInput } from '@/ai/flows/generate-talking-points';

export async function getTalkingPoints(input: GenerateTalkingPointsInput) {
  try {
    const output = await generateTalkingPointsAI(input);
    return { success: true, talkingPoints: output.talkingPoints };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to generate talking points." };
  }
}
