# How to contribute to the Knowledge Base

*(Or any git project for that matter...)*

*- Written by [@phulelouch](https://www.linkedin.com/in/harvey-spec-a7a865209/)*

If you get stuck with any of the steps below, don't hesitate to shout out on #devops for a hand, there are plenty of people willing to help!

**Note:** Anywhere that you see the `<` or `>` characters, those are for you to swap out with something (do not keep the brackets).


### Prerequisites
For this recipe we are going to need a few basic ingredients:
* You will to [create a Github account](https://github.com/join) if you don't have one already.
* Make sure you have `git` [installed on your computer](https://gist.github.com/derhuerst/1b15ff4652a867391f03).
* A working internet connection.
* 10 minutes of free time.

<br class="spacer"/>


### Set up a local working copy
First we need to [fork](https://help.github.com/en/articles/fork-a-repo) the official Github repository so that we can develop our new features under our own account.

* Browse to the repository and click the *Fork* button.

* Copy the URL for your newly forked repository (make sure you're copying your personal repository, not the URL for the official one).

* Now in a terminal, use the `git clone` command to download a copy of your new forked repository.
```
git clone <YOUR URL>
```

* Change directories into your newly created local repo
```
cd `to the project folder`
```



### Add your profile to the KB
First thing's first, lets add your personal profile to the KB so that your article will link to your deets, and people can easily find all of your awesome contributions!

* Start by creating a new branch for the feature you're adding.

* It is good practice to never push straight to the master branch. Name your new branch something that makes sense.*
```
git checkout -b new_profile
```


* Index the new file you've just created, staging it for the next commit.
```
git add -A
```

* Commit your changes to your branch, with a meaningful message for the changes you have made.
```
git commit -m "added <your handle> kb profile"
```

* Now push the changes to your remote origin repository! (Enter your github username & password when prompted)
```
git push origin <branch name>
```


### Make that pull request!

Finally, make a pull request to the upstream repository. This is a request for the maintainers of the official repository to accept your changes and merge them into the main repo!

* Browse to your forked repository (same URL that you `git clone`'d), make sure your new branch is selected, then hit "New pull request"

* Fill in a meaningful title & description, review the changes you are pushing by scrolling down, then finally hit the "Create pull request" button!

Once your pull request has been made, you will have to wait until one of the official maintainers approves the request to merge your branch into the upstream repository. So sit tight, they'll get to it soon!

<br class="spacer"/>


* Make a pull request to the upstream repo

Now we sit back, relax and wait for the contributors to approve your Pull Request.
Check back later and if they haven't budged, maybe give them a nudge on #devops
