"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads or reloads.
 * It checks what is the current story list that must be shown:
 * all, favorites or my stories. */

async function showStoriesOnStart() {
  $storiesLoadingMsg.remove();
  hidePageComponents();
  if (localStorage.getItem("currentPage") === "favorites") {
    putFavoritesOnPage();
  } else if (localStorage.getItem("currentPage") === "myStories") {
    putMyStoriesOnPage();
  } else {
    await getAndPutStoriesOnPage();
  }
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, isOwnStory, isFavorite) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <span class="star">
          <i class="far fa-star"></i>
        </span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

async function getAndPutStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  storyList = await StoryList.getStories();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    let isOwnStory, isFavorite;
    if (currentUser) {
      isOwnStory = currentUser.ownStories.contains(story);
      isFavorite = currentUser.favorites.contains(story);
    } else {
      isOwnStory = false;
      isFavorite = false;
    }
    const $story = generateStoryMarkup(story, isOwnStory, isFavorite);
    $allStoriesList.append($story);
  }
  $allStoriesList.show();

  localStorage.setItem("currentPage", "main");
}

/** Get new story data from form, add story to backend and to DOM */

async function addNewStoryAndPutOnPage(evt) {
  evt.preventDefault();
  hidePageComponents();

  // debug print/s
  console.debug("add new form", evt);

  // grab the form values
  const title = $("#add-story-title").val();
  const author = $("#add-story-author").val();
  const url = $("#add-story-url").val();

  // reset form
  $loginForm.trigger("reset");

  // add story to the backend and create story instance in memory
  const story = await storyList.addStory(currentUser, {
    title,
    author,
    url,
  });

  // get updated user object from server

  // generate HTML for story
  const $story = generateStoryMarkup(story);

  // append story to the dom and show the updated story list
  $allStoriesList.append($story);

  // update the UI
  updateUIonNewStory();
}

$addStoryForm.on("submit", addNewStoryAndPutOnPage);

/** When a user submits a new story, update UI to hide form and show
 * the update story list */

function updateUIonNewStory() {
  console.debug("updateUIonNewStory");
  $addStoryForm.hide();
  $allStoriesList.show();
}

/** Put users favorites on page */
function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");

  $favoriteStories.empty();

  const isFavorite = true;
  let isOwnStory;

  // loop through all of the user favorite stories and generate HTML for them
  for (let story of currentUser.favorites.stories) {
    if (currentUser) {
      isOwnStory = currentUser.ownStories.contains(story);
    } else {
      isOwnStory = false;
    }
    const $story = generateStoryMarkup(story, isOwnStory, isFavorite);
    $favoriteStories.append($story);
  }

  $favoriteStories.show();

  localStorage.setItem("currentPage", "favorites");
}

/** Put users own stories on page */
function putMyStoriesOnPage() {
  console.debug("putMyStoriesOnPage");

  $myStories.empty();

  const isOwnStory = true;
  let isFavorite;

  // loop through all of the user own stories and generate HTML for them
  for (let story of currentUser.ownStories.stories) {
    if (currentUser) {
      isFavorite = currentUser.favorites.contains(story);
    } else {
      isFavorite = false;
    }
    const $story = generateStoryMarkup(story, isOwnStory, isFavorite);
    $myStories.append($story);
  }

  $myStories.show();

  localStorage.setItem("currentPage", "myStories");
}
