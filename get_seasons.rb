require 'rubygems'
require 'nokogiri'
require 'net/http'
require 'open-uri'

SEARCH = "http://myanimelist.net/anime.php?q="
SELECTOR = ".the_content b:first-child"
SEASONS = [
  "http://randomc.net/spring-2006-schedule/",
  "http://randomc.net/2006/06/26/summer-2006-shows/",
  "http://randomc.net/2006/09/22/fall-2006-shows/",
  "http://randomc.net/2006/12/30/winter-2007-preview/", 
  "http://randomc.net/2007/03/26/spring-2007-preview/",
  "http://randomc.net/2007/06/18/summer-2007-preview/",
  "http://randomc.net/2007/09/30/fall-2007-preview/"
]

SEASONS.each do |season_url|
  puts "SEASON: " + season_url
  season = Nokogiri(open(season_url))
  season.css(SELECTOR).each do |show|
    puts "SHOW: " + show.text
    search = "#{SEARCH}" + URI.escape(show.text)
    l = Net::HTTP.get_response(URI.parse(search))['location']
    if (l == nil) 
      puts search
    else
      puts l
    end
  end
  gets
end
  

