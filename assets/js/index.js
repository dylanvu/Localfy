(function() {
  'use strict';

  $('.button-collapse').sideNav();

  // $('select').material_select();

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
          return;
        }

        const concert = {
          url: result.url,
          date: concertDate,
          artist: result.artists[0],
          venue: {
            name: result.venue.name,
            city: result.venue.city,
            state: result.venue.region,
            country: result.venue.country
          }
        };

        getArtistInfo(concert);
      }
    });

    $xhr.fail((err) => {
      console.log(err);
    });
  };

  $('form').on('submit', () => {
    getConcerts($('#location').val());
  });
})();
