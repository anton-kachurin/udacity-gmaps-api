var app = window.app || {};

app.view = {
  map: null,
  fitAllBounds: function(){},
  fitLocation: function(){},

  heatmap: null,
  renderHeatmap: function(){},
  hideHeatmap: function(){},

  markers: [],
  renderMarkers: function(){},
  setBouncer: function(){},

  infoWindow: null,
  renderInfoWindow: function(){},
  hideInfoWindow: function(){}
};

(function(){
  // on page load, show a map of Boston
  var boston = {lat: 42.3600825, lng: -71.0588801};
  app.view.map = new google.maps.Map(document.getElementById('map'), {
    center: boston,
    zoom: 14
  });

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
      app.view.map.fitBounds(currentBounds);
    }
  };

  app.view.fitLocation = function(to, from){
    if(!from){
      app.view.map.fitBounds(to.getBounds());
    }
    else{
      app.view.map.panToBounds(to.getBounds());
    }
  };

  // create a heatmap
  app.view.heatmap = new HeatmapOverlay(app.view.map,
    {
      "scaleRadius": true,
      "radius": 1/1000,
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
      var heatmapData = [];

      data.map(function(crime, i){
        var coords = crime.location.coordinates;
        if(coords[0] && coords[1]){
          heatmapData.push({
            lat: coords[1],
            lng: coords[0],
            value: 1
          });
        }
      });

      app.view.heatmap.setData({max: data.length, data: heatmapData});
    }).fail(function(){
      alert('Crime reports are not available at this moment');
    });
  };

  app.view.hideHeatmap = function(){
    app.view.heatmap.setData({max:0, data:[]});
  };

  // sets the map to all markers in the array
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

  var defaultBounds = null;

  app.view.renderMarkers = function(locations){
    // remove existing markers if any
    clearMarkers();

    if(!locations.length){
      if(defaultBounds){
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
  app.view.setBouncer = function(location){
    if(location.marker === bouncer){
      if(bouncer.isBouncing()){
        // do nothing
        return ;
      }
    }
    else{
      if(bouncer){
        bouncer.stopBouncing();
      }
      bouncer = location.marker;
    }
    bouncer.startBouncing();
  };

  app.view.infoWindow = new google.maps.InfoWindow({});

  app.view.renderInfoWindow = function(location, unarmedPromise, armedPromise){
    var address = location.address;
    var marker = location.marker;
    var district = location.district;
    var html =  '<div class="info-header">' +
                  '<span class="address">' +
                     address +
                  '</span>' +
                  ', 2015 report' +
                '</div>' +
                '<div>' +
                  '<span class="info-column">Unarmed incidents: </span>' +
                  '<span class="info-unarmed"></span>' +
                '</div>' +
                '<div>' +
                  '<span class="info-column">Armed incidents: </span>' +
                  '<span class="info-armed"></span>' +
                '</div>';
    var element = $(html);
    var node = $('<div>').append(element)[0];
    app.view.infoWindow.setContent(node);
    app.view.infoWindow.open(app.view.map, marker);

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

})();
