"use strict";

/** Get and show stories when site first loads or reloads.
 * It checks what is the current story list that must be shown:
 * all, favorites or my stories. */

async function showStoriesOnStart() {
  storyList = await StoryList.getStories();
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
  console.debug("generateStoryMarkup");

  const hostName = story.getHostName();

  let typeOfStar;
  if (isFavorite) {
    typeOfStar = "fas";
  } else {
    typeOfStar = "far";
  }

  let canOrNotCan;
  if (isOwnStory && localStorage.getItem("currentPage") === "myStories") {
    canOrNotCan = "fas fa-trash-alt";
  } else {
    canOrNotCan = "";
  }

  let penOrNotPen;
  if (isOwnStory && localStorage.getItem("currentPage") === "myStories") {
    penOrNotPen = "fa-solid fa-pen-to-square";
  } else {
    penOrNotPen = "";
  }

  return $(`
      <li id="${story.storyId}">
        <span class="trash-can">
          <i class="${canOrNotCan}"></i>
        </span>
        <span class="star">
          <i class="${typeOfStar} fa-star"></i>
        </span>
        <span class="pen">
          <i class="${penOrNotPen}"></i>
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

  localStorage.setItem("currentPage", "main");

  if (!storyList.stories) {
    $allStoriesList.append("<h5>No stories available. Try submittin one!<h5>");
    $allStoriesList.show();
    return;
  }

  $allStoriesList.append("<h1>Stories<h1>");

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
  $addStoryForm[0].reset();
  $allStoriesList.show();
}

/** Put users favorites on page */
function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");

  $favoriteStories.empty();

  localStorage.setItem("currentPage", "favorites");

  if (currentUser.favorites.stories.length === 0) {
    $favoriteStories.append("<h5>You haven't added any favorites yet.<h5>");
    $favoriteStories.show();
    return;
  }

  $favoriteStories.append("<h1>Favorites<h1>");

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
}

/** Put users own stories on page */
async function putMyStoriesOnPage() {
  console.debug("putMyStoriesOnPage");

  $myStories.empty();

  localStorage.setItem("currentPage", "myStories");

  $myStories.append("<h1>My Stories<h1>");

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
}

/** When user clicks pen, shows update story form and populate it with the
 * up-to-date story data.
 */
async function getUpdateStoryFormClickHandler() {
  console.debug("showUpdateStoryForm");

  hidePageComponents();

  // get stories from server to avoid an undefined storyList object
  // in case of previous page refresh
  storyList = await StoryList.getStories();

  // get trash icon's parent story and id
  const story = $(this).parent().parent();
  const storyId = story.attr("id");

  // get story updated info from API
  const storyFreshData = await Story.getStory(storyId);

  // find and populate all the fields in the update story form as well
  // as store the storyId as a form data attribute
  $updateStoryForm.attr("data-story-id", storyId);
  $updateStoryForm.find("#update-story-title").val(storyFreshData.title);
  $updateStoryForm.find("#update-story-author").val(storyFreshData.author);
  $updateStoryForm.find("#update-story-url").val(storyFreshData.url);

  $updateStoryForm.show();
}

$(document).on("click", ".fa-pen-to-square", getUpdateStoryFormClickHandler);

async function updateStoryAndRefreshUI(evt) {
  evt.preventDefault();
  console.log("updateStoryAndRefreshUI");

  hidePageComponents();

  const storyId = $updateStoryForm.attr("data-story-id");

  // get the story data from the form and construct the data object
  const storyData = {
    title: $updateStoryForm.find("#update-story-title").val(),
    author: $updateStoryForm.find("#update-story-author").val(),
    url: $updateStoryForm.find("#update-story-url").val(),
  };

  console.log(storyId, storyData);
  await storyList.updateStory(storyId, storyData);
  $updateStoryForm[0].reset();
  await currentUser.refreshData();
  await showStoriesOnStart();
}

$(document).on("submit", "#update-story-form", updateStoryAndRefreshUI);
