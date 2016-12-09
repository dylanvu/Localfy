(function() {
  'use strict';

  const concerts = [];

  const wireUpAudioPlayer = function(url) {
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

  const renderConcerts = function() {
    // Sort dates in ascending order
    concerts.sort((a, b) => {
      return a.date - b.date;
    });

    $('#concerts').empty();

    if (concerts.length === 0) {
      const $h3 = $('<h3>Enter your city to find bands playing near you</h3>');

      $h3.addClass('text-center');
      $('#concerts').append($h3);

      return;
    }

    for (const concert of concerts) {
      const $cardBlockCol = $('<div>').addClass('col-xs-6');
      const $cardBlock = $('<div>').addClass('card-block');
      const $h3 = $('<h3>').addClass('card-title');

      $h3.append(concert.artist.name);
      $cardBlock.append($h3);

      const $audio = wireUpAudioPlayer(concert.track.preview);

      $cardBlock.append($audio);

      const $concertDetails = $('<ul>').addClass(
        'card-text list-unstyled'
      );

      $concertDetails.append(`<li>${concert.date}</li>`);
      $concertDetails.append(`<li>${concert.venue.name}</li>`);
      $concertDetails.append(
        `<li>${concert.venue.city}, ${concert.venue.state}, ${concert.venue.country}</li>`
      );
      $concertDetails.append(
        `<li><a href="${concert.url}">Buy Tickets</a>/</li>`
      );

      $cardBlock.append($concertDetails);
      $cardBlockCol.append($cardBlock);

      const $cardImgCol = $('<div>').addClass('col-xs-6');
      const $cardImg = $('<div>').addClass('card-img-bottom');

      $cardImg.css({
        'height': '15rem',
        'background': `url(${concert.artist.image}) center no-repeat`,
        'background-size': 'cover'
      });
      $cardImgCol.append($cardImg);

      const $row = $('<div>').addClass('row');

      $row.append($cardBlockCol);
      $row.append($cardImgCol);

      const $card = $('<div>').addClass('card');

      $card.append($row);

      $('#concerts').append($card);
    }
  };

  renderConcerts();

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

      if (data.artists.items.length === 0) {
        concert.artist.id = null;
        concert.artist.url = null;
        concert.artist.image = './assets/images/avatar.png';
      }
      else {
        concert.artist.id = data.artists.items[0].id;
        concert.artist.url = data.artists.items[0].external_urls.spotify;

        if (data.artists.items[0].images.length === 0) {
          concert.artist.image = './assets/images/avatar.png';
        }
        else {
          concert.artist.image = data.artists.items[0].images[1].url;
        }
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
        const offset = concertDate.getTimezoneOffset() * 60 * 1000;
        concertDate = new Date(concertDate.getTime() + offset);

        // Do nothing for concerts not happening today
        if (currentDate.getHours() - 1 > concertDate.getHours()) {
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
