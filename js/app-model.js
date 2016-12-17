var app = window.app || {};

app.model = {
  locations: [],
  ajaxBostonPolice: function(){},
  ajaxCache: {}
};

(function(){
  app.model.ajaxBostonPolice = function(options){
    var cacheKey = JSON.stringify(options);
    var cachedData = app.model.ajaxCache[cacheKey];
    if(cachedData){
      var defer = $.Deferred();
      defer.resolve(cachedData);
      return defer;
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

    var promise = $.ajax({
        url: "https://data.cityofboston.gov/resource/ufcx-3fdn.json",
        type: "GET",
        data: request
    }).done(function(data){
      app.model.ajaxCache[cacheKey] = data;
    });

    return promise;
  };

  function Location(data){
    var self = this;

    self.address = data.formatted_address;

    self.marker = new google.maps.Marker({
      position: data.geometry.location,
      title: self.address
    });

    self.marker.startBouncing = function(){
      self.marker.setAnimation(google.maps.Animation.BOUNCE);
    };

    self.marker.stopBouncing = function(){
      self.marker.setAnimation(null);
    };

    self.marker.isBouncing = function(){
      return !!self.marker.getAnimation();
    };

    self.getBounds = function(){
      return new google.maps.LatLngBounds(
        data.geometry.viewport.southwest,
        data.geometry.viewport.northeast
      );
    };

    self.district = data.reptdistrict;
  }

  // create a list of locations
  app.locations.map(function(loc, i){
    app.model.locations[i] = new Location(loc);
  });

})();
