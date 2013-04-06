(function(w, d){
	var apiAnime = 'http://kanadeapi.appspot.com/v1/anime',
		malAnime = 'http://myanimelist.net/anime/',
		animeItemTmpl = '<li id="anime-{id}">'
			+ '<div class="img"><img src="{image}" width="50" height="70" alt="" onerror="this.src = this.src+\'?\'+(+new Date())"></div>'
			+ '<a href="{url}" target="_blank">{title}</a>'
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
		heading = $('heading-title'),
		closeSeasonsButton = $('close-seasons'),
		closeImageButton = $('close-image'),
		container = $('container'),
		blankDiv = $('blank'),
		seasonsButton = $('seasons-button'),
		seasonsList = $('seasons'),
		animesDiv = $('animes'),
		countDiv = $('count'),
		imageDiv = $('image'),
		imageCaption = $('image-caption');
		loading = $('loading'),
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
			el.style.clip = 'auto';
		},
		clean = function(str){
			return str.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
		},
		hasClass = function(el, className){
			return clean(el.className).indexOf(className) > -1;
		},
		addClass = function(el, className){
			if (hasClass(el, className)) return;
			el.className = clean(el.className + ' ' + className);
		},
		removeClass = function(el, className){
			el.className = el.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1');
		},
		toggleClass = function(el, className){
			hasClass(el, className) ? removeClass(el, className) : addClass(el, className);
		},
		thumbSize = Math.round(50 * (window.devicePixelRatio || 1)),
		loadAnimes = function(year, season){
			var animes = $seasons[year][season],
				i = 0, j = 0,
				l = animes.length,
				animesLeft = [],
				end = function(){
					if (j>=l){
						$hide(loading);
						$data.sort(function(a, b){
							var score = b.score - a.score;
							return (score != 0) ? score : (b.title < a.title);
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
								image: 'http://src.sencha.io/' + thumbSize + '/' + o.image,
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
			$show(animesDiv);
			countDiv.innerHTML = '';
			$show(loading);
			animesDiv.innerHTML = '';
			scroll.home.refresh();
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
	
	if (!$touch) addClass(document.body, 'notouch');
	
	for (var i=0, l=pages.length; i<l; i++){
		var p = pages[i],
			id = p.id.replace('page-', ''),
			s = p.querySelector('.scroll'),
			options = {};
		page[id] = p;
		switch (id){
			case 'home':
				var imageTarget, linkTarget,
					scrolled = false,
					revert = function(){
						if (imageTarget){
							removeClass(imageTarget.parentNode, 'selected');
							imageTarget = null;
						}
						if (linkTarget){
							removeClass(linkTarget, 'active');
							linkTarget = null;
						}
					};
				options = {
					hScroll: false,
					onBeforeScrollStart: function(e){
						e.preventDefault();
						var target = e.target;
						while (target.nodeType != 1) target = target.parentNode;
						var tagName = target.tagName.toLowerCase();
						if (tagName == 'img'){
							var parent = target.parentNode;
							if (hasClass(parent, 'selected')) return;
							imageTarget = target;
							addClass(parent, 'selected');
						} else if (tagName == 'a'){
							linkTarget = target;
							addClass(target, 'active');
						}
					},
					onBeforeScrollMove: function(){
						scrolled = true;
						revert();
					},
					onScrollEnd: function(){
						scrolled = false;
					},
					onTouchEnd: function(){
						if (imageTarget){
							var el = imageTarget,
								imageDiv = page.image;
							$show(imageDiv);
							removeClass(imageDiv, 'slideup');
							removeClass(imageDiv, 'out');
							removeClass(imageDiv, 'reverse');
							addClass(imageDiv, 'slideup in');
							
							var anime = $cache.get(el.parentNode.parentNode.id.split('-')[1]) || {title: ''},
								div = imageDiv.querySelector('.scroll div'),
								img = new Image(),
								src = anime.image.replace('.jpg', 'l.jpg'),
								p = d.createElement('p');
							img.onload = function(){
								removeClass(img, 'loading');
								div.style.minWidth = Math.max(window.innerWidth, img.offsetWidth) + 'px';
								setTimeout(function(){
									scroll.image.refresh();
								}, 100);
							};
							img.onabort = img.onerror = function(){
								img.src = src + '?' + (+new Date());
							};
							img.src = src;
							img.alt = '';
							addClass(img, 'loading');
							imageCaption.innerHTML = imageDiv.querySelector('h1').innerHTML = anime.title;
							addClass(imageDiv.querySelector('header'), 'visible');
							addClass(imageCaption, 'visible');
							div.appendChild(img);
							
							div.style.width = '';
							scroll.image.scrollTo(0,0);
							scroll.image.zoom(0,0,1);
							scroll.image.refresh();
						}
						setTimeout(revert, 350);
					}
				};
				break;
			case 'seasons':
				var startTarget, startTimer, scrolled = false;
				options = {
					hScroll: false,
					onBeforeScrollStart: function(e){
						e.preventDefault();
						var target = e.target;
						while (target.nodeType != 1) target = target.parentNode;
						if (target.tagName.toLowerCase() != 'a') return;
						startTarget = target;
						clearTimeout(startTimer);
						startTimer = setTimeout(function(){
							addClass(startTarget, 'selected');
						}, 80);
					},
					onBeforeScrollMove: function(){
						if (!startTarget) return;
						scrolled = true;
						clearTimeout(startTimer);
						removeClass(startTarget, 'selected');
					},
					onScrollEnd: function(){
						scrolled = false;
					},
					onTouchEnd: function(){
						if (!startTarget) return;
						if (scrolled){
							clearTimeout(startTimer);
							setTimeout(function(){
								removeClass(startTarget, 'selected');
							}, 2000);
						} else {
							var seasonsDiv = page.seasons;
							addClass(startTarget, 'selected');
							if (w.innerWidth >= 481){
								setTimeout(function(){
									removeClass(startTarget, 'selected');
								}, 350);
							} else {
								setTimeout(function(){
									removeClass(seasonsDiv, 'in');
									addClass(seasonsDiv, 'slideup out reverse');
									setTimeout(function(){
										removeClass(startTarget, 'selected');
									}, 350);
								}, 600);
							}
						}
					}
				};
				break;
			case 'image':
				var header = p.querySelector('header'),
					scrolled = false,
					zoomed = false;
				options = {
					hScroll: true,
					hScrollbar: false,
					vScrollbar: false,
					zoom: true,
					lockDirection: false,
					onScrollMove: function(){
						if (!scrolled){
							removeClass(header, 'visible');
							removeClass(imageCaption, 'visible');
						}
						scrolled = true;
					},
					onZoom: function(){
						if (!zoomed){
							removeClass(header, 'visible');
							removeClass(imageCaption, 'visible');
						}
						zoomed = true;
					},
					onTouchEnd: function(){
						if (!scrolled){
							toggleClass(header, 'visible');
							toggleClass(imageCaption, 'visible');
						}
						scrolled = zoomed = false;
					}
				};
				break;
			default:
				options = {
					hScroll: false
				};
		}
		scroll[id] = $ios ? new iScroll(s, options) : {refresh: noop, scrollTo: noop};
	}
	
	var loadPage = function(){
		var hash = location.hash.slice(1);
		if (/^animes/i.test(hash)){
			var hashes = hash.split('-'),
				year = hashes[1],
				season = hashes[2];
			loadAnimes(year, season);
			var checkedSeason = seasonsList.querySelector('a.checked');
			if (checkedSeason) removeClass(checkedSeason, 'checked');
			var item = seasonsList.querySelector('a[href="#' + hash + '"]');
			addClass(item, 'checked');
			heading.innerHTML = season.replace(/\b[a-z]/g, function(match){
					return match.toUpperCase();
				}) + ' ' + year;
		} else {
			$show(blankDiv);
			$hide(animesDiv);
			countDiv.innerHTML = '';
			$hide(loading);
			scroll.home.refresh();
			heading.innerHTML = 'Kanade';
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
						var minHeight = (id == 'image') ? height : height-offsetTop;
						s.style.height = s.firstElementChild.style.minHeight = minHeight + 'px';
					}
					for (var id in scroll){
						scroll[id].refresh();
					}
				}, 50);
			};
		adjustHeight();
		setTimeout(adjustHeight, 1000); // fail-safeness
		d.addEventListener('touchend', $top, false);
		w.addEventListener('orientationchange', adjustHeight, false);
	}
	
	microAjax('seasons.json', function(r){
		r = JSON.parse(r);
		if (!r || !r.seasons) return;
		$seasons = r.seasons;
		var seasonsHTML = '';
		for (var year in $seasons){
			var seasons = $seasons[year];
			for (var season in seasons){
				var count = seasons[season].length;
				seasonsHTML += '<li><a href="#animes-' + year + '-' + season + '"><b></b>' + season.replace(/\b[a-z]/g, function(match){
					return match.toUpperCase();
				}) + ' ' + year + ' <span>' + count + '</span></a></li>';
			}
		}
		seasonsList.innerHTML += seasonsHTML;
		scroll.seasons.refresh();
		
		$show(seasonsButton);
		tappable('#seasons-button', {
			noScroll: true,
			onTap: function(){
				var seasonsDiv = page.seasons;
				$show(seasonsDiv);
				removeClass(seasonsDiv, 'out');
				removeClass(seasonsDiv, 'reverse');
				addClass(seasonsDiv, 'slideup in');
				var checkedEl = seasonsDiv.querySelector('.checked');
				if (checkedEl) scroll.seasons.scrollToElement(checkedEl);
			}
		});
		
		tappable('#close-seasons', {
			noScroll: true,
			onTap: function(){
				var seasonsDiv = page.seasons;
				removeClass(seasonsDiv, 'in');
				addClass(seasonsDiv, 'slideup out reverse');
			}
		});
		
		loadPage();
	});
	
	tappable('#close-image', {
		noScroll: true,
		onTap: function(){
			var imageDiv = page.image;
			removeClass(imageDiv, 'in');
			addClass(imageDiv, 'out reverse');
			setTimeout(function(){
				imageDiv.querySelector('.scroll div').innerHTML = '';
			}, 350);
		}
	});
}(window, document));