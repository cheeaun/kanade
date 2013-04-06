Kanade
======

Kanade is a mobile web app that shows a list of anime series for every season. It allows easy comparison of every series and lets you quickly decide which one to watch. You can compare the anime series by the scores, genres, episode count and cover image.

Kanade looks like this:

![Screenshot](https://github.com/cheeaun/kanade/raw/master/screenshot.png)

Technical Stuff
---------------

Kanade is primarily optimized for Mobile Safari though it may work on other mobile and desktop browsers as well. It uses the [Kanade API](https://github.com/cheeaun/kanade-api) for data. Scripts used are:

- [microajax](http://code.google.com/p/microajax/)
- [iScroll](https://github.com/cubiq/iscroll)
- [Kizzy](https://github.com/ded/Kizzy)
- [tappable](https://github.com/cheeaun/tappable)

Development Stuff
-----------------

- Prerequisites

        git clone git://github.com/cheeaun/kanade.git
        cd kanade/
        npm install

- [Grunt](http://gruntjs.com/) tasks

    - Concatenate and minify JS files

            grunt uglify

    - Start a local server

            grunt connect

- Simple app (web page + server) to search for animes in [MyAnimeList.net](http://myanimelist.net/)

        node search/server.js

Contributing
------------

Feel free to fork and improve Kanade. One of the files that needs most attention is `seasons.json` which stores data of lists of anime series for every season, so contributing these would be super awesome.