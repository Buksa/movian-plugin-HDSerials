/**
 *  HDSerials plugin for Showtime
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
//ver 0.10 API
(function(plugin) {
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    var BASE_URL = 'http://hdserials.galanov.net';
    var logo = plugin.path + "img/logo.png";
    var USER_AGENT = 'Android;HD Serials v.1.12.4;ru-RU;google Nexus 4;SDK 10;v.2.3.3(REL)';
    plugin.addHTTPAuth("http:\/\/.*.galanov.net.*", function(authreq) {
        authreq.setHeader("User-Agent", USER_AGENT);
    });

    function trim(s) {
        s = s.replace(/(\r\n|\n|\r)/gm, "");
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/[ ]{2,}/gi, " ");
        return s;
    }

    function blueStr(str) {
        return '<font color="6699CC"> (' + str + ')</font>';
    }
    //this MUST be used at the end of the corresponding function
    //else there is no loading circle

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = PREFIX + ' : ' + title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    }
    var service = plugin.createService("HDSerials.ru", PREFIX + ":start", "video", true, logo);
    var settings = plugin.createSettings("HDSerials", logo, "HDSerials: Integration of the website HDSerials.ru into Showtime");
    settings.createInfo("info", logo, "Plugin developed by " + plugin_info.author + ". \n");
    var Resolution = [
        ['0', 'Auto', true],
        ['1', '720p'],
        ['2', '480p'],
        ['3', '360p'],
    ];
    settings.createDivider('Video Settings');
    settings.createMultiOpt("Resolution", "Разрешение", Resolution, function(v) {
        service.Resolution = v;
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
    settings.createBool("debug", "Debug", false, function(v) {
        service.debug = v;
    });
    var qualityNotAvailableError = "Невозможно открыть видео в " + Resolution[service.Resolution][1] + ", используется максимально доступное качество";

    function startPage(page) {

        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            headers: {
                'User-Agent': USER_AGENT
            },
            args: {
                id: 'common-categories'
            }
        }));
        page.appendItem(PREFIX + ':news:news', 'directory', {
            title: 'Сериалы HD новинки',
            icon: logo
        });
        page.appendItem(PREFIX + ':sub-categories:0:Последние 200 обновлений на сайте:200', 'directory', {
            title: 'Последние 200 обновлений на сайте',
            icon: logo
        });
        for (i in json.data) {
            page.appendItem(PREFIX + ':' + json.id + ':' + json.data[i].id + ':' + escape(json.data[i].title_ru), 'directory', {
                title: new showtime.RichText(json.data[i].title_ru + blueStr(json.data[i].video_count)),
                icon: logo
            });
        }
        setPageHeader(page, 'фильмы, сериалы и мультфильмы в HD.');
    }
    plugin.addURI(PREFIX + ":news:(.*)", function(page, id) {
        var counter = 0;
        var json = showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            headers: {
                'User-Agent': USER_AGENT
            },
            args: {
                id: id
            }
        }).toString();
        p(json)
        json = showtime.JSONDecode(json)
        for (var i in json.data) {
            page.appendItem(PREFIX + ':filter-videos:' + json.data[i].video_id + ':' + escape(json.data[i].video_title_ru + (json.data[i].video_season ? " " + json.data[i].video_season : "")), "video", {
                title: new showtime.RichText(json.data[i].video_title_ru + (json.data[i].video_title_en ? " / " + json.data[i].video_title_en : "") +
                    (json.data[i].video_season ? " " + json.data[i].video_season : "")),

                description: new showtime.RichText('<p align="justify">' + coloredStr('Обнавлено: ', orange) + json.data[i].date + ' ' + json.data[i].title + '</p>' + '\n' + coloredStr('Название: ', orange) + json.data[i].video_title_ru + (json.data[i].video_title_en ? " / " + json.data[i].video_title_en : "") + (json.data[i].video_season ? " " + json.data[i].video_season : "")),
                icon: json.data[i].video_image_file
            });
            counter++;
        }
        setPageHeader(page, 'Сериалы HD новинки');
    });
    // Shows genres of the category jump to sub-categories
    plugin.addURI(PREFIX + ":common-categories:(.*):(.*)", function(page, id, title) {
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            headers: {
                'User-Agent': USER_AGENT
            },
            args: {
                id: 'sub-categories',
                parent: id,
                start: 1
            }
        }));
        for (i in json.data) {
            if (json.data[i].video_count !== '0') page.appendItem(PREFIX + ':' + json.id + ':' + json.data[i].id + ':' + escape(json.data[i].title_ru) + ':' + json.data[i].video_count, 'directory', {
                    title: new showtime.RichText(json.data[i].title_ru + blueStr(json.data[i].video_count)),
                    icon: logo
                });
        }
        setPageHeader(page, unescape(title));
    });
    // Shows sub-categories jump to filter-videos
    plugin.addURI(PREFIX + ":sub-categories:(.*):(.*):(.*)", function(page, category_id, title, video_count) {
        var offset = 0;
        var counter = 0;
        var anchor = 0;
        var lastRequest = 0,
            requestFinished = true,
            requestNumber = 0;


        function loader() {
            if (!requestFinished) {
                //showtime.print("Request not finished yet, exiting");
                return false;
            }
            //showtime.print(video_count + " " + counter);
            if (parseInt(video_count, 10) <= counter) {
                if (service.showEndOfDirMessage && requestNumber > 2) {
                    showtime.notify("Достигнут конец директории", 2);
                }
                return false;
            }
            var json;
            var delay = countDelay(service.requestMinDelay * 1000, lastRequest);
            var loadjson = function() {
                try {
                    lastRequest = Date.now();
                    requestFinished = false;
                    //showtime.print("Time to make some requests now!");
                    var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
                        method: 'POST',
                        headers: {
                            'User-Agent': USER_AGENT
                        },
                        args: {
                            id: 'filter-videos',
                            category: category_id,
                            fresh: 1,
                            start: offset,
                            limit: service.requestQuantity
                        }
                    }));
                    requestFinished = true;
                    requestNumber++;
                    //showtime.print("Request finished!. Got " + json.data.length);
                    return json;
                } catch (err) {
                    showtime.notify("Подгрузка контента не удалась. Возможно, сервер не ответил вовремя.", 5);
                    return false;
                }
            };
            //showtime.print("Let's wait " + delay + " msec before making a request!");
            sleep(delay);
            json = loadjson();
            if (!json) return false;
            for (var i in json.data) {
                page.appendItem(PREFIX + ':' + json.id + ':' + json.data[i].id + ':' + escape(json.data[i].title_ru + (json.data[i].season ? " " + showtime.entityDecode(json.data[i].season) : "")), "video", {
                    title: showtime.entityDecode(unescape(json.data[i].title_ru)) + (json.data[i].title_en ? " / " + showtime.entityDecode(json.data[i].title_en) : "") + (json.data[i].season ? " " + showtime.entityDecode(json.data[i].season) : ""),
                    year: +parseInt(json.data[i].year, 10),
                    icon: unescape(json.data[i].image_file)
                });
                counter++;
            }
            offset += json.data.length;
            return true;
        }
        loader();
        setPageHeader(page, unescape(title));
        page.paginator = loader;
    });
    plugin.addURI(PREFIX + ":filter-videos:(.*):(.*)", function(page, id, title) {
        var i, item, genres, actors, directors, countries, data = {};
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
            method: 'POST',
            headers: {
                'User-Agent': USER_AGENT
            },
            args: {
                id: 'video',
                video: id
            }
        }));
        p(json)
        if (json.data.genres) {
            genres = "";
            for (i in json.data.genres) {
                genres += json.data.genres[i].title_ru;
                if (i < json.data.genres.length - 1) genres += ', ';
            }
        }
        if (json.data.countries) {
            countries = "";
            for (i in json.data.countries) {
                countries += json.data.countries[i].title_ru;
                if (i < json.data.countries.length - 1) countries += ', ';
            }
        }
        if (json.data.actors) {
            actors = "";
            for (i in json.data.actors) {
                actors += json.data.actors[i].title_ru;
                if (i < json.data.actors.length - 1) actors += ', ';
            }
        }
        if (json.data.directors) {
            directors = "";
            for (i in json.data.directors) {
                directors += json.data.directors[i].title_ru;
                if (i < json.data.directors.length - 1) directors += ', ';
            }
        }
        if (json.data.files.length > 1) {

            for (j in json.data.files) {
                if (json.data.files[j].episode == 1) {
                    p(json.data.files[j].season + ' ' + json.data.files[j].episode)
                    page.appendItem("", "separator", {
                        title: new showtime.RichText('Сезон ' + json.data.files[j].season)
                    });
                }
                data = {
                    title: json.data.info.title_en,
                    year: json.data.info.year,
                    season: json.data.files[j].season,
                    episode: json.data.files[j].episode,
                    url: json.data.files[j].url
                };
                p(json.data.files[j].season)
                item = page.appendItem(PREFIX + ':' + json.id + ':' + escape(JSON.stringify(data)), "video", {
                    title: new showtime.RichText(json.data.files[j].title + (json.data.files[j].season_translation ? ' (' + json.data.files[j].season_translation + ')' : '')),
                    description: new showtime.RichText((json.data.info.translation ? coloredStr('Перевод: ', orange) + json.data.info.translation + (json.data.files[j].season_translation ? ', ' + json.data.files[j].season_translation : '') + '\n' : '') + (countries ? coloredStr('Страна: ', orange) + countries + '\n' : '') + (directors ? coloredStr('Режиссер: ', orange) + directors + ' ' : '') + (actors ? '\n' + coloredStr('В ролях актеры: ', orange) + actors + '\n' : '') + (json.data.info.description ? coloredStr('Описание: ', orange) + json.data.info.description : '')),
                    duration: json.data.info.duration ? json.data.info.duration : '',
                    rating: json.data.info.hd_rating * 10,
                    genre: genres ? genres : '',
                    year: json.data.info.year ? parseInt(json.data.info.year, 10) : '',
                    icon: json.data.info.image_file ? json.data.info.image_file : ''
                });

                //item.bindVideoMetadata({title: json.data.info.title_en, season: 2, episode: parseInt(i)+1,  year: parseInt(json.data.info.year)})
            }
            //code

        } else {
            for (i in json.data.files) {
                data = {
                    title: json.data.info.title_en,
                    year: json.data.info.year,
                    season: json.data.files[i].season,
                    episode: json.data.files[i].episode,
                    url: json.data.files[i].url
                };
                item = page.appendItem(PREFIX + ':' + json.id + ':' + escape(JSON.stringify(data)), "video", {
                    title: new showtime.RichText(json.data.files[i].title),
                    description: new showtime.RichText((json.data.info.translation ? coloredStr('Перевод: ', orange) + json.data.info.translation + '\n' : '') + (countries ? coloredStr('Страна: ', orange) + countries + '\n' : '') + (directors ? coloredStr('Режиссер: ', orange) + directors + ' ' : '') + (actors ? '\n' + coloredStr('В ролях актеры: ', orange) + actors + '\n' : '') + (json.data.info.description ? coloredStr('Описание: ', orange) + json.data.info.description : '')),
                    duration: json.data.info.duration ? json.data.info.duration : '',
                    rating: json.data.info.hd_rating * 10,
                    genre: genres ? genres : '',
                    year: json.data.info.year ? parseInt(json.data.info.year, 10) : '',
                    icon: json.data.info.image_file ? unescape(json.data.info.image_file) : ''
                });
                //item.bindVideoMetadata({title: json.data.info.title_en, season: 2, episode: parseInt(i)+1,  year: parseInt(json.data.info.year)})
            }
        }
        setPageHeader(page, unescape(title));
    });
    // Play links
    plugin.addURI(PREFIX + ":video:(.*)", function(page, data) {
        //no loading circle was present, forcing
        var canonicalUrl = PREFIX + ":video:" + data;
        data = showtime.JSONDecode(unescape(data));
        page.loading = true;

        var videoparams = {
            canonicalUrl: canonicalUrl,
            no_fs_scan: true,
            title: data.title,
            //year: data.year ? data.year : 0,
            season: data.season ? data.season : -1,
            episode: data.episode ? data.episode : -1,
            sources: [{
                    url: []
                }
            ],
            subtitles: []
        };

        //vk.com
        if (data.url.indexOf("oid=") !== -1) {
            p('Open url:' + 'http://vk.com/' + url);
            page.metadata.title = title
            vars = JSON.parse(showtime.httpReq('https://api.vk.com/method/video.getEmbed?' + url.replace('&id', '&video_id').replace('&hash', '&embed_hash')).toString());
            p(vars)
            if (vars.error) {
                page.metadata.title = vars.error.error_msg
                showtime.notify(vars.error.error_msg + '\n' + 'This video has been removed from public access.', 3)

            } else {
                for (key in vars.response) {
                    if (key == 'cache240' || key == 'cache360' || key == 'cache480' || key == 'cache720' || key == 'url240' || key == 'url360' || key == 'url480' || key == 'url720') {
                        videoparams.sources = [{
                                url: vars.response[key],
                                mimetype: "video/quicktime"
                            }
                        ]
                        video = "videoparams:" + JSON.stringify(videoparams)
                        page.appendItem(video, "video", {
                            title: "[" + key.match(/\d+/g) + "]-" + data.title + " | " + data.season + " \u0441\u0435\u0437\u043e\u043d  | " + data.episode + " \u0441\u0435\u0440\u0438\u044f",
                            duration: vars.response.duration,
                            icon: vars.response.thumb
                        });
                    }
                }
            }

        } else {
            //if (url.match(/http:\/\/.+?iframe/)) {
            p('Open url:' + data.url.match(/http:\/\/.+?iframe/));
            var hdcdn = data.url.match(/http:\/\/.+?iframe/).toString();
            v = showtime.httpReq(hdcdn, {
                method: 'GET',
                headers: {
                    'Referer': BASE_URL
                }
            }).toString();
            p(v)
            //$.post('/sessions/create_session', {
            //    partner: 250,
            //    d_id: 6545,
            //    video_token: '9ef85ccd47347169',
            //    content_type: 'movie',
            //    access_key: 'MNW4q9pL82sHxV'
            //  }).success(function(video_url) {
            //    ga('send', 'event', 'session', '9ef85ccd47347169');
            //
            //      if (isMobile.Android() || isMobile.iOS()) {
            //        player_hls(video_url.manifest_m3u8);
            //      } else {
            //        player_osmf('AniDub/[AniDub]_World_Trigger_[720p]_[Manaoki_Holly]/[AniDub]_World_Trigger_[01]_[720p_x264_Aac]_[Manaoki_Holly].mp4', video_url.manifest_f4m, 'player');
            //      }
            //  });
            page.metadata.title = v.match(/player_osmf.*\/([^']+)/)[1]
            var postdata = {}
            postdata = /post\('\/sessions\/create_session', \{([^\}]+)/.exec(v)[1]
            p(postdata)
            postdata = {
                partner: /partner: (.*),/.exec(v)[1],
                d_id: /d_id: (.*),/.exec(v)[1],
                video_token: /video_token: '(.*)'/.exec(v)[1],
                content_type: /content_type: '(.*)'/.exec(v)[1],
                access_key: /access_key: '(.*)'/.exec(v)[1]
            }
            json = JSON.parse(showtime.httpReq(hdcdn.match(/http:\/\/.*?\//) + 'sessions/create_session', {
                debug: true,
                postdata: postdata
            }));
            result_url = 'hls:' + json.manifest_m3u8;

            videoparams.sources = [{
                    url: 'hls:' + json.manifest_m3u8
                }
            ]
            video = "videoparams:" + JSON.stringify(videoparams)
            page.appendItem(video, "video", {
                title: "[Auto]-" + data.title + " | " + data.season + " \u0441\u0435\u0437\u043e\u043d  | " + data.episode + " \u0441\u0435\u0440\u0438\u044f",
                /*duration: vars.response.duration,
                                                        icon: vars.response.thumb*/
            });
            var video_urls = showtime.httpReq(json.manifest_m3u8).toString()
            p(video_urls)
            var video_urls = /RESOLUTION=([^,]+)[\s\S]+?(http.*)/g.execAll(video_urls);
            p(video_urls)
            for (i in video_urls) {
                videoparams.sources = [{
                        url: 'hls:' + video_urls[i][2]
                    }
                ]
                video = "videoparams:" + JSON.stringify(videoparams)
                page.appendItem(video, "video", {
                    title: "[" + video_urls[i][1] + "]-" + data.title + " | " + data.season + " \u0441\u0435\u0437\u043e\u043d  | " + data.episode + " \u0441\u0435\u0440\u0438\u044f"
                    /*,
                                                        duration: vars.response.duration,
                                                        icon: logo*/
                });

            }

        }


        page.appendItem("search:" + data.title, "directory", {
            title: 'Try Search for: ' + data.title
        });

        page.type = "directory";
        page.contents = "contents";
        page.metadata.logo = logo;
        page.loading = false;
    });



    function debug(message) {
        showtime.trace(message, plugin.getDescriptor().id);
        showtime.print(message);
    }

    function p(msg) {
        service.debug && ("object" === typeof msg && (msg = "### object ###\n" + JSON.stringify(msg) + "\n### object ###"), showtime.print(msg))
    };



    function countDelay(delay, lastRequest) {
        p("Getting difference between:" + lastRequest + " and " + Date.now());
        var timeDiff = Date.now() - lastRequest;
        p("time sinse last call:" + timeDiff);
        return timeDiff < delay ? delay - timeDiff : 0;
    };

    function sleep(ms) {
        var last = Date.now();
        for (; !(Date.now() - last > ms);) {}
    };


    var blue = "6699CC",
        orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '">(' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    //       $.fn.serializeObject = function()
    //	{
    //	    var o = {};
    //	    var a = this.serializeArray();
    //	    $.each(a, function() {
    //	        if (o[this.name] !== undefined) {
    //	            if (!o[this.name].push) {
    //	                o[this.name] = [o[this.name]];
    //	            }
    //	            o[this.name].push(this.value || '');
    //	        } else {
    //	            o[this.name] = this.value || '';
    //	        }
    //	    });
    //	    return o;
    //	}
    // Add to RegExp prototype
    RegExp.prototype.execAll = function(string) {
        var matches = [];
        var match = null;
        while ((match = this.exec(string)) !== null) {
            var matchArray = [];
            for (var i in match) {
                if (parseInt(i, 10) == i) {
                    matchArray.push(match[i]);
                }
            }
            matches.push(matchArray);
        }
        return matches;
    };
    plugin.addURI(PREFIX + ":start", startPage);
    plugin.addSearcher(PREFIX + " - Videos", plugin.path + "logo.png", function(page, query) {
        try {
            page.entries = 0;
            var offset = 0;
            var loader = function loader() {
                var json = showtime.JSONDecode(showtime.httpReq(BASE_URL + '/backend/model.php', {
                    method: 'POST',
                    headers: {
                        'User-Agent': USER_AGENT
                    },
                    args: {
                        id: 'filter-videos',
                        category: 0,
                        search: query,
                        start: offset,
                        limit: 20
                    }
                }));
                for (var i in json.data) {
                    page.appendItem(PREFIX + ':' + json.id + ':' + json.data[i].id + ':' + escape(json.data[i].title_ru + (json.data[i].season ? " " + showtime.entityDecode(json.data[i].season) : "")), "video", {
                        title: showtime.entityDecode(unescape(json.data[i].title_ru)) + (json.data[i].title_en ? " / " + showtime.entityDecode(json.data[i].title_en) : "") + (json.data[i].season ? " " + showtime.entityDecode(json.data[i].season) : ""),
                        year: +parseInt(json.data[i].year, 10),
                        icon: unescape(json.data[i].image_file)
                    });
                    page.entries++;
                }
                offset += 20;
                return !json.endOfData;
            };
            setPageHeader(page, query);
            loader();
            page.paginator = loader;
        } catch (err) {
            showtime.trace(PREFIX + ' - Ошибка поиска: ' + err);
        }
    });
})(this);