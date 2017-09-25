(function() {

  // mapbox access token for Jay's account
  L.mapbox.accessToken = 'pk.eyJ1IjoiamVib3dlMyIsImEiOiJjajY1M3l6bWIxeTQwMndtcXRuN3F4ejFpIn0.aE7P49pqaBKjy2HTOw-tgw';


  // create the Leaflet map using mapbox.light tiles
  var map = L.mapbox.map('map', 'mapbox.light', {
    zoomSnap: .1,
    center: [-.23, 37.8],
    zoom: 7,
    minZoom: 6,
    maxZoom: 9,
    maxBounds: L.latLngBounds([-6.22, 27.72], [5.76, 47.83])
  }); // end map creation


  // create default options for circle markers
  var options = {
    pointToLayer: function(feature, ll) {
      return L.circleMarker(ll, {
        opacity: 1,
        weight: 2,
        fillOpacity: 0,
      })
    }
  }; // end create default options for circle markers


  // load CSV data
  omnivore.csv('data/kenya_education_2014.csv')
    .on('ready', function(e) {
      // convert the Leaflet GeoJson layer back into regular GeoJSON data, and...
      drawMap(e.target.toGeoJSON()); // send it to the drawMap() function and...
      drawLegend(e.target.toGeoJSON()); // send it to the drawLegend() function.
    }); // end CSV data loading


  // draw the map
  function drawMap(data) {

    var girlsLayer = L.geoJson(data, options).addTo(map);
    var boysLayer = L.geoJson(data, options).addTo(map);
    var currentGrade = $('.slider').val();

    map.fitBounds(girlsLayer.getBounds());

    // set colors of circle markers
    girlsLayer.setStyle({
      color: '#bb0000',
    });
    boysLayer.setStyle({
      color: '#006600',
    });

    resizeCircles(girlsLayer, boysLayer, 1);

    sequenceUI(girlsLayer, boysLayer);

    createTemporalLegend(currentGrade);

    retrieveInfo(boysLayer, currentGrade);

  }; // end drawMap() function


  // resize our default circles based on unique properties for girls' and boys' enrollment by grade
  function resizeCircles(girlsLayer, boysLayer, currentGrade) {

    girlsLayer.eachLayer(function(layer) {
      var radius = calcRadius(Number(layer.feature.properties['G' + currentGrade]));
      layer.setRadius(radius);
    });
    boysLayer.eachLayer(function(layer) {
      var radius = calcRadius(Number(layer.feature.properties['B' + currentGrade]));
      layer.setRadius(radius);
    });
  }; // end resizeCircles() function


  // calculate circle radii
  function calcRadius(val) {
    var radius = Math.sqrt(val / Math.PI);
    return radius * .5; // adjust .5 as a scale factor
  }; // end calcRadius() function


  // create a UI slider to change grade level
  function sequenceUI(girlsLayer, boysLayer) {

    // create Leaflet control for the slider
    var sliderControl = L.control({
      position: 'bottomleft'
    });

    // when added to the map
    sliderControl.onAdd = function(map) {

      // select the element with id of 'slider'
      var controls = L.DomUtil.get("slider");

      // disable the mouse events
      L.DomEvent.disableScrollPropagation(controls);
      L.DomEvent.disableClickPropagation(controls);

      // add slider to the control
      return controls;

    }

    // add the control to the map
    sliderControl.addTo(map);

    $('.slider')
      .on('input change', function() {
        var currentGrade = $(this).val();
        resizeCircles(girlsLayer, boysLayer, currentGrade);
        retrieveInfo(boysLayer, currentGrade);
        createTemporalLegend(currentGrade);
      });

  }; // end sequenceUI() function


  // add a temporal legend in sync with the UI slider
  function createTemporalLegend(currentGrade) {

    var temporalLegend = L.control({
      position: 'bottomleft' // place the temporal legend at bottom left corner
    });

    // when added to the map
    temporalLegend.onAdd = function(map) {

      var div = L.DomUtil.get("temporal"); // get the style settings

      // disable the mouse events
      L.DomEvent.disableScrollPropagation(div);
      L.DomEvent.disableClickPropagation(div);

      return div; // return the style settings

    }

    $('#temporal span').html(currentGrade); // change grade value to that currently selected by UI slider

    temporalLegend.addTo(map); // add the temporal legend to the map

  }; // end createTemporalLegend() function


  // draw a map legend
  function drawLegend(data) {

    // create Leaflet control for the legend
    var legend = L.control({
      position: 'bottomright'
    });
    // when added to the map
    legend.onAdd = function(map) {

      // select the element with id of 'legend'
      var div = L.DomUtil.get("legend");

      // disable the mouse events
      L.DomEvent.disableScrollPropagation(div);
      L.DomEvent.disableClickPropagation(div);

      // add legend to the control
      return div;

    }
    // add the control to the map
    legend.addTo(map);

    var dataValues = []; // create an empty array

    data.features.map(function(school) { // use the JavaScript map() function to iterate through each feature of the GeoJSON data

      for (var grade in school.properties) { // iterate through the properties

        var attribute = school.properties[grade];

        if (Number(attribute)) {

          dataValues.push(attribute); // push the numeric values for each grade level into an array
        }

      }
    });

    // sort our array
    var sortedValues = dataValues.sort(function(a, b) {
      return b - a;
    });

    // round the highest number and use as our large circle diameter
    var maxValue = Math.round(sortedValues[0] / 1000) * 1000;

    // calc the diameters
    var largeDiameter = calcRadius(maxValue) * 1.75,
      smallDiameter = largeDiameter / 2;

    // select our circles container and set the height
    $(".legend-circles").css('height', largeDiameter.toFixed());

    // set width and height for large circle
    $('.legend-large').css({
      'width': largeDiameter.toFixed(),
      'height': largeDiameter.toFixed()
    });
    // set width and height for small circle and position
    $('.legend-small').css({
      'width': smallDiameter.toFixed(),
      'height': smallDiameter.toFixed(),
      'top': largeDiameter - smallDiameter,
      'left': smallDiameter / 2
    })

    // label the max and median value
    $(".legend-large-label").html(maxValue);
    $(".legend-small-label").html((maxValue / 2));

    // adjust the position of the large based on size of circle
    $(".legend-large-label").css({
      'top': -11,
      'left': largeDiameter + 60,
    });

    // adjust the position of the large based on size of circle
    $(".legend-small-label").css({
      'top': smallDiameter - 11,
      'left': largeDiameter + 60,
    });

    // insert a couple hr elements and use to connect value label to top of each circle
    $("<hr class='large'>").insertBefore(".legend-large-label")
    $("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 8);

  }; // end drawLegend() function


  // retrieve an info window
  function retrieveInfo(boysLayer, currentGrade) {

    var info = $('#info'); // select the element and reference with variable

    boysLayer.on('mouseover', function(e) { // use boysLayer to detect mouseover events

      info.removeClass('none').show(); // remove the none class to display the element

      var props = e.layer.feature.properties; // derive the properties of the target layer

      // create two empty arrays
      var girlsValues = [],
        boysValues = [];

      // loop through a specific feature's properties and push values to the empty arrays
      for (var i = 1; i <= 8; i++) {
        girlsValues.push(props['G' + i]);
        boysValues.push(props['B' + i]);
      }

      // populate our info window HTML elements with the relevant information using jQuery
      $('#info span').html(props.COUNTY); // the name of the current county the user is hovering over
      $(".girls span:first-child").html('(grade ' + currentGrade + ')'); // the current grade level selected by the slider widget
      $(".boys span:first-child").html('(grade ' + currentGrade + ')');
      $(".girls span:last-child").html(props['G' + currentGrade]); // the raw total for the girls for that county and current grade
      $(".boys span:last-child").html(props['B' + currentGrade]); // the raw total for the boys for that county and current grade

      // create sparklines with jQuery and .sparkline() method
      $('.girlspark').sparkline(girlsValues, {
        width: '160px',
        height: '30px',
        lineColor: '#bb0000',
        fillColor: '#bb0000',
        spotRadius: 0,
        lineWidth: 2
      });
      $('.boyspark').sparkline(boysValues, {
        width: '160px',
        height: '30px',
        lineColor: '#006600',
        fillColor: '#006600',
        spotRadius: 0,
        lineWidth: 2
      });

      // raise opacity level as visual affordance
      e.layer.setStyle({
        fillOpacity: .6,
        fillColor: '#000000'
      });

    });

    // hide the info panel when mousing off layergroup and remove affordance opacity
    boysLayer.on('mouseout', function(e) {
      info.hide();
      e.layer.setStyle({
        fillOpacity: 0
      });
    });

    // when the mouse moves on the document
    $(document).mousemove(function(e) {
      // first offset from the mouse position of the info window
      info.css({
        "left": e.pageX + 6,
        "top": e.pageY - info.height() - 25
      });

      // if it crashes into the top, flip it lower right
      if (info.offset().top < 4) {
        info.css({
          "top": e.pageY + 15
        });
      }
      // if it crashes into the right, flip it to the left
      if (info.offset().left + info.width() >= $(document).width() - 40) {
        info.css({
          "left": e.pageX - info.width() - 80
        });
      }
    });

  }; // end retrieveInfo() function

})();
