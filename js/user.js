"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */

/** Handle login form submission. If login ok, sets up the user instance */

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();

  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.login(username, password);

  $loginForm.trigger("reset");

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();
}

$loginForm.on("submit", login);

/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.signup(username, password, name);

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();

  $signupForm.trigger("reset");
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  location.reload();
}

$navLogOut.on("click", logout);

/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");

  $loginForm.hide();
  $signupForm.hide();
  $allStoriesList.show();
  updateNavOnLogin();
}

/** When a story star is click, decides if it has to be added
 * or deleted from user favorites*/

function favoriteClickHandler(evt) {
  console.debug("favoriteClickHandler");

  // Toggle star icon class between regular –far– and solid -fas-
  const star = $(this);
  star.toggleClass("far fas");

  // Get star icon's parent and id
  const story = star.parent();
  const storyId = story.attr("id");

  if (star.hasClass("fas")) {
    addFavoriteStory(storyId);
  } else {
    deleteFavoriteStory(storyId);
  }
}

$(document).on("click", ".star", starClickHandler);

/** Add a story to user's favorites */

async function addFavoriteStory(storyId) {
  console.debug("addFavoriteStory");

  const response = await axios({
    url: `${BASE_URL}/users/${currentUser.username}/favorites/${storyId}`,
    method: "POST",
    data: {
      token: currentUser.loginToken,
    },
  });
}

/** Delete favorite from user's favorites */

async function deleteFavoriteStory(storyId) {
  console.debug("deleteFavoriteStory");

  const response = await axios({
    url: `${BASE_URL}/users/${currentUser.username}/favorites/${storyId}`,
    method: "DELETE",
    data: {
      token: currentUser.loginToken,
    },
  });
}

async function updateUserOnChanges() {
  console.debug("updateUserOnChanges");

  const response = await axios({
    url: `${BASE_URL}/users/${currentUser.username}`,
    method: "GET",
    data: {
      token: currentUser.loginToken,
    },
  });

  currentUser = new User(response.data.user);
}
