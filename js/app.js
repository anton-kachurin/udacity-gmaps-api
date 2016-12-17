var app = window.app || {};

app.ViewModel = function(){
  var self = this;
  var locations = app.model.locations;

  self.filterValue = ko.observable();

  function compareArrays(arr1, arr2){
    if(arr1.length !== arr2.length){
      return false;
    }

    var equal = true;
    arr1.map(function(item, i){
      if(item !== arr2[i]){
        equal = false;
      }
    });

    return equal;
  }

  var prevFiltered = [];
  self.filterValue.subscribe(function(value){
    var filtered = [];

    value = value.trim().toLowerCase();

    if(!value){
      filtered = locations;
    }
    else{
      locations.map(function(item){
        if(item.address.toLowerCase().indexOf(value) >= 0){
          filtered.push(item);
        }
      });
    }

    if(!compareArrays(prevFiltered, filtered)){
      self.chosenLocation(null);

      self.filteredLocations(filtered);

      if(filtered.length === 1){
        self.chooseLocation(filtered[0]);
      }
    }

    prevFiltered = filtered;
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

    app.view.setBouncer(location);

    var heatmapPromise = app.model.ajaxBostonPolice(
      {district: location.district}
    );
    app.view.renderHeatmap(heatmapPromise);

    var unarmedPromise = app.model.ajaxBostonPolice({
      district: location.district,
      where: "weapontype='Unarmed'",
      group: "weapontype",
      select: "count(compnos)"
    });
    var armedPromise = app.model.ajaxBostonPolice({
      district: location.district,
      where: "weapontype<>'Unarmed'",
      select: "count(compnos)"
    });
    app.view.renderInfoWindow(location, unarmedPromise, armedPromise);
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
  // TODO: change page title
  // TODO: add comments
  // TODO: responsiveness
  // TODO: add locations
};

ko.applyBindings(new app.ViewModel());
