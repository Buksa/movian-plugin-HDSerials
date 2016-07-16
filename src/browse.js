function populatePageFromResults(page, result) {
  
  for (var i = 0; i < result.data.length; i++) {
 
    var item = result.data[i];

    switch (result.id) {

      case 'news':
        page.appendItem(PREFIX + ':filter-videos:' + result.data[i].video_id + ':' + escape(result.data[i].video_title_ru + (result.data[i].video_season ? " " + result.data[i].video_season : "")) + ':' + undefined, "video", {
          title: (result.data[i].video_title_ru + (result.data[i].video_title_en ? " / " + result.data[i].video_title_en : "") +
            (result.data[i].video_season ? " " + result.data[i].video_season : "")),
          description: ('<p align="justify">' + coloredStr('Обнавлено: ', orange) + result.data[i].date + ' ' + result.data[i].title + '</p>' + '\n' + coloredStr('Название: ', orange) + result.data[i].video_title_ru + (result.data[i].video_title_en ? " / " + result.data[i].video_title_en : "") + (result.data[i].video_season ? " " + result.data[i].video_season : "")),
          icon: result.data[i].video_image_file
        });
        break;

      case 'sub-categories':
        page.appendItem(PREFIX + ':' + result.id + ':' + result.data[i].id + ':' + escape(result.data[i].title_ru) + ':' + result.data[i].video_count, 'directory', {
          title: (result.data[i].title_ru + blueStr(result.data[i].video_count)),
        });
        break;

      case 'filter-videos':
        page.appendItem(PREFIX + ':' + result.id + ':' + result.data[i].id + ':' + escape(result.data[i].title_ru + (result.data[i].season ? " " + (result.data[i].season) : "")) + ':' + undefined, "video", {
          title: (unescape(result.data[i].title_ru)) + (result.data[i].title_en ? " / " + (result.data[i].title_en) : "") + (result.data[i].season ? " " + (result.data[i].season) : ""),
          year: +parseInt(result.data[i].year, 10),
          icon: unescape(result.data[i].image_file)
        })/*.bindVideoMetadata({          title: (unescape(result.data[i].title_ru)) + (result.data[i].title_en ? " / " + (result.data[i].title_en) : "") + (result.data[i].season ? " " + (result.data[i].season) : ""),
          year: +parseInt(result.data[i].year, 10),});*/
        //page.entries++;
        break;

      default:
        print("Unknown id in result: " + result.id);
        print(JSON.stringify(item, null, 4));
        return;
    }
  }

    tmp = ''
    if (result.data.files) {

      //vyvodim spisok sezonov
      for (var i = 0; i < result.data.files.length; i++) {
        if (tmp !== result.data.files[i].season_translation && result.data.files[i].season_translation !== null) {
          tmp = result.data.files[i].season_translation
          page.appendItem(PREFIX + ":filter-videos:" + result.data.info.id + ':' + 'title' + ':' + result.data.files[i].season_translation_id, "directory", {
            title: result.data.files[i].season_translation
          });
        }
      }

      print(result.data.files.length)
      print('^^^^^^^^^^^result.data.files.length^^^^^^^^^^')
      if (result.data.files.length > 1) {
        for (j in result.data.files) {
          if (result.data.files[j].season_translation_id == undefined || result.data.files[j].season_translation_id == filter) {
            if (result.data.files[j].episode == 1) {
             log.p(result.data.files[j].season + ' ' + result.data.files[j].episode)
              page.appendItem("", "separator", {
                title: ('Сезон ' + result.data.files[j].season)
              });
            }
            data = {
              title: result.data.info.title_en !== "" ? result.data.info.title_en : result.data.info.title_ru,
              year: result.data.info.year,
              season: result.data.files[j].season,
              episode: result.data.files[j].episode,
              url: result.data.files[j].url,
              icon: result.data.info.image_file ? result.data.info.image_file : ''
            };

           log.p(result.data.files[j].season)
            item = page.appendItem(PREFIX + ':' + result.id + ':' + escape(JSON.stringify(data)), "video", {
              title: (result.data.files[j].title + (result.data.files[j].season_translation ? ' (' + result.data.files[j].season_translation + ')' : '')),
              description: ((result.data.info.translation ? coloredStr('Перевод: ', orange) + result.data.info.translation + (result.data.files[j].season_translation ? ', ' + result.data.files[j].season_translation : '') + '\n' : '') + (countries ? coloredStr('Страна: ', orange) + countries + '\n' : '') + (directors ? coloredStr('Режиссер: ', orange) + directors + ' ' : '') + (actors ? '\n' + coloredStr('В ролях актеры: ', orange) + actors + '\n' : '') + (result.data.info.description ? coloredStr('Описание: ', orange) + result.data.info.description : '')),
              duration: result.data.info.duration ? result.data.info.duration : '',
              rating: result.data.info.hd_rating * 10,
              genre: genres ? genres : '',
              year: result.data.info.year ? parseInt(result.data.info.year, 10) : '',
              icon: result.data.info.image_file ? result.data.info.image_file : ''
            });

            //item.bindVideoMetadata({title: result.data.info.title_en, season: 2, episode: parseInt(i)+1,  year: parseInt(result.data.info.year)})
          }
          //code
        }
        //code
      }
    }
}


exports.list = function(params, page) {

  page.loading = true;
  page.type = 'directory';
  page.model.contents = 'grid';
 // page.entries = 0;

  function loader() {
      api.call(params, page, function(result) {
        if (result.id && result.data.length === 0) {
          page.type = 'empty';
          return;
        }
        populatePageFromResults(page, result);
        oprint(params)
        if (params['start'] !== null) params['start'] = params['start'] + params['limit']
        oprint(params)
        page.haveMore(result.endOfData !== undefined && !result.endOfData);
      });
  }

  loader();
  page.asyncPaginator = loader;
}
exports.searchlist = function(params, page) {

  page.loading = true;
  //page.type = 'directory';
  page.entries = 0;

  function loader() {
      api.call(params, page, function(result) {
        if (result.id && result.data.length === 0) {
          page.type = 'empty';
          return;
        }
        populatePageFromResults(page, result);
        oprint(params)
        if (params['start'] !== null) params['start'] = params['start'] + params['limit']
        oprint(params)
        page.haveMore(result.endOfData !== undefined && !result.endOfData);
      });
  }

  loader();
  page.asyncPaginator = loader;
}

exports.moviepage = function(params, page, filter){
  page.loading = true;
  page.type = 'directory';
  
if (filter == 'undefined') {
  
  var URL = 'http://hdserials.galanov.net/backend/model.php';
  var opts = {
    method: 'POST',
    headers: {
      'User-Agent': UA
    },
    args: [params || {}],
    debug: service.debug,
    noFail: true, // Don't throw on HTTP errors (400- status code)
    compression: true, // Will send 'Accept-Encoding: gzip' in request
    caching: true, // Enables Movian's built-in HTTP cache
  };

  result = http.request(URL, opts)
  page.loading = false;
  result = JSON.parse(result)
}
log.p(result)
        if (result.data.genres) {
            genres = "";
            for (i in result.data.genres) {
                genres += result.data.genres[i].title_ru;
                if (i < result.data.genres.length - 1) genres += ', ';
            }
        }
        if (result.data.countries) {
            countries = "";
            for (i in result.data.countries) {
                countries += result.data.countries[i].title_ru;
                if (i < result.data.countries.length - 1) countries += ', ';
            }
        }
        if (result.data.actors) {
            actors = "";
            for (i in result.data.actors) {
                actors += result.data.actors[i].title_ru;
                if (i < result.data.actors.length - 1) actors += ', ';
            }
        }
        if (result.data.directors) {
            directors = "";
            for (i in result.data.directors) {
                directors += result.data.directors[i].title_ru;
                if (i < result.data.directors.length - 1) directors += ', ';
            }
        }
        
    if (result.data.files) {
      //vyvodim spisok sezonov
      tmp = ''
      for (var i = 0; i < result.data.files.length; i++) {
        if (tmp !== result.data.files[i].season_translation && result.data.files[i].season_translation !== null) {
          tmp = result.data.files[i].season_translation
          page.appendItem(PREFIX + ":filter-videos:" + result.data.info.id + ':' + 'title' + ':' + result.data.files[i].season_translation_id, "directory", {
            title: result.data.files[i].season_translation
          });
        }
      }
    }

    if (result.data.files.length > 1) {
                  for (j in result.data.files) {
                if (result.data.files[j].season_translation_id == filter || result.data.files[j].season_translation_id == undefined) {
                    if (result.data.files[j].episode == 1) {
                        log.p(result.data.files[j].season + ' ' + result.data.files[j].episode)
                        page.appendItem("", "separator", {
                            title: ('Сезон ' + result.data.files[j].season)
                        });
                    }
                    data = {
                        title: result.data.info.title_en !== "" ? result.data.info.title_en : result.data.info.title_ru,
                        year: result.data.info.year,
                        season: +result.data.files[j].season < 10 ? ('0'+result.data.files[j].season) : result.data.files[j].season,
                        episode: +result.data.files[j].episode < 10 ? ('0'+result.data.files[j].episode) : result.data.files[j].episode,
                        url: result.data.files[j].url,
                        icon: result.data.info.image_file ? result.data.info.image_file : ''
                    };

                   log.p(result.data.files[j].season)
                    item = page.appendItem(PREFIX + ':' + result.id + ':' + escape(JSON.stringify(data)), "video", {
                        title: (result.data.files[j].title + (result.data.files[j].season_translation ? ' (' + result.data.files[j].season_translation + ')' : '')),
                        description: ((result.data.info.translation ? coloredStr('Перевод: ', orange) + result.data.info.translation + (result.data.files[j].season_translation ? ', ' + result.data.files[j].season_translation : '') + '\n' : '') + (countries ? coloredStr('Страна: ', orange) + countries + '\n' : '') + (directors ? coloredStr('Режиссер: ', orange) + directors + ' ' : '') + (actors ? '\n' + coloredStr('В ролях актеры: ', orange) + actors + '\n' : '') + (result.data.info.description ? coloredStr('Описание: ', orange) + result.data.info.description : '')),
                        duration: result.data.info.duration ? result.data.info.duration : '',
                        rating: result.data.info.hd_rating * 10,
                        genre: genres ? genres : '',
                        year: result.data.info.year ? parseInt(result.data.info.year, 10) : '',
                        icon: result.data.info.image_file ? result.data.info.image_file : ''
                    })//.bindVideoMetadata({title: result.data.info.title_en, season: +data.season, episode: +data.episode});
                    .bindVideoMetadata({title: data.title +' S'+data.season+'E'+data.episode});

log.p({title: result.data.info.title_ru, season: data.season, episode: data.episode})
                   // item.bindVideoMetadata({title: result.data.info.title_en, season: data.season, episode: data.episode})
                }
                //code
            }
        } else {
            for (i in result.data.files) {
               log.p(result.data.info.title_en)
                data = {
                    title: result.data.info.title_en !== "" ? result.data.info.title_en : result.data.info.title_ru,
                    year: result.data.info.year,
                    season: result.data.files[i].season,
                    episode: result.data.files[i].episode,
                    url: result.data.files[i].url,
                    icon: result.data.info.image_file ? result.data.info.image_file : ''
                };

                item = page.appendItem(PREFIX + ':' + result.id + ':' + escape(JSON.stringify(data)), "video", {
                    title: (result.data.files[i].title),
                    description: ((result.data.info.translation ? coloredStr('Перевод: ', orange) + result.data.info.translation + '\n' : '') + (countries ? coloredStr('Страна: ', orange) + countries + '\n' : '') + (directors ? coloredStr('Режиссер: ', orange) + directors + ' ' : '') + (actors ? '\n' + coloredStr('В ролях актеры: ', orange) + actors + '\n' : '') + (result.data.info.description ? coloredStr('Описание: ', orange) + result.data.info.description : '')),
                    duration: result.data.info.duration ? result.data.info.duration : '',
                    rating: result.data.info.hd_rating * 10,
                    genre: genres ? genres : '',
                    year: result.data.info.year ? parseInt(result.data.info.year, 10) : '',
                    icon: result.data.info.image_file ? unescape(result.data.info.image_file) : ''
                });
                //item.bindVideoMetadata({title: result.data.info.title_en, season: 2, episode: parseInt(i)+1,  year: parseInt(result.data.info.year)})
            }
        }


page.loading = false;
}