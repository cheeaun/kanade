(function(w, d){
	var apiAnime = 'http://kanade-api.appspot.com/v1/anime',
		malAnime = 'http://myanimelist.net/anime/',
		animeItemTmpl = '<li id="anime-{id}">'
			+ '<div class="img" style="background-image: url({image})" data-image="{image}"></div>'
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
		$scroll = $ios ? new iScroll('container') : { refresh: function(){} },
		$imgScroll = $ios ? new iScroll('image') : { refresh: function(){} },
		backButton = $('back'),
		container = $('container'),
		blankDiv = $('blank'),
		seasonsSelect = $('seasons'),
		spinner = $('spinner'),
		animesDiv = $('animes'),
		progressDiv = $('progress'),
		sortSelect = $('sort'),
		countDiv = $('count'),
		imageDiv = $('image'),
		loadAnimes = function(year, season){
			var animes = $seasons[year][season],
				i = 0, j = 0,
				l = animes.length,
				html = '',
				animesLeft = [],
				end = function(){
					if (j>=l){
						sortSelect.style.display = 'block';
						seasonsSelect.style.display = '';
						spinner.style.display = 'none';
						countDiv.innerHTML = l + ' anime series.<br>Tip: Tap image to see larger version.';
						$scroll.refresh();
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
							var genres = o.genres,
								score = parseFloat(o.score, 10);
							o.id = id;
							$data.push(o);
							animesDiv.innerHTML += $sub(animeItemTmpl, {
								id: id,
								url: malAnime + anime,
								image: o.image.replace('.jpg', 't.jpg'),
								title: o.title,
								score: score.toFixed(2) || '?',
								scoreColor: score >= 8 ? 'good' : score >= 6 ? 'ok' : '',
								episodes: parseInt(o.episodes, 10) || '?',
								genres: (genres || []).join(', ')
							});
							$scroll.refresh();
							progressDiv.style.width = Math.round(++j/l*100) + '%';
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
			
			if (blankDiv){
				blankDiv.parentNode.removeChild(blankDiv);
				blankDiv = null;
			}
			sortSelect.selectedIndex = 0;
			sortSelect.style.display = 'none';
			seasonsSelect.style.display = 'none';
			spinner.style.display = 'block';
			countDiv.innerHTML = '';
			progressDiv.style.width = '0';
			$data = [];
			
			$top();
			
			for (var m=0; m<l; m++){
				var anime = animes[m],
					id = anime.split('/')[0],
					o = $cache.get(id);
				if (o){
					o.id = id;
					$data.push(o);
					var genres = o.genres,
						score = parseFloat(o.score, 10);
					html += $sub(animeItemTmpl, {
						id: id,
						url: malAnime + anime,
						image: o.image.replace('.jpg', 't.jpg'),
						title: o.title,
						score: score.toFixed(2) || '?',
						scoreColor: score >= 8 ? 'good' : score >= 6 ? 'ok' : '',
						episodes: parseInt(o.episodes, 10) || '?',
						genres: (genres || []).join(', ')
					});
					j++;
				} else {
					animesLeft.push(anime);
				}
			}
			animesDiv.innerHTML = html;
			progressDiv.style.width = Math.round(j/l*100) + '%';
			end();
			
			if (animesLeft.length) req();
		};
	
	if ($ios){
		var body = d.body,
			adjustHeight = function(){ // Totally hide the location bar
				body.style.height = screen.height + 'px';
				setTimeout(function(){
					$top();
					var height = w.innerHeight,
						offsetTop = d.querySelector('header').offsetHeight;
					body.style.height = height;
					container.style.height = container.firstElementChild.style.minHeight = (height - offsetTop) + 'px';
					imageDiv.style.height = imageDiv.firstElementChild.style.minHeight = (height - offsetTop) + 'px';
					$scroll.refresh();
					$imgScroll.refresh();
				}, 50);
			};
		adjustHeight(true);
		d.addEventListener('touchend', $top, false);
		w.addEventListener('orientationchange', adjustHeight, false);
		d.querySelector('header h1').addEventListener($touch ? 'touchend' : 'click', function(e){
			$scroll.scrollTo(0, 0, 250);
		}, false);
		d.addEventListener('scroll', function(){
			if (w.pageYOffset == 0){
				$scroll.scrollTo(0, 0, 250);
				$imgScroll.scrollTo(0, 0, 250);
			}
		}, false);
	}
	
	microAjax('seasons.json', function(r){
		r = JSON.parse(r);
		if (!r || !r.seasons) return;
		$seasons = r.seasons;
		var seasonsHTML = '';
		for (var year in $seasons){
			var seasons = $seasons[year];
			for (var season in seasons){
				seasonsHTML += '<option>' + season.replace(/\b[a-z]/g, function(match){
					return match.toUpperCase();
				}) + ' ' + year + '</option>';
			}
		}
		seasonsSelect.innerHTML += seasonsHTML;
		var selectedIndex = 0;
		seasonsSelect.addEventListener('change', function(){
			$top();
			var index = seasonsSelect.selectedIndex;
			if (!index || index == selectedIndex) return;
			selectedIndex = index;
			var option = seasonsSelect.options[index],
				text = option.text.split(' '),
				year = parseInt(text[1], 10),
				season = text[0].toLowerCase();
			loadAnimes(year, season);
		}, false);
	});
	
	var selectedSort = 0;
	sortSelect.selectedIndex = 0;
	sortSelect.addEventListener('change', function(){
		$top();
		var index = sortSelect.selectedIndex;
		if (!$data.length) return;
		if (!index){
			selectedSort = 0;
			return;
		}
		if (index == selectedSort) return;
		selectedSort = index;
		var option = sortSelect.options[index],
			text = option.text.toLowerCase(),
			sort = function(){},
			html = '';
		switch (text){
			case 'score':
				sort = function(a, b){
					return b.score - a.score;
				};
				break;
			default:
				sort = function(a, b){
					var at = a.title.toLowerCase(),
						bt = b.title.toLowerCase();
					if (at < bt) return -1;
					if (at > bt) return 1;
					return 0;
				}
		}
		$data.sort(sort);
		for (var i=0, l=$data.length; i<l; i++){
			var o = $data[i],
				id = o.id,
				score = o.score,
				genres = o.genres;
			html += $sub(animeItemTmpl, {
				id: id,
				url: malAnime + id,
				image: o.image.replace('.jpg', 't.jpg'),
				title: o.title,
				score: score.toFixed(2) || '?',
				scoreColor: score >= 8 ? 'good' : score >= 6 ? 'ok' : '',
				episodes: parseInt(o.episodes, 10) || '?',
				genres: (genres || []).join(', ')
			})
		}
		animesDiv.innerHTML = html;
		$scroll.refresh();
	}, false);
	
	if ($touch){
		animesDiv.addEventListener('touchstart', function(e){
			var el = e.target,
				tagName = el.tagName;
			if (!tagName) return;
			tagName = tagName.toLowerCase();
			if (tagName == 'div' && el.className == 'img'){
				el.style.opacity = .6;
			}
		}, false);
		animesDiv.addEventListener('touchend', function(e){
			var el = e.target,
			tagName = el.tagName;
			if (!tagName) return;
			tagName = tagName.toLowerCase();
			if (tagName == 'div' && el.className == 'img'){
				el.style.opacity = 1;
			}
		}, false);
	}
	// the click event is specially modified by iScroll. Nice.
	animesDiv.addEventListener('click', function(e){
		var el = e.target,
			tagName = el.tagName;
		if (!tagName) return;
		tagName = tagName.toLowerCase();
		if (tagName == 'div' && el.className == 'img'){
			container.style.clip = 'rect(0, 0, 0, 0)';
			seasonsSelect.style.display = 'none';
			sortSelect.style.display = 'none';
			backButton.style.display = 'block';
			imageDiv.style.clip = 'auto';
			
			var anime = $cache.get(el.parentNode.id.split('-')[1]) || {title: ''},
				div = imageDiv.firstChild,
				img = new Image(),
				src = el.getAttribute('data-image').replace('t.jpg', '.jpg'),
				p = d.createElement('p');
			img.onload = function(){
				setTimeout(function(){
					$imgScroll.refresh();
				}, 100);
				spinner.style.display = 'none';
			};
			img.onabort = img.onerror = function(){
				img.src = src + '?' + (+new Date());
				spinner.style.display = 'none';
			};
			img.src = src;
			img.alt = '';
			p.innerHTML = anime.title;
			div.appendChild(img);
			div.appendChild(p);
			
			spinner.style.display = 'block';
			
			$imgScroll.refresh();
		}
	}, false);
	backButton.addEventListener($touch ? 'touchend' : 'click', function(e){
		e.preventDefault();
		container.style.clip = 'auto';
		backButton.style.display = 'none';
		spinner.style.display = 'none';
		imageDiv.style.clip = 'rect(0, 0, 0, 0)';
		imageDiv.firstChild.innerHTML = '';
		setTimeout(function(){
			seasonsSelect.style.display = 'block';
			sortSelect.style.display = 'block';
			$scroll.refresh();
		}, 200);
	}, false);
	if ($touch) backButton.addEventListener('click', function(e){
		e.preventDefault();
	}, false);
}(window, document));