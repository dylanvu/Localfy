(function() {
  'use strict';

  const concerts = [];

  const setUpAudioElement = function(url) {
    if (url === null) {
      return;
    }

    const $audio = $('<audio controls>');
    const $source = $('<source>');

    $source.attr('src', url);
    $source.attr('type', 'audio/mpeg');
    $audio.append($source);

    return $audio;
  };

  const formatDate = function(date) {
    const dateArr = date.toString().split(' ');
    const day = dateArr[0];
    const month = dateArr[1];
    const dayNum = dateArr[2];
    const year = dateArr[3];
    let min = date.getMinutes();
    let hour = date.getHours();
    let ext;

    if (min < 10) {
      min = `0${min}`;
    }

    if (hour > 12) {
      hour -= 12;
      ext = 'PM';
      if (hour === 0) {
        hour = 12;
        ext = 'AM';
      }
    }
    else {
      ext = 'AM';
    }

    return `${day} ${dayNum} ${month} ${year} @${hour}:${min}${ext}`;
  };

  const setUpCardContent = function(concert) {
    const $concertDetails = $('<ul>').addClass('card-text list-unstyled');

    $concertDetails.append(formatDate(concert.date));
    $concertDetails.append(`<li>${concert.venue.name}</li>`);
    $concertDetails.append(
      `<li>${concert.venue.city}, ${concert.venue.state}, ${concert.venue.country}</li>`
    );
    $concertDetails.append(
      `<li><a href="${concert.url}" target="_blank">Buy Tickets</a></li>`
    );

    return $concertDetails;
  };

  const renderConcerts = function() {
    // Sort dates in ascending order
    concerts.sort((a, b) => {
      return a.date - b.date;
    });

    $('#concerts').empty();

    if (concerts.length === 0) {
      const $h3 = $('<h3>');

      $h3.text('Find amazing bands playing near you.');
      $('#concerts').append($h3);

      return;
    }

    for (const concert of concerts) {
      const $h3 = $('<h3>').addClass('card-title');
      const $a = $('<a>').attr('href', concert.artist.url);
      $a.attr('target', '_blank');

      $a.append(concert.artist.name);
      $h3.append($a);

      const $cardBlock = $('<div>').addClass('card-block');

      $cardBlock.append($h3);

      $cardBlock.append(setUpAudioElement(concert.track.preview));

      $cardBlock.append(setUpCardContent(concert));

      const $cardBlockCol = $('<div>').addClass(
        'col-xs-12 col-sm-6 col-md-7 col-lg-8 flex-sm-first'
      );

      $cardBlockCol.append($cardBlock);

      const $cardImg = $('<img>').addClass(
        'img-fluid float-xs-right'
      );

      $cardImg.attr('src', concert.artist.image);

      const $cardImgCol = $('<div>').addClass(
        'col-xs-12 col-sm-6 col-md-5 col-lg-4 flex-xs-first'
      );

      $cardImgCol.append($cardImg);

      const $row = $('<div>').addClass('row');

      $row.append($cardBlockCol);
      $row.append($cardImgCol);

      const $card = $('<div>').addClass('card');

      $card.append($row);

      $('#concerts').append($card);
    }
  };

  const getArtistTopTrack = function(concert) {
    if (concert.artist.id === null) {
      concert.track = {
        artist: null,
        album: null,
        trackName: null,
        preview: null
      };

      concerts.push(concert);

      return;
    }

    const $xhr = $.ajax({
      method: 'GET',
      url: `https://api.spotify.com/v1/artists/${concert.artist.id}/top-tracks?country=US`,
      dataType: 'json'
    });

    $xhr.done((data) => {
      if ($xhr.status !== 200) {
        return;
      }

      if (data.tracks.length === 0) {
        concert.track = {
          artist: null,
          album: null,
          trackName: null,
          preview: null
        };
      }
      else {
        concert.track = {
          artist: data.tracks[0].artists[0].name,
          album: data.tracks[0].album.name,
          trackName: data.tracks[0].name,
          preview: data.tracks[0].preview_url
        };
      }

      concerts.push(concert);
      renderConcerts();
    });

    $xhr.fail((err) => {
      console.log(err);
    });
  };

  const getArtistInfo = function(concert) {
    const $xhr = $.ajax({
      method: 'GET',
      url: `https://api.spotify.com/v1/search?q=${concert.artist.name}&type=Artist`,
      dataType: 'json'
    });

    $xhr.done((data) => {
      if ($xhr.status !== 200) {
        return;
      }

      // Check for artists in results
      if (data.artists.items.length === 0) {
        return;
      }

      concert.artist.id = data.artists.items[0].id;
      concert.artist.url = data.artists.items[0].external_urls.spotify;

      // Add generic avatar if artist does not have an image
      if (data.artists.items[0].images.length === 0) {
        concert.artist.image = './assets/images/avatar.jpg';
      }
      else {
        concert.artist.image = data.artists.items[0].images[0].url;
      }

      getArtistTopTrack(concert);
    });

    $xhr.fail((err) => {
      console.log(err);
    });
  };

  const getConcerts = function(city) {
    const $xhr = $.ajax({
      method: 'GET',
      url: `https://cors-anywhere.herokuapp.com/http://api.bandsintown.com/events/search.json?api_version=2.0&app_id=Localfy&location=${city}&radius=10`,
      dataType: 'json'
    });

    $xhr.done((data) => {
      if ($xhr.status !== 200) {
        return;
      }

      const currentDate = new Date();

      for (const result of data) {
        let concertDate = new Date(result.datetime);

        // Adjust UTC to local time
        const offsetInMs = concertDate.getTimezoneOffset() * 60 * 1000;

        concertDate = new Date(concertDate.getTime() + offsetInMs);

        // Check for concerts that have already passed
        if (currentDate.getTime() > concertDate.getTime()) {
          continue;
        }

        // Create concert objects
        const concert = {
          url: result.url,
          date: concertDate,
          artist: {
            name: result.artists[0].name
          },
          venue: {
            name: result.venue.name,
            city: result.venue.city,
            state: result.venue.region,
            country: result.venue.country
          }
        };

        getArtistInfo(concert);
      }

      concerts.length = 0;
    });

    $xhr.fail((err) => {
      console.log(err);
    });
  };

  $('form').on('submit', (event) => {
    event.preventDefault();

    const searchQuery = $('#search').val();

    if (searchQuery.trim() === '') {
      return;
    }

    getConcerts(searchQuery);
  });
})();
