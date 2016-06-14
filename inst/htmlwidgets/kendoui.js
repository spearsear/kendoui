HTMLWidgets.widget({

  name: 'kendoui',

  type: 'output',

  factory: function(el, width, height) {
    var renderCalendar = function(x){
	  var syncData = function(d){
	      if(x.options.hasOwnProperty('date_input_id')){
		  //associate element with date_input_id with date_current
  		  $('input',$('#' + x.options.date_input_id)).val(d);
		  //update shiny server on date change
		  Shiny.onInputChange(x.options.date_input_id, d);
	      }
	  };
	  var onChange = function() {
	      syncData(this.value())
	  };
	  var onNavigate = function() {
	      syncData(this.current());
	  }
	  //kendo.culture("zh-CN");
	  kendo.culture(x.options.culture);
          $(el).kendoCalendar({
	      //value: new Date(2016, 2, 1) or new Date('2015-01-12T10:12:12Z') ISO format of date, always use UTC to avoid 
	      //some browser interpret as local time
	      value: new Date(x.options.date_current),
	      change: onChange,
	      navigate: onNavigate,
	      format: "yyyy-MM-dd" 
	  });
	  syncData(x.options.date_current);
    };

    var renderSlider = function(x){
	$(el).kendoSlider({
	    orientation: x.options.orientation,
	    min: x.options.min,
	    max: x.options.max,
	    smallStep: x.options.smallStep,
	    largeStep: x.options.largeStep,
	    showButtons: false
	})
    }

    // TODO: define shared variables for this instance
    return {
      initialize: function(el, width, height) {
      },

      renderValue: function(x) {
	  if (x.type == 'calendar') {
	      renderCalendar(x);
	  } else if (x.type == 'slider'){
	      renderSlider(x);
	  } else {
	      $(el).html('ui type not supported');
	  }
      },

      resize: function(width, height) {
        // TODO: code to re-render the widget with a new size	
      },
    };
  }
});
