var app = window.app || {};

app.model = {
  locations: []
};

(function(){
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
