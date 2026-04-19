import { NextResponse } from "next/server";
import { getDailyWord } from "@/lib/wordOfTheDay/getDailyWord";

interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: { definition: string }[];
}
interface DictionaryEntry {
  word: string;
  meanings: DictionaryMeaning[];
}

export interface WordOfTheDayResponse {
  word: string;
  definition: string;
  partOfSpeech: string;
}

const FALLBACK_DEFINITION = "A word to explore today.";
const FALLBACK_POS = "Word";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function GET() {
  const word = getDailyWord();

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { next: { revalidate: 86_400 } }
    );

    if (!res.ok) {
      return NextResponse.json<WordOfTheDayResponse>({
        word,
        definition: FALLBACK_DEFINITION,
        partOfSpeech: FALLBACK_POS,
      });
    }

    const entries = (await res.json()) as DictionaryEntry[];
    const firstMeaning = entries[0]?.meanings?.[0];
    const firstDefinition = firstMeaning?.definitions?.[0]?.definition;

    return NextResponse.json<WordOfTheDayResponse>({
      word,
      definition: firstDefinition ?? FALLBACK_DEFINITION,
      partOfSpeech: firstMeaning?.partOfSpeech
        ? capitalize(firstMeaning.partOfSpeech)
        : FALLBACK_POS,
    });
  } catch {
    return NextResponse.json<WordOfTheDayResponse>({
      word,
      definition: FALLBACK_DEFINITION,
      partOfSpeech: FALLBACK_POS,
    });
  }
}
