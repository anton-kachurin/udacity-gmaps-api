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
      var isChosen = false;
      locations.map(function(item){
        if(item.address.toLowerCase().indexOf(value) >= 0){
          filtered.push(item);
          if(self.isChosen(item)){
            isChosen = true;
          }
        }
      });
      if(!isChosen){
        app.view.hideInfoWindow();
        app.view.hideHeatmap();
      }
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

  self.chosenLocation = ko.observable();

  self.chooseLocation = function(location){
    self.chosenLocation(location);
    app.view.renderHeatmap(location);
    app.view.fitLocation(location);
    app.view.renderInfoWindow(location);
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
  // TODO: smooth animation when choosing new location
};

ko.applyBindings(new app.ViewModel());
