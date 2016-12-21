var app = window.app || {};

app.view = {
  map: null,
  fitAllBounds: function(){},
  fitLocation: function(){},

  heatmap: null,
  SPOT_RADIUS: 1/1500,
  renderHeatmap: function(){},
  hideHeatmap: function(){},

  markers: [],
  renderMarkers: function(){},
  setBouncer: function(){},

  infoWindow: null,
  renderInfoWindow: function(){},
  hideInfoWindow: function(){},

  mobileSidebarOpen: function(){},
  mobileSidebarClose: function(){},
  mobileSidebarToggle: function(){}
};

(function(){
  // on page load, show a map of Boston
  var boston = {lat: 42.3600825, lng: -71.0588801};
  app.view.map = new google.maps.Map(document.getElementById('map'), {
    center: boston,
    zoom: 14,
    mapTypeControl: false
  });

  // for the given array of LatLngBounds, make the map to fit every given bound
  app.view.fitAllBounds = function(boundsList){
    var currentBounds;
    boundsList.map(function(bounds, i){
      if(!i){
        currentBounds = bounds;
      }
      else{
        currentBounds.union(bounds);
      }
    });
    if(currentBounds){
      // if the boundsList wasn't empty, adjust the map to show them all
      app.view.map.fitBounds(currentBounds);
    }
  };

  // make the map to fit the given location
  app.view.fitLocation = function(to, from){
    if(!from){
      app.view.map.fitBounds(to.getBounds());
    }
    else{
      // try to make transition smooth if 'from' parameter is provided
      app.view.map.panToBounds(to.getBounds());
    }
  };

  // create a heatmap
  app.view.heatmap = new HeatmapOverlay(app.view.map,
    {
      "scaleRadius": true,
      "radius": app.view.SPOT_RADIUS,
      "maxOpacity": 0.5,
      "useLocalExtrema": true,
      blur: .999,
      latField: 'lat',
      lngField: 'lng',
      valueField: 'value'
    }
  );

  app.view.renderHeatmap = function(dataPromise){
    dataPromise.done(function(data) {
      // wait until the data is loaded and draw a heatmap

      var heatmapData = [];

      data.map(function(crime, i){
        var coords = crime.location.coordinates;
        if(coords[0] && coords[1]){
          // convert raw data to a special format
          heatmapData.push({
            lat: coords[1],
            lng: coords[0],
            value: 1
          });
        }
      });

      // init drawing by setting the data
      app.view.heatmap.setData({max: heatmapData.length, data: heatmapData});
    }).fail(function(){
      // or gracefully fail
      alert('Crime reports are not available at this moment');
    });
  };

  app.view.hideHeatmap = function(){
    // set empty data to hide the heatmap
    app.view.heatmap.setData({max:0, data:[]});
  };

  // sets the map to markers, i.e show all markers from app.view.markers array
  function setMapToMakers(map){
    var length = app.view.markers.length;
    for(var i = 0; i < length; i++){
      app.view.markers[i].setMap(map);
    }
  }

  // hide all currently visible markers
  function clearMarkers(){
    setMapToMakers(null);
  }

  // will be initialized on the first 'app.view.renderMarkers' call
  var defaultBounds = null;

  app.view.renderMarkers = function(locations){
    // remove existing markers if any
    clearMarkers();

    if(!locations.length){
      if(defaultBounds){
        // if nothing to render, try to use the default value
        app.view.fitAllBounds(defaultBounds);
      }
      return ;
    }

    var markers = [];
    var bounds = [];
    locations.map(function(loc){
      markers.push(loc.marker);
      bounds.push(loc.getBounds());
    });

    // show new markers
    app.view.markers = markers;
    setMapToMakers(app.view.map);

    // adjust map so that all markers are visible
    app.view.fitAllBounds(bounds);

    if(!defaultBounds){
      defaultBounds = bounds;
    }
  };

  var bouncer = null;
  // start marker's animation and make sure that
  // there's always not more than one animated marker
  app.view.setBouncer = function(location){
    if(location.marker === bouncer){
      if(bouncer.isBouncing()){
        // do nothing if the marker is already animated
        return ;
      }
    }
    else{
      if(bouncer){
        // stop the previous marker's animation
        bouncer.stopBouncing();
      }
      bouncer = location.marker;
    }
    // animate marker
    bouncer.startBouncing();
  };

  // create an instance of infoWindow
  app.view.infoWindow = new google.maps.InfoWindow({});

  app.view.renderInfoWindow = function(location, unarmedPromise, armedPromise){
    var address = location.address;
    var marker = location.marker;
    var district = location.district;
    // infoWindow content's template
    var html =  '<div class="info-header">' +
                  '<span class="address">' +
                     address +
                  '</span>' +
                  ', ' +
                  '<a href="https://data.cityofboston.gov/Public-Safety/Crime-Incident-Reports-July-2012-August-2015-Sourc/7cdf-6fgx">'+
                    'Crime Reports' +
                  '</a>' +
                  ', 2015' +
                '</div>' +
                '<div>' +
                  '<span class="info-column">Unarmed incidents: </span>' +
                  '<span class="info-unarmed">loading</span>' +
                '</div>' +
                '<div>' +
                  '<span class="info-column">Armed incidents: </span>' +
                  '<span class="info-armed">loading</span>' +
                '</div>';
    var element = $(html);
    // create HTML node
    var node = $('<div>').append(element)[0];
    // set the HTML node as content of the infoWindow
    app.view.infoWindow.setContent(node);
    // show infoWindow
    app.view.infoWindow.open(app.view.map, marker);

    // wait until data is loaded and update corresponding HTML nodes
    // or report inability to load the data

    armedPromise.done(function(data){
      var count = data[0].count_compnos;
      element.find('.info-armed').text(count);
    }).fail(function(){
        element.find('.info-armed').text('not available');
    });

    unarmedPromise.done(function(data){
      var count = data[0].count_compnos;
      element.find('.info-unarmed').text(count);
    }).fail(function(){
        element.find('.info-unarmed').text('not available');
    });
  };

  app.view.hideInfoWindow = function(){
    app.view.infoWindow.close();
  };

  var button = $('#menu-button');
  var container = $('.st-container');
  var sidebarOpened = false;

  app.view.mobileSidebarOpen = function(){
    button.addClass('open');
    container.addClass('st-effect-11 st-menu-open');
    sidebarOpened = true;
  };

  app.view.mobileSidebarClose = function(){
    button.removeClass('open');
    container.removeClass('st-effect-11 st-menu-open');
    sidebarOpened = false;
  };

  app.view.mobileSidebarToggle = function(){
    if(sidebarOpened){
      app.view.mobileSidebarClose();
    }
    else{
      app.view.mobileSidebarOpen();
    }
  };

  button.click(app.view.mobileSidebarToggle);
  $(document).click(function(event){
    if(sidebarOpened && !$(event.target).closest('#sidebar').length){
      app.view.mobileSidebarClose();
    }
  });
})();
