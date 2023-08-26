"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

async function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  await getAndPutStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

/** When user click the submit link in the navbar, shows the add story form */

function navSubmitStory() {
  hidePageComponents();
  console.debug("navSubmitStory");
  $addStoryForm.show();
}

$body.on("click", "#nav-submit", navSubmitStory);

/** When user clicks favorite stories, show favorites list */

async function navFavorites() {
  console.debug("navFavorites");

  hidePageComponents();
  await currentUser.refreshData();
  putFavoritesOnPage();
}

$body.on("click", "#nav-favorites", navFavorites);

/** When user clicks my stories, show my stories list */
async function navMyStories() {
  console.debug("navMyStories");

  hidePageComponents();
  await currentUser.refreshData();
  putMyStoriesOnPage();
}

$body.on("click", "#nav-my-stories", navMyStories);
