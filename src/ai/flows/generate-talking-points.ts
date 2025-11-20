'use server';

/**
 * @fileOverview A talking point suggestion AI agent.
 *
 * - generateTalkingPoints - A function that handles the generation of talking points.
 * - GenerateTalkingPointsInput - The input type for the generateTalkingPoints function.
 * - GenerateTalkingPointsOutput - The return type for the generateTalkingPoints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTalkingPointsInputSchema = z.object({
  semester: z.string().describe('The semester for the consultation.'),
  academicYear: z.string().describe('The academic year for the consultation.'),
  capstoneTitle: z.string().describe('The title of the capstone project.'),
  blockGroupNumber: z.string().describe('The block or group number of the capstone project.'),
  date: z.string().describe('The date of the consultation.'),
  startTime: z.string().describe('The start time of the consultation.'),
  endTime: z.string().describe('The end time of the consultation.'),
  venue: z.string().describe('The venue of the consultation.'),
  projectDetails: z.string().describe('Detailed information about the capstone project.'),
});
export type GenerateTalkingPointsInput = z.infer<typeof GenerateTalkingPointsInputSchema>;

const GenerateTalkingPointsOutputSchema = z.object({
  talkingPoints: z.array(z.string()).describe('A list of suggested talking points for the consultation.'),
});
export type GenerateTalkingPointsOutput = z.infer<typeof GenerateTalkingPointsOutputSchema>;

export async function generateTalkingPoints(input: GenerateTalkingPointsInput): Promise<GenerateTalkingPointsOutput> {
  return generateTalkingPointsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTalkingPointsPrompt',
  input: {schema: GenerateTalkingPointsInputSchema},
  output: {schema: GenerateTalkingPointsOutputSchema},
  prompt: `You are an AI assistant designed to help advisors prepare for capstone project consultations.

  Based on the following capstone project details, suggest a list of talking points that the advisor should bring up during the consultation.

  Project Details: {{{projectDetails}}}

  Consultation Details:
  - Semester: {{{semester}}}
  - Academic Year: {{{academicYear}}}
  - Capstone Title: {{{capstoneTitle}}}
  - Block/Group Number: {{{blockGroupNumber}}}
  - Date: {{{date}}}
  - Start Time: {{{startTime}}}
  - End Time: {{{endTime}}}
  - Venue: {{{venue}}}

  Please provide the talking points as a numbered list.
  `,
});

const generateTalkingPointsFlow = ai.defineFlow(
  {
    name: 'generateTalkingPointsFlow',
    inputSchema: GenerateTalkingPointsInputSchema,
    outputSchema: GenerateTalkingPointsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
