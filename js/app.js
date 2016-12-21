var app = window.app || {};

app.ViewModel = function(){
  var self = this;
  var locations = app.model.locations;

  // utility function to compare 2 arrays
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

  // search string to filter location list
  self.filterValue = ko.observable();

  var prevFiltered = [];
  // when filterValue is edited, show updated list of locations
  self.filterValue.subscribe(function(value){
    var filtered = [];

    value = value.trim().toLowerCase();

    if(!value){
      // if the search string is empty, show all locations
      filtered = locations;
    }
    else{
      locations.map(function(item){
        // show only those locations which contain filterValue in its address
        if(item.address.toLowerCase().indexOf(value) >= 0){
          filtered.push(item);
        }
      });
    }

    // apply changes to the locations list only when new list is different
    if(!compareArrays(prevFiltered, filtered)){
      // unselect the currently selected location
      self.chosenLocation(null);

      // update the location list shown on the screen
      self.filteredLocations(filtered);

      if(filtered.length === 1){
        // if there is just one result, automatically select it
        self.chooseLocation(filtered[0]);
      }
      prevFiltered = filtered;
    }
  });

  // list of locations shown on the screen
  self.filteredLocations = ko.observableArray();

  self.filteredLocations.subscribe(function(value){
    // rerender markers when locations list is updated
    app.view.renderMarkers(value);
  });

  // check if the search string matches any results
  self.noFilteredResults = ko.computed(function(){
    return !self.filteredLocations().length;
  });

  // location selected by the user
  self.chosenLocation = ko.observable();

  self.chosenLocation.subscribe(function(value){
    if(!value){
      // when location is unselected, hide associated data from the screen
      app.view.hideInfoWindow();
      app.view.hideHeatmap();
    }
  });

  // when a new location is chosen, render all associated to it data
  self.chooseLocation = function(location){
    // save previous location
    var prev = self.chosenLocation();
    // set new location
    self.chosenLocation(location);
    // use info about previous location for smooth animation
    app.view.fitLocation(location, prev);

    // animate marker
    app.view.setBouncer(location);

    var heatmapPromise = app.model.ajaxBostonPolice(
      {district: location.district}
    );
    // show heatmap of the crimes
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
    // show info window with statistics about the nature of the crimes
    app.view.renderInfoWindow(location, unarmedPromise, armedPromise);
  };

  locations.map(function(item){
    // for each marker register an event listener,
    // which will select the location when the marker is clicked
    item.marker.addListener('click',function(){
      self.chooseLocation(item);
    });
  });

  // check if the given location is selected by the user
  self.isChosen = function(location){
    return location === self.chosenLocation();
  };

  // by default the search string is empty, i.e all locations are shown
  self.filterValue('');
  // TODO: add animations to slide-in\slide-out the sidebar
  // TODO: when location is chosen, hide the sidebar on small screens
  // TODO: responsiveness
  // TODO: add normalize.css
  // TODO: add more attribution in README
};

ko.applyBindings(new app.ViewModel());


$(document).ready(function(){
  var menuOpened = false;
	$('#menu-button').click(function(){
		$(this).toggleClass('open');

    if(menuOpened){
      $('.st-container').removeClass('st-effect-11 st-menu-open');
    }
    else{
      $('.st-container').addClass('st-effect-11 st-menu-open');
    }

    menuOpened = !menuOpened;
	});
});
