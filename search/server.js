var http = require('http');
var parse = require('url').parse;
var request = require('request');
var cheerio = require('cheerio');

http.createServer(function(req, res){
	var url = parse(req.url, true);
	var pathname = url.pathname;
	console.log(pathname);
	if (pathname == '/'){
		res.writeHead(200, {'Content-Type': 'text/html'});
		var q = url.query.q;
		var html = '<!doctype html>'
			+ '<style>body{font-family: sans-serif} input{width:100%; font-size: 1.4em}</style>'
			+ '<script>document.addEventListener("mouseup", function(e){if (e.target && e.target.select) e.target.select()}, true)</script>'
			+ '<form action="" method="GET"><input type="search" name="q" value="' + (q || '') + '" placeholder="Search anime titles"></form>';
		if (q){
			request({
				url: 'http://myanimelist.net/anime.php?q=' + q + '&type=1&score=0&status=0&tag=&p=0&r=0&sm=0&sd=0&sy=0&em=0&ed=0&ey=0&c%5B%5D=a&c%5B%5D=b&c%5B%5D=c&c%5B%5D=d&gx=0',
				followRedirect: false
			}, function(err, resp, body){
				if (!err){
					console.log(resp.statusCode)
					if (resp.statusCode == 200){
						var $ = cheerio.load(body);
						var links = $('#content table td.borderClass div + a[href]');
						links.each(function(i, el){
							el = $(el);
							var lastTd = el.parent('td').parent('tr').find('td').last();
							html += '<input value="' + $(el).attr('href').split('anime/')[1] + '" title="' + lastTd.text() + '">';
						});
					} else if (resp.statusCode == 302){
						var value = resp.headers['location'].split('anime/')[1];
						html += '<input value="' + value + '" autofocus>';
					}
				}
				res.end(html);
			});
		} else {
			res.end(html);
		}
	} else {
		res.writeHead(404, {'Content-Type': 'text/html'});
		res.end('404');
	}
}).listen(1337, '127.0.0.1');