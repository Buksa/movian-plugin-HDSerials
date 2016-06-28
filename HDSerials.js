/**
 * HDSerials plugin for Movian
 *
 *  Copyright (C) 2015 Buksa, Wain
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
//ver 1.0.2
var plugin = JSON.parse(Plugin.manifest);

var PREFIX = plugin.id;
var BASE_URL = 'http://hdserials.galanov.net';
var LOGO = Plugin.path + "logo.png";
var UA = 'Android;HD Serials v.1.14.9;ru-RU;google Nexus 4;SDK 10;v.2.3.3(REL)';
var page = require('showtime/page');
var service = require("showtime/service");
var settings = require('showtime/settings');
var io = require('native/io');
var prop = require('showtime/prop');
var log = require('./src/log');
var browse = require('./src/browse');
var api = require('./src/api');

var http = require('showtime/http');
var html = require("showtime/html");
var result

var tos = "The developer has no affiliation with the sites what so ever.\n";
tos += "Nor does he receive money or any other kind of benefits for them.\n\n";
tos += "The software is intended solely for educational and testing purposes,\n";
tos += "and while it may allow the user to create copies of legitimately acquired\n";
tos += "and/or owned content, it is required that such user actions must comply\n";
tos += "with local, federal and country legislation.\n\n";
tos += "Furthermore, the author of this software, its partners and associates\n";
tos += "shall assume NO responsibility, legal or otherwise implied, for any misuse\n";
tos += "of, or for any loss that may occur while using plugin.\n\n";
tos += "You are solely responsible for complying with the applicable laws in your\n";
tos += "country and you must cease using this software should your actions during\n";
tos += "plugin operation lead to or may lead to infringement or violation of the\n";
tos += "rights of the respective content copyright holders.\n\n";
tos += "plugin is not licensed, approved or endorsed by any online resource\n ";
tos += "proprietary. Do you accept this terms?";


io.httpInspectorCreate('http.*galanov.net/.*', function(ctrl) {
  ctrl.setHeader('User-Agent', UA);
  return 0;
});
io.httpInspectorCreate('https://.*moonwalk.cc/.*', function(ctrl) {
  ctrl.setHeader('User-Agent', UA);
  return 0;
});

// Create the service (ie, icon on home screen)
service.create(plugin.title, PREFIX + ":start", "video", true, LOGO);


settings.globalSettings("settings", plugin.title, LOGO, plugin.synopsis);
settings.createInfo("info", LOGO, "Plugin developed by " + plugin.author + ". \n");
settings.createDivider("Settings:");
settings.createBool("tosaccepted", "Accepted TOS (available in opening the plugin)", false, function(v) {
  service.tosaccepted = v;
});
settings.createBool("debug", "Debug", false, function(v) {
  service.debug = v;
});
settings.createDivider('Browser Settings');
settings.createInfo("info2", '', "Чем меньше значение - тем быстрее подгрузка списков в директориях с большим количеством файлов, но тем больше вероятность ошибки сервера. \n");
settings.createInt("Min.Delay", "Интервал запросов к серверу (default: 3 сек)", 3, 1, 10, 1, 'сек', function(v) {
  service.requestMinDelay = v;
});
settings.createInt("requestQuantity", "Количество запрашиваемых данных в одном запросе", 20, 10, 20, 5, '', function(v) {
  service.requestQuantity = v;
});
settings.createBool("Show_finished", "Показывать сообщение о достижении конца директории", true, function(v) {
  service.showEndOfDirMessage = v;
});

function blueStr(str) {
  //return '<font color="6699CC"> (' + str + ')</font>';
  return ' (' + str + ')'
}


function oprint(o) {
  // print an object, this should really be a Movian builtin
  print(JSON.stringify(o, null, 4));
}

    var blue = "6699CC",
        orange = "FFA500";

    function colorStr(str, color) {
        return ' (' + str + ')';
        //return '<font color="' + color + '">(' + str + ')</font>';      
    }

    function coloredStr(str, color) {
        return  str;
//        return '<font color="' + color + '">' + str + '</font>';      
    }
new page.Route(PREFIX + ":news:(.*)", function(page, id) {
  browse.list({
    'id': id,
  }, page);
});

new page.Route(PREFIX + ":common-categories:(.*):(.*)", function(page, id, title) {
  browse.list({
    'id': 'sub-categories',
    'parent': id,
    'start': 0
  }, page);
})

new page.Route(PREFIX + ":sub-categories:(.*):(.*)", function(page, category_id, title) {
  browse.list({
    'id': 'filter-videos',
    'category': category_id,
    'fresh': 1,
    'start': 0,
    'limit': service.requestQuantity
  }, page);
})

new page.Route(PREFIX + ":filter-videos:(.*):(.*):(.*)", function(page, id, title, filter) {
  browse.moviepage({
    'id': 'video',
    'video': id,
  }, page, filter);
})

new page.Route(PREFIX + ":search:(.*)", function(page, query) {
  page.metadata.icon = LOGO;
  page.metadata.title = 'Search results for: ' + query;
  browse.list({
                        'id': 'filter-videos',
                        'category': 0,
                        'search': query,
                        'start': 0,
                        'limit': service.requestQuantity
                    },page);
});

page.Searcher(PREFIX + " - Videos", LOGO, function(page, query) {
  page.metadata.icon = LOGO;
 // page.metadata.title = 'Search results for: ' + query;
  browse.list({
                        'id': 'filter-videos',
                        'category': 0,
                        'search': query,
                        'start': 0,
                        'limit': service.requestQuantity
                    },page);
});

// Landing page
new page.Route(PREFIX + ":start", function(page) {
  page.type = 'directory';
  page.metadata.title = "HDSerials";
  page.metadata.icon = LOGO;

  page.appendItem(PREFIX + ":search:", 'search', {
    title: 'Search HDSerials'
  });

  page.appendItem(PREFIX + ':news:news', 'directory', {
    title: 'Сериалы HD новинки',
  });
  page.appendItem(PREFIX + ':sub-categories:0:Последние обновлений на сайте', 'directory', {
    title: 'Последние обновлений на сайте',
  });


  api.call({
    'id': 'common-categories',
  }, null, function(result) {
    for (var x in result.data) {
      var item = result.data[x];
      page.appendItem(PREFIX + ':' + result.id + ':' + item.id + ':' + escape(item.title_ru), 'directory', {
        title: item.title_ru + ' (' + item.video_count + ')' //+'<font color="6699CC">blue</font>',
      });
    }
  });
});



function videoPage(page, data) {

  page.loading = true;
  var canonicalUrl = PREFIX + ":video:" + data;
  data = JSON.parse(unescape(data));

    var videoparams = {
      canonicalUrl: canonicalUrl,
      no_fs_scan: true,
      icon: data.icon,      
      title: unescape(data.title),
      year: data.year ? data.year : '',
      season: data.season ? data.season : '',
      episode: data.episode ? data.episode : '',
      sources: [{
        url: []
        }],
          subtitles: []
    };

    if (data.url.match(/http:\/\/.+?iframe/)) {
      log.p('Open url:' + data.url.match(/http:\/\/.+?iframe/));
      log.p("Open url:" + data.url);
        resp = http.request(data.url, {
            method: "GET",
            headers: {
                Referer: BASE_URL
            }
        })
            .toString();
        log.p("source:" + resp);
        var content = parser(resp, "|14", "|");
        content = Duktape.enc("base64", 14 + content);
        var csrftoken = parser(resp, 'csrf-token" content="', '"');
        var request = parser(resp, 'request_host_id = "', '"');
        var video_token = parser(resp, "video_token: '", "'");
        var partner = parser(resp, "partner: ", ",");
        var content_type = parser(resp, "content_type: '", "'");
        var access_key = parser(resp, "access_key: '", "'");
        var request_host = parser(resp, 'request_host = "', '"');
        var params = "partner=" + partner + "&d_id=" + request + "&video_token=" + video_token + "&content_type=" + content_type + "&access_key=" + access_key + "&cd=1";
        log.p(params);
        var url1 = data.url.match(/http:\/\/.*?\//)
            .toString() + "sessions/create_session";
        var responseText = http.request(url1, {
            debug: 1,
            headers: {
                "Accept-Encoding": "identity",
                "Accept-Language": "en-us,en;q=0.5",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "User-Agent": "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.2.6) Gecko/20100627 Firefox/3.6.6",
                "Accept-Charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.7",
                "X-CSRF-Token": csrftoken,
                "Content-Data": content,
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                "Connection": "close"
            },
            postdata: params
        })
            .toString();
        log.p(parser(resp, "insertVideo('", "'"));
        title = parser(resp, "insertVideo('", "'");
        page.metadata.title = title;
        json = JSON.parse(responseText);
        log.p(json);
        result_url = "hls:" + json.manifest_m3u8;
        videoparams.sources = [{
                url: "hls:" + json.manifest_m3u8
            }
        ];
        video = "videoparams:" + JSON.stringify(videoparams);
        page.appendItem(video, "video", {
            title: "[Auto]" + " | " + title,
            icon: data.icon
        });
        var video_urls = http.request(json.manifest_m3u8)
            .toString();
        log.p(video_urls);
        var myRe = /RESOLUTION=([^,]+)[\s\S]+?(http.*)/g;
        var myArray, i = 0;
        while ((myArray = myRe.exec(video_urls)) !== null) {
            videoparams.sources = [{
                    url: "hls:" + myArray[2]
                }
            ];
            video = "videoparams:" + JSON.stringify(videoparams);
            page.appendItem(video, "video", {
                title: "[" + myArray[1] + "]" + " | " + title,
                icon: data.icon
            });
            i++;
        }
    }


        page.appendItem("search:" + data.title, "directory", {
            title: 'Try Search for: ' + data.title
        });

        page.type = "directory";
        page.contents = "contents";
        page.metadata.logo = data.icon;
        page.loading = false;
    };
    
function parser(a, c, e) {
    var d = "",
        b = a.indexOf(c);
    0 < b && (a = a.substr(b + c.length), b = a.indexOf(e), 0 < b && (d = a.substr(0, b)));
    return d;
}  

new page.Route(PREFIX + ":video:(.*)", videoPage);
