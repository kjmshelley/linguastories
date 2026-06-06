import { browsePage, browseRail, featuredSentence, groupItems, sentencePoster } from "../ui.js";

export function sentencesView({ state }) {
  const featured = state.sentences.find((sentence) => sentence.state === "Review") || state.sentences[0];
  const byTopic = Object.entries(groupItems(state.sentences, (sentence) => sentence.topic));
  const due = state.sentences.filter((sentence) => sentence.dueDate <= new Date().toISOString().slice(0, 10));
  const newSentences = state.sentences.filter((sentence) => sentence.state === "New");
  const rails = [
    browseRail("Due for review", due.length ? due : state.sentences.slice(0, 4), sentencePoster),
    browseRail("New sentences", newSentences.length ? newSentences : state.sentences.slice(0, 4), (sentence, index) => sentencePoster(sentence, index + 1)),
    ...byTopic.map(([topic, sentences], railIndex) => browseRail(topic, sentences, (sentence, index) => sentencePoster(sentence, index + railIndex + 2)))
  ].join("");

  return browsePage({
    eyebrow: "Sentence Library",
    title: featured?.target || "Sentence Library",
    description: featured?.translation || "Add sentence content to start building the library.",
    hero: featuredSentence(featured),
    rails
  });
}
