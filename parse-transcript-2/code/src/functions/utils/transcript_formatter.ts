/**
 * Interface for transcript entries with required name and text fields
 */
export interface TranscriptEntry {
  name: string;
  text: string;
  // Other fields like start_time, end_time, company, etc. can be added later as needed
}

/**
 * Formats the transcript JSON array into a new line delimited string
 * @param transcript - Array of transcript entries
 * @returns Formatted transcript as a string
 */
export function formatTranscript(transcript: TranscriptEntry[] | any[]): string {
  if (!Array.isArray(transcript)) {
    throw new Error('Input transcript must be an array');
  }

  return transcript
    .filter(
      (entry): entry is TranscriptEntry =>
        typeof entry === 'object' && entry !== null && typeof entry.name === 'string' && typeof entry.text === 'string'
    )
    .map((entry) => `${entry.name}: ${entry.text}`)
    .join('\n');
}
