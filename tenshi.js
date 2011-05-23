(function(w, d){
	var apiAnime = 'http://kanade-api.appspot.com/v1/anime',
		malAnime = 'http://myanimelist.net/anime/',
		animeItemTmpl = '<li id="anime-{id}">'
			+ '<div class="img"><img src="{image}" width="50" height="70" alt=""></div>'
			+ '<h2><a href="{url}" target="_blank">{title}</a></h2>'
			+ '<span class="score {scoreColor}">{score}</span> '
			+ '<span class="episodes">{episodes} episodes</span>'
			+ '<div class="genres">{genres}</div>'
			+ '</li>',
		$cache = kizzy('animes'),
		$ = function(id){return d.getElementById(id)},
		$h = d.head || d.getElementsByTagName('head')[0],
		$script = function(url, fnName, fn, fail){
			var s = d.createElement('script');
			w[fnName] = function(){
				fn.apply(this, arguments);
				s.parentNode.removeChild(s);
				delete w[fnName];
			};
			s.async = 1;
			s.src = url;
			$h.insertBefore(s, $h.firstChild);
		},
		$sub = function(str, obj){
			return str.replace(/\\?\{([^{}]+)\}/g, function(match, name){
				if (match.charAt(0) == '\\') return match.slice(1);
				return (obj[name] != null) ? obj[name] : '';
			});
		},
		$top = function(){w.scrollTo(0, 0)},
		$seasons = null,
		$data = [],
		$ios = /ip(?:ad|od|hone)/.test(navigator.userAgent.toLowerCase()),
		$touch = 'ontouchend' in document,
		closeImageButton = $('close-image'),
		container = $('container'),
		blankDiv = $('blank'),
		seasonsSelect = $('seasons'),
		animesDiv = $('animes'),
		countDiv = $('count'),
		imageDiv = $('image'),
		page = {},
		scroll = {},
		pages = d.querySelectorAll('.page'),
		hash = location.hash.slice(1),
		noop = function(){},
		$hide = function(el){
			el.setAttribute('data-position', el.style.position);
			el.style.position = 'absolute';
			el.style.clip = 'rect(0, 0, 0, 0)';
		},
		$show = function(el){
			el.style.position = el.getAttribute('data-position') || '';
			el.style.clip = '';
		},
		loadAnimes = function(year, season){
			var animes = $seasons[year][season],
				i = 0, j = 0,
				l = animes.length,
				animesLeft = [],
				end = function(){
					if (j>=l){
						container.className = 'scroll';
						$show(seasonsSelect);
						$data.sort(function(a, b){
							return b.score - a.score;
						});
						var html = '';
						for (var n=0; n<l; n++){
							var o = $data[n],
								id = o.id,
								genres = o.genres,
								score = parseFloat(o.score, 10);
							html += $sub(animeItemTmpl, {
								id: id,
								url: malAnime + id,
								image: o.image.replace('.jpg', 't.jpg'),
								title: o.title,
								score: score.toFixed(2) || '?',
								scoreColor: score == 10 ? 'mad' : score >= 8 ? 'good' : score >= 6 ? 'ok' : '',
								episodes: parseInt(o.episodes, 10) || '?',
								genres: (genres || []).join(', ')
							});
						}
						animesDiv.innerHTML = html;
						countDiv.innerHTML = l + ' anime series.<br>Tip: Tap image to see larger version.';
						scroll.home.refresh();
						scroll.home.scrollTo(0, 0, 350);
					}
				},
				req = function(){
					if (i>=animesLeft.length) return;
					var anime = animesLeft[i],
						id = anime.split('/')[0],
						cb = 'a' + id,
						url = apiAnime + '?id=' + id + '&callback=' + cb,
						complete = function(o){
							if (!o) return;
							o.id = id;
							$data.push(o);
							j++;
							end();
						},
						comp = function(r){
							if (!r || !r.ok || !r.result){
								$script(url, cb, comp);
								return;
							}
							var o = r.result;
							complete(o);
							$cache.set(id, o, 6*60*60*1000); // 6 hours
						}
					$script(url, cb, comp);
					setTimeout(req, 250);
					i++;
				};
			
			$hide(blankDiv);
			$hide(seasonsSelect);
			$show(animesDiv);
			countDiv.innerHTML = '';
			container.className = 'scroll loading';
			animesDiv.innerHTML = '';
			$data = [];
			
			$top();
			
			for (var m=0; m<l; m++){
				var anime = animes[m],
					id = anime.split('/')[0],
					o = $cache.get(id);
				if (o){
					o.id = id;
					$data.push(o);
					j++;
				} else {
					animesLeft.push(anime);
				}
			}
			end();
			
			if (animesLeft.length) req();
		};
	
	for (var i=0, l=pages.length; i<l; i++){
		var p = pages[i],
			id = p.id.replace('page-', '');
		page[id] = p;
		var s = p.querySelector('.scroll');
		scroll[id] = $ios ? new iScroll(s, {
			hScroll: false
		}) : {refresh: noop, scrollTo: noop};
	}
	
	var loadPage = function(){
		var hash = location.hash.slice(1);
		if (/^animes/i.test(hash)){
			var hashes = hash.split('-'),
				year = hashes[1],
				season = hashes[2];
			loadAnimes(year, season);
			seasonsSelect.value = season + '-' + year;
		} else {
			$show(blankDiv);
			$show(seasonsSelect);
			$hide(animesDiv);
			countDiv.innerHTML = '';
			container.className = 'scroll';
			scroll.home.refresh();
		}
		closeImageButton.click();
	};
	w.addEventListener('hashchange', loadPage, false);
	
	if ($ios){
		var body = d.body,
			adjustHeight = function(){ // Totally hide the location bar
				body.style.height = screen.height + 'px';
				setTimeout(function(){
					$top();
					var height = w.innerHeight,
						offsetTop = d.querySelector('header').offsetHeight;
					for (var id in page){
						var p = page[id],
							s = p.querySelector('.scroll');
						p.style.height = height + 'px';
						s.style.height = s.firstElementChild.style.minHeight = (height - offsetTop) + 'px';
					}
					for (var id in scroll){
						scroll[id].refresh();
					}
				}, 50);
			};
		adjustHeight(true);
		d.addEventListener('touchend', $top, false);
		w.addEventListener('orientationchange', adjustHeight, false);
		seasonsSelect.addEventListener('focus', $top, false);
	}
	
	microAjax('seasons.json', function(r){
		r = JSON.parse(r);
		if (!r || !r.seasons) return;
		$seasons = r.seasons;
		var seasonsHTML = '';
		for (var year in $seasons){
			var seasons = $seasons[year];
			for (var season in seasons){
				seasonsHTML += '<option value="' + season + '-' + year + '">' + season.replace(/\b[a-z]/g, function(match){
					return match.toUpperCase();
				}) + ' ' + year + '</option>';
			}
		}
		seasonsSelect.innerHTML += seasonsHTML;
		var selectedIndex = 0;
		seasonsSelect.addEventListener('change', function(){
			$top();
			var index = seasonsSelect.selectedIndex;
			if (!index || index == selectedIndex){
				location.hash = '';
				return;
			}
			selectedIndex = index;
			var option = seasonsSelect.options[index],
				text = option.text.split(' '),
				year = parseInt(text[1], 10),
				season = text[0].toLowerCase();
			location.hash = 'animes-' + year + '-' + season;
		}, false);
		// Somehow this focus blur prevents the list from 'jumping' a little
		seasonsSelect.focus();
		seasonsSelect.blur();
		loadPage();
	});
	
	if ($touch){
		animesDiv.addEventListener('touchstart', function(e){
			var el = e.target,
				tagName = el.tagName;
			if (!tagName) return;
			tagName = tagName.toLowerCase();
			if (tagName == 'img'){
				el.style.opacity = .7;
				el.parentNode.style.backgroundColor = '#000';
			}
		}, false);
		var revert = function(e){
			var el = e.target,
			tagName = el.tagName;
			if (!tagName) return;
			tagName = tagName.toLowerCase();
			if (tagName == 'img'){
				el.style.opacity = 1;
				el.parentNode.style.backgroundColor = '';
			}
		};
		animesDiv.addEventListener('touchmove', revert, false);
		animesDiv.addEventListener('touchend', revert, false);
	}
	// the click event is specially modified by iScroll. Nice.
	animesDiv.addEventListener('click', function(e){
		var el = e.target,
			tagName = el.tagName;
		if (!tagName) return;
		tagName = tagName.toLowerCase();
		if (tagName == 'img'){
			var imageDiv = page.image;
			$show(imageDiv);
			imageDiv.className = 'page slideup in';
			
			var anime = $cache.get(el.parentNode.parentNode.id.split('-')[1]) || {title: ''},
				div = imageDiv.querySelector('.scroll div'),
				img = new Image(),
				src = anime.image,
				p = d.createElement('p');
			img.onload = function(){
				img.className = '';
				setTimeout(function(){
					scroll.image.refresh();
				}, 100);
			};
			img.onabort = img.onerror = function(){
				img.src = src + '?' + (+new Date());
			};
			img.src = src;
			img.alt = '';
			img.className = 'loading';
			p.innerHTML = imageDiv.querySelector('h1').innerHTML = anime.title;
			div.appendChild(img);
			div.appendChild(p);
			
			scroll.image.refresh();
		}
	}, false);
	tappable(closeImageButton, {
		noScroll: true,
		onTap: function(){
			$hide(seasonsSelect);
			var imageDiv = page.image;
			imageDiv.className = 'page slideup out reverse';
			setTimeout(function(){
				imageDiv.querySelector('.scroll div').innerHTML = '';
				$show(seasonsSelect);
			}, 350);
		}
	});
}(window, document));