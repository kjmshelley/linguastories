import { browsePage, browseRail, featuredStory, groupItems, storyPoster } from "../ui.js";

export function storiesView({ state }) {
  const featured = state.stories.find((story) => story.unlocked && !story.completed) || state.stories[0];
  const byTopic = Object.entries(groupItems(state.stories, (story) => story.topic));
  const unlocked = state.stories.filter((story) => story.unlocked);
  const locked = state.stories.filter((story) => !story.unlocked);
  const rails = [
    browseRail("Continue reading", unlocked.length ? unlocked : state.stories.slice(0, 4), storyPoster),
    browseRail("Unlock next", locked, (story, index) => storyPoster(story, index + 1)),
    ...byTopic.map(([topic, stories], railIndex) => browseRail(topic, stories, (story, index) => storyPoster(story, index + railIndex + 2)))
  ].join("");

  return browsePage({
    eyebrow: "Stories",
    title: featured?.title || "Stories",
    description: featured?.translation || "Add story content to start building the catalog.",
    hero: featuredStory(featured),
    rails
  });
}
