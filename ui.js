$(async function() {
  // cache some selectors we'll be using quite a bit
  const $body = $("body");
  const $allStoriesList = $("#all-articles-list");
  const $navFavorites = $("#nav-favorite-stories");
  const $favoritedStories = $("#favorited-articles");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $profileName = $("#profile-name");
  const $profileUsername = $("#profile-username");
  const $acctData = $("#profile-account-date");
  const $navUserInfo = $("#nav-user-profile");
  const $submitStory = $("#nav-submit-story");

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
    $favoritedStories.hide();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      // First load the nav-bar for logged-in user
      showNavForLoggedInUser();
      updateUserInfo();
    }
  }

  // Opens form to submit a new story

  $submitStory.on("click", function() {
    if (currentUser) {
      hideElements();
      $allStoriesList.show();
      $submitForm.slideToggle();
    }
  })

  // Opens hidden section for user's Favorited Stories

  $body.on("click", "#nav-favorite-stories", function() {
    hideElements();
    if (currentUser) {
      getFaves();
      $favoritedStories.show();
    }
  }); 

  // Opens hidden section for stories that the user has submitted

  $body.on('click', "#nav-my-stories", function() {
    hideElements();
    if (currentUser) {
      $navUserInfo.hide();
      generateMyStories();
      $ownStories.show();
      $favoritedStories.hide();
    }
  });

  // Allows user to delete one of their own stories

  $ownStories.on("click", ".fa-times", async function(e) {
    // Get the closest Li to the story, and id of story
    const $closestLi = $(e.target).closest("li");
    const storyId = $closestLi.attr("id");

    // Remove the story 
    await storyList.removeStory(currentUser, storyId);

    // Get the story list again
    await generateStories();

    // hide everything
    hideElements();

    // then show the story list 
    $allStoriesList.show();
  })

  // When submitting a new story, this handler takes all values input by the user
  // It adds the story object to the Story List
  // then converts it into a new element and finally appends it to the dom
  $submitForm.on("submit", async function(e) {
    // Prevent page refresh
    e.preventDefault();
    // Get values from inputs, user, and url
    const author = $("#author").val();
    const title = $("#title").val();
    const url = $("#url").val();
    const username = currentUser.username;
    const hostName = getHostName(url);

    // Add story object to story list
    const storyObj = await storyList.addStory(currentUser, {
      title,
      author,
      url,
      username
    });

    // Create new list item with information from the story object
    const $li = $(`
    <li id="${storyObj.storyId}" class="id-${storyObj.storyId}">
      <span class="star">
        <i class="far fa-star"></i>
      </span>
      <a class="article-link" href="${url}" target="a_blank">
        <strong>${title}</strong>
      </a>
      <small class="article-hostname ${hostName}">(${hostName})</small>
      <small class="article-author">by ${author}</small>
      <small class="article-username">Posted by ${username}</small>
    </li>
    `);
    // Append story to top of storylist, hide form and reset the fields
    $allStoriesList.prepend($li);
    $submitForm.slideToggle();
    $submitForm.trigger("reset");
  });

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
    // update profile at bottom of page, add more to navbar
    updateUserInfo();
  }

  function updateUserInfo() {
    // Then update the profile information at the bottom of the page
    $profileName.text(`Name: ${currentUser.name}`);
    $profileUsername.text(`Username: ${currentUser.username}`);
    $acctData.text(`Profile Created: ${currentUser.createdAt}`);
    // Then update the welcome section of the navbar and make it visible
    $navUserInfo.text(`Welcome, ${currentUser.username}`);
    $navUserInfo.show();
    $("#nav-welcome").show();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    console.log(storyListInstance)
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  // Generates the content of the My Stories tab
  function generateMyStories() {
    $ownStories.empty();
    // If the user hasn't posted anything, let them know. 
    if (currentUser.ownStories.length === 0) {
      $ownStories.append("<h3>You haven't added any stories yet!</h3>");
    } else {
      // Otherwise, loop through the user's stories, 
      // Generate the html with the "true" passed in to add a delete button (see full function for details)
      // Append the stories to the tab
      for (let story of currentUser.ownStories) {
        let ownStory = generateStoryHTML(story, true);
        $ownStories.append(ownStory);
      }
    }
  }

  // Event handler for favoriting stories

  $(".articles-container").on("click", ".star", async function(e) {
    if (currentUser) {
      // Get the story id from clicking the specific Li
      const $target = $(e.target);
      const $closestLi = $target.closest("li");
      const storyId = $closestLi.attr("id");

      // If the star is already the filled star (fas), 
      // remove the story from the user's favorites
      // and toggle the class to represent the visual change
      // Otherwise, the opposite is done
      if ($target.hasClass("fas")) {
        await currentUser.removeFavorite(storyId);
        $target.closest("i").toggleClass("fas far");
      } else {
        await currentUser.addFavorite(storyId);
        $target.closest("i").toggleClass("fas far");
      }
    }
  })

  // Checks for user favorites by mapping over 
  function checkForFavorites(story) {
    let favStories = new Set();
    // Populates new set with Ids of stories that have been favorited by user
    if (currentUser) {
      favStories = new Set(currentUser.favorites.map(obj => obj.storyId));
      console.log(favStories)
    }
    // returns true if the Set contains that story Id, else... 
    return favStories.has(story.storyId);
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story, isOwnStory) {
    // Get host name
    let hostName = getHostName(story.url);
    // If story is in favorites, it will be given a class "fas", which is a filled star
    // Other wise it is "far", the empty star
    let starType = checkForFavorites(story) ? "fas" : "far";
    // When we check for our own stories, a boolean True is passed to give us this delete button.
    // All other stories should not have one present
    const removeBtn = isOwnStory 
    ? `<span class="remove-btn">
        <i class="fas fa-times"></i>
      </span>` 
    : "";
    
    // Store markup with story-specific attributes in a variable, return it
    const storyMarkup = $(`
      <li id="${story.storyId}">
        ${removeBtn}
        <span class="star">
          <i class="${starType} fa-star"></i>
        </span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  // Get list of favorited stories, append to favorite stories tab
  function getFaves() {
    $favoritedStories.empty();

    if (currentUser.favorites.length === 0) {
      $favoritedStories.append("<h3>No favorite stories have been added.</h3>");
    } else {  
      for (let story of currentUser.favorites) {
        let favoriteHTML = generateStoryHTML(story, false);
        $favoritedStories.append(favoriteHTML);
      }
    }
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
