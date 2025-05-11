/**
 * Interface for transcript entries with required name and text fields
 */
interface TranscriptEntry {
  name: string;
  text: string;
  // Other fields like start_time, end_time, company, etc. can be added later as needed
}

/**
 * Formats the transcript JSON array into a new line delimited string
 * @param transcript - Array of transcript entries
 * @returns Formatted transcript as a string
 */
function formatTranscript(transcript: TranscriptEntry[] | any[]): string {
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

// Sample transcript data for testing
const sampleTranscript = [
  {
    company: 'DevRev',
    end_time: '2024-04-08T10:00:05Z',
    name: 'John',
    start_time: '2024-04-08T10:00:00Z',
    text: 'Hello, how can I help you today?',
  },
  {
    company: 'Customer',
    end_time: '2024-04-08T10:00:10Z',
    name: 'Alice',
    start_time: '2024-04-08T10:00:06Z',
    text: "I'm having trouble with my account login.",
  },
  {
    company: 'DevRev',
    end_time: '2024-04-08T10:00:15Z',
    name: 'John',
    start_time: '2024-04-08T10:00:11Z',
    text: "I'll help you with that right away.",
  },
];

// Test the formatter with sample data
console.log('Testing with sample data:');
console.log(formatTranscript(sampleTranscript));
console.log('\n-------------------\n');

// Test with empty array
console.log('Testing with empty array:');
console.log(formatTranscript([]));
console.log('\n-------------------\n');

// Test with missing fields
console.log('Testing with missing fields:');
const incompleteTranscript = [
  { name: 'John' }, // Missing text
  { text: 'Hello' }, // Missing name
  { name: 'Alice', text: 'Hi there' }, // Complete entry
];
console.log(formatTranscript(incompleteTranscript));
console.log('\n-------------------\n');

// Expected output from the sample data
const expectedOutput = `John: Hello, how can I help you today?
Alice: I'm having trouble with my account login.
John: I'll help you with that right away.`;

console.log('Does the output match expected format?', formatTranscript(sampleTranscript) === expectedOutput);
