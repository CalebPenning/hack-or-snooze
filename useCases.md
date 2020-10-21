# Use Cases for Hack or Snooze:

1. Provide an easy-to-navigate UI. Story headlines take up most of their respective space on the page, then the author of the story, host website, and finally the user that posted it. Sharing and discovering stories is the main focus of this application, and it should show.

2. Basic sign-up/log-in/out functionality. Be able to make a unique account with a unique auth token that grants certain features, listed below.
Stay logged-in via local storage unless user explicity logs out for convenience of the poster.

3. Ability to favorite and unfavorite stories. Make it easier for users to find stories they found noteworthy later on with further visits. Prevents a tiresome user experience and redundancy.

4. Ability to view stories ONLY posted by the current logged-in user. 
Users can view their catalog of posts, and have the ability to delete them if they want to. Good for posters of on-going stories, posters who may have posted something regretable, irrelevant, or posters who just want to delete something from time to time. (Most users) 
Grants more freedom to users and boosts their experience. 


# Possibilities to explore:

1. The Power User:

How can the application handle users who LOVE the platform, and can't help but post and favorite and click and delete to their heart's content? What happens when there are over 25 stories to pull from? 

We would need to incorporate multiple pages or an "endless/infinite" scroll feature to keep GETting stories from our API.

User does this, thing happens. Lifecycle of the application. What happens with each user action?