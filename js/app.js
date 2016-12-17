var app = window.app || {};

app.ViewModel = function(){
  var self = this;
  var locations = app.model.locations;

  self.filterValue = ko.observable();

  self.filterValue.subscribe(function(value){
    value = value.trim().toLowerCase();
    if(!value){
      self.filteredLocations(locations);
    }
    else{
      var filtered = [];
      locations.map(function(item){
        if(item.address.toLowerCase().indexOf(value) >= 0){
          filtered.push(item);
        }
      });

      self.chosenLocation(null);

      if(filtered.length === 1){
        self.chooseLocation(filtered[0]);
      }
      self.filteredLocations(filtered);
    }
  });

  self.filteredLocations = ko.observableArray();

  self.filteredLocations.subscribe(function(value){
    app.view.renderMarkers(value);
  });

  self.noFilteredResults = ko.computed(function(){
    return !self.filteredLocations().length;
  });

  self.chosenLocation = ko.observable();

  self.chosenLocation.subscribe(function(value){
    if(!value){
      app.view.hideInfoWindow();
      app.view.hideHeatmap();
    }
  });

  self.chooseLocation = function(location){
    // save previous location
    var prev = self.chosenLocation();
    // set new location
    self.chosenLocation(location);
    // use info about previous location for smooth animation
    app.view.fitLocation(location, prev);

    app.view.renderInfoWindow(location);
    app.view.renderHeatmap(location);
  };

  locations.map(function(item){
    item.marker.addListener('click',function(){
      self.chooseLocation(item);
    });
  });

  self.isChosen = function(location){
    return location === self.chosenLocation();
  };

  self.filterValue('');
  // TODO: change color for the selected marker
  // TODO: responsiveness
  // TODO: ajax error catching
  // TODO: show info in infoWindow
  // TODO: add attribution for the crime data
  // TODO: create README
  // TODO: add comments
};

ko.applyBindings(new app.ViewModel());
