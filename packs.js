// ---------------------------------------------------------------
// Word packs
// ---------------------------------------------------------------
// Each pack needs:
//   id          – unique, no spaces (used internally)
//   name        – shown on the pack card
//   description – optional short line under the name
//   words       – list of { en, nl } pairs
//
// `nl` can be a single string, or a list of strings if more than
// one Dutch answer should be accepted, e.g.
//   { en: "pretty", nl: ["mooi", "knap"] }
// The first item in the list is the one shown when you get it wrong.
//
// Answers are checked ignoring capitals, extra spaces and accents
// (so "een" is accepted for "één"). Articles (de/het) ARE checked.
//
// The packs below are placeholders – replace them with your own.
// ---------------------------------------------------------------

const PACKS = [
  {
    id: "greetings",
    name: "Greetings",
    description: "Everyday hellos and goodbyes",
    words: [
      { en: "hello", nl: ["hallo", "hoi"] },
      { en: "goodbye", nl: ["tot ziens", "doei"] },
      { en: "good morning", nl: "goedemorgen" },
      { en: "good evening", nl: "goedenavond" },
      { en: "thank you", nl: ["dank je", "dank je wel", "bedankt"] },
      { en: "please", nl: "alsjeblieft" },
      { en: "yes", nl: "ja" },
      { en: "no", nl: "nee" },
    ],
  },
  {
    id: "numbers",
    name: "Numbers 1–10",
    description: "Counting basics",
    words: [
      { en: "one", nl: "één" },
      { en: "two", nl: "twee" },
      { en: "three", nl: "drie" },
      { en: "four", nl: "vier" },
      { en: "five", nl: "vijf" },
      { en: "six", nl: "zes" },
      { en: "seven", nl: "zeven" },
      { en: "eight", nl: "acht" },
      { en: "nine", nl: "negen" },
      { en: "ten", nl: "tien" },
    ],
  },
];
