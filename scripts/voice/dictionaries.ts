/**
 * Create (or re-create after an edit) the `skanyx-en` pronunciation
 * dictionary and print the ids to pin in .env. Rules are case-sensitive and
 * the first match wins, so longer strings come first.
 *
 * Skanyx = /ˈskænɪks/ ("SKAN-iks"), owner decision 2026-10-26.
 * Phoneme rules apply on eleven_v4 (and English on v2); the alias rows are
 * the fallback for models that ignore phonemes.
 *
 *   npm run voice:dictionaries
 */
import { createDictionary, type DictionaryRule } from "./elevenlabs";

export const englishRules: DictionaryRule[] = [
  { type: "phoneme", string_to_replace: "Skanyx", phoneme: "ˈskænɪks", alphabet: "ipa" },
  { type: "phoneme", string_to_replace: "SKANYX", phoneme: "ˈskænɪks", alphabet: "ipa" },
  { type: "phoneme", string_to_replace: "skanyx", phoneme: "ˈskænɪks", alphabet: "ipa" },
  { type: "alias", string_to_replace: "OBD-II", alias: "O B D two" },
  { type: "alias", string_to_replace: "OBD2", alias: "O B D two" },
  { type: "alias", string_to_replace: "OBD", alias: "O B D" },
  { type: "alias", string_to_replace: "ELM327", alias: "E L M three two seven" },
  { type: "alias", string_to_replace: "PPI", alias: "P P I" },
  { type: "alias", string_to_replace: "DPF", alias: "D P F" },
  { type: "alias", string_to_replace: "EGR", alias: "E G R" },
  { type: "alias", string_to_replace: "ECU", alias: "E C U" },
  { type: "alias", string_to_replace: "VIN", alias: "V I N" },
];

const main = async () => {
  const d = await createDictionary("skanyx-en", englishRules, "Skanyx studio: brand + acronyms, English");
  console.log(`Created ${d.name}`);
  console.log(`ELEVENLABS_DICTIONARY_ID=${d.id}`);
  console.log(`ELEVENLABS_DICTIONARY_VERSION_ID=${d.version_id}`);
  console.log("Paste both into .env.");
};

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
}
