(function() {
  'use strict';

  $('.button-collapse').sideNav();

  // $('select').material_select();

  const concerts = [];

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
        return;
      }

      concert.artist.id = data.artists.items[0].id;

      if (data.artists.items[0].images.length === 0) {
        concert.artist.image = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/300px-No_image_available.svg.png';
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
      url: `https://cors-anywhere.herokuapp.com/http://api.bandsintown.com/events/search.json?api_version=2.0&app_id=Local&location=${city}&radius=10`,
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

    const searchQuery = $('#location').val();

    if (searchQuery.trim() === '') {
      return;
    }

    getConcerts(searchQuery);
  });
})();
