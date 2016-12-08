(function() {
  'use strict';

  const concerts = [];

  const wireUpAudioPlayer = function(url) {
    if (url === null) {
      return '<p>preview not available</p>';
    }

    const $audio = $('<audio controls>');
    const $source = $('<source>');

    $source.attr('src', url);
    $source.attr('type', 'video/mpeg');
    $audio.append($source);

    return $audio;
  };

  const renderConcerts = function() {
    $('#concerts').empty();

    if (concerts.length === 0) {
      const $h3 = $('<h3>Enter your city to find concerts near you!</h3>');

      $h3.addClass('text-center');
      $('#concerts').append($h3);

      return;
    }

    for (const concert of concerts) {
      const $row = $('<div>').addClass('row');
      const $cardDiv = $('<div>').addClass('card');
      const $cardContent = $('<div>').addClass('col-xs-8 col-md-offset-1');
      const $cardImg = $('<div>').addClass('col-xs-4 col-md-2');
      const $img = $('<img>').addClass('img-responsive artistImage');

      $cardContent.append(`<h3>${concert.artist.name}</h3>`);
      $cardContent.append(wireUpAudioPlayer(concert.track.preview));
      $cardContent.append(`<p>${concert.date}</p>`);
      $cardContent.append(`<p>${concert.venue.name}</p>`);
      $cardContent.append(
        `<p>${concert.venue.city},
        ${concert.venue.state},
        ${concert.venue.country}</p>`
      );
      $cardContent.append(`<p><a href="${concert.url}">Buy Tickets</p>`);
      $cardDiv.append($cardContent);

      $img.attr('src', concert.artist.image);
      $cardImg.append($img);
      $cardDiv.append($cardImg);

      $row.append($cardDiv);

      $('#concerts').append($row);
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
        concert.artist.image = 'http://www.freeiconspng.com/uploads/profile-icon-9.png';
      }
      else {
        concert.artist.id = data.artists.items[0].id;
        concert.artist.url = data.artists.items[0].external_urls.spotify;

        if (data.artists.items[0].images.length === 0) {
          concert.artist.image = 'http://www.freeiconspng.com/uploads/profile-icon-9.png';
        }
        else {
          concert.artist.image = data.artists.items[0].images[0].url;
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
        const concertDate = new Date(result.datetime);

        if (currentDate.getDate() !== concertDate.getDate()) {
          continue;
        }

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
