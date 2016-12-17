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

  app.ajaxCache = {};
  function ajaxBostonPolice(options, callback){
    var cacheKey = JSON.stringify(options);
    var cachedData = app.ajaxCache[cacheKey];
    if(cachedData){
      callback(cachedData);
      return ;
    }
    var request = {
      "$limit": 5000,
      'reptdistrict': options.district,
      "$where": "fromdate between "+
                "'2015-01-01T00:00:00' and '2015-12-31T23:59:59'"+
                (options.where?(" and " + options.where) : '')
    };

    if(options.group){
      request['$group'] = options.group;
    }
    if(options.select){
      request['$select'] = options.select;
    }

    $.ajax({
        url: "https://data.cityofboston.gov/resource/ufcx-3fdn.json",
        type: "GET",
        data: request
    }).done(function(data){
      app.ajaxCache[cacheKey] = data;
      callback(data);
    });
  }

  function getCrimeList(district, callback){
    ajaxBostonPolice({district: district}, function(data) {
      console.log("Retrieved " + data.length + " records from the dataset!");
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
      callback(heatmapData);
    });
  }

  app.view.renderHeatmap = function(location){
    getCrimeList(location.district,function(data){
      app.view.heatmap.setData({max: data.length, data: data});
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

  function get_unarmed_data(district, callback){
    ajaxBostonPolice({
      district: district,
      where: "weapontype='Unarmed'",
      group: "weapontype",
      select: "count(compnos)"
    },
    function(data){
      callback(data[0].count_compnos);
    });
  }

  function get_armed_data(district, callback){
    ajaxBostonPolice({
      district: district,
      where: "weapontype<>'Unarmed'",
      group: "weapontype",
      select: "count(compnos)"
    },
    function(data){
      var count = 0;
      data.map(function(item){
        count += item.count_compnos * 1;
      });
      callback(count);
    });
  }

  app.view.renderInfoWindow = function(location){
    var address = location.address;
    var marker = location.marker;
    var district = location.district;
    var node = $('<b>'+address+'</b>')[0];
    app.view.infoWindow.setContent(node);
    app.view.infoWindow.open(app.view.map, marker);

    get_armed_data(district, function(count){console.log(count)})
  };

  app.view.hideInfoWindow = function(){
    app.view.infoWindow.close();
  };

})();
