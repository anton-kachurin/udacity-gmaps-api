var app = window.app || {};

app.model = {
  locations: [],
  RESULTS_LIMIT: 5000,
  ajaxBostonPolice: function(){},
  ajaxCache: {}
};

(function(){
  // ajax function loading data about crimes
  app.model.ajaxBostonPolice = function(options){
    var cacheKey = JSON.stringify(options);
    var cachedData = app.model.ajaxCache[cacheKey];
    if(cachedData){
      // if such data was already requested, use cached value
      var defer = $.Deferred();
      defer.resolve(cachedData);
      return defer;
    }

    // basic request parameters
    var request = {
      "$limit": app.model.RESULTS_LIMIT,
      'reptdistrict': options.district,
      "$where": "fromdate between "+
                "'2015-01-01T00:00:00' and '2015-12-31T23:59:59'"+
                (options.where?(" and " + options.where) : '')
    };

    // extended request parameters
    if(options.group){
      request['$group'] = options.group;
    }
    if(options.select){
      request['$select'] = options.select;
    }

    // load data
    var promise = $.ajax({
        url: "https://data.cityofboston.gov/resource/ufcx-3fdn.json",
        type: "GET",
        data: request
    }).done(function(data){
      // cache data to reduce bandwidth usage
      app.model.ajaxCache[cacheKey] = data;
    });

    // return a promise so the caller is able to use done() and fail() methods
    return promise;
  };

  // Location class
  function Location(data){
    var self = this;

    // neighborhood name
    self.address = data.formatted_address;

    // marker object, hidden while its 'setMap' method isn't called
    self.marker = new google.maps.Marker({
      position: data.geometry.location,
      title: self.address
    });

    // start marker's animation
    self.marker.startBouncing = function(){
      self.marker.setAnimation(google.maps.Animation.BOUNCE);
    };

    // stop marker's animation
    self.marker.stopBouncing = function(){
      self.marker.setAnimation(null);
    };

    // if the marker's animated
    self.marker.isBouncing = function(){
      return !!self.marker.getAnimation();
    };

    // return LatLngBounds for the location
    self.getBounds = function(){
      return new google.maps.LatLngBounds(
        data.geometry.viewport.southwest,
        data.geometry.viewport.northeast
      );
    };

    // district code needed for the Boston Police Department API
    self.district = data.reptdistrict;
  }

  // create a list of Location instances
  app.locations.map(function(loc, i){
    app.model.locations[i] = new Location(loc);
  });

})();
