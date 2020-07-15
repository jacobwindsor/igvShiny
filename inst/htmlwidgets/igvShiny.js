HTMLWidgets.widget({

  name: 'igvShiny',
  type: 'output',

  factory: function(el, width, height) {

    var igvWidget = null;

    return {
      renderValue: function(options) {
          console.log("---- ~/github/igvShiny/inst/htmlwidgets, renderValue");
          console.log("     el: ");
          console.log(el);
          console.log("igv.js renderValue, wh: " + width + ", " + height)
          console.log("--------- options");
          console.log(options)
          var igvDiv;
          igvDiv = el; // $("#igvDiv")[0];
          var fullOptions = genomeSpecificOptions(options.genomeName, options.initialLocus,
                                                  options.displayMode, options.trackHeight)

         igv.createBrowser(igvDiv, fullOptions)
             .then(function (browser) {
                igvWidget = browser;
                window.igvBrowser = igvWidget;
                window.chromLocString = options.initialLocus;
                igvWidget.on('locuschange', function (referenceFrame){
                    var chromLocString = referenceFrame.label
                    window.chromLocString = chromLocString;
                    Shiny.setInputValue("currentGenomicRegion", chromLocString, {priority: "event"});
                    });
                igvWidget.on('trackclick', function (track, popoverData){
                   console.log("---- trackclick");
                   var x = popoverData;
                   //if(x.length == 4){
                   //   if (x[3].name == "id"){
                   console.log("--- about to contact Shiny")
                   //var id = x[3].value;
                   var message = x;
                   //var message = {id: id, date: Date()};
                   var messageName = "trackClick"
                   Shiny.onInputChange(messageName, message);
                   console.log("--- after contacting Shiny")
                    //  } // if id in the fourth field
                    //} // length == 4
                  console.log("click! 810");
                  console.log(x);
                  return undefined;
                  }); // on
               }); // then: promise fulflled
          },
      resize: function(width, height) {
        // TODO: code to re-render the widget with a new size
        }

    }; // return
  }  // factory
});  // widget
//------------------------------------------------------------------------------------------------------------------------
function genomeSpecificOptions(genomeName, initialLocus, displayMode, trackHeight)
{
  
    var hosted_genomes = ["hg38","hg19","hg18","mm10","gorGor4","panTro4", "panPan2", "susScr11","bosTau8","canFam3","rn6","danRer11","danRer10","dm6","ce11","sacCer3"];
    
    var base_options = {
      locus: initialLocus,
      flanking: 1000,
      showRuler: true,
      minimumBases: 5     
    };
    
    if(hosted_genomes.includes(genomeName)) {
      return Object.assign({}, base_options, { genome: genomeName })
    }
    
    else {
      console.error("Unsupported genome " + genomeName)
    }
} // genomeSpecificOptions
//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("redrawIgvWidget",

    function(message) {
        console.log("--- redrawIgvShiny")
        window.igvBrowser.resize();
        window.igvBrowser.visibilityChange();
        });

//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("showGenomicRegion",

    function(message) {
        //window.igvBrowser.search(message.roi);
        console.log("  about to call search on behalf of showGenomicRegion: ");
        console.log(message)
        window.igvBrowser.search(message.region)
        });

//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("getGenomicRegion",

    function(message) {
       console.log("--  about to return current genomic region");
       currentValue = window.chromLocString;
       console.log("current chromLocString: " + currentValue)
       Shiny.setInputValue("currentGenomicRegion", currentValue, {priority: "event"});
       })

//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("removeTracksByName",

   function(message){
       var trackNames = message.trackNames;
       console.log("=== removeTracksByName")
       console.log(trackNames)
       if(typeof(trackNames) == "string")
           trackNames = [trackNames];
       var count = window.igvBrowser.trackViews.length;

       for(var i=(count-1); i >= 0; i--){
          var trackView = window.igvBrowser.trackViews[i];
          var trackViewName = trackView.track.name;
          var matched = trackNames.indexOf(trackViewName) >= 0;
          console.log(" is " + trackViewName + " in " + JSON.stringify(trackNames) + "? " + matched);
          if (matched){
             window.igvBrowser.removeTrack(trackView.track);
             } // if matched
          } // for i

})  // removeTrackByName
//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("loadBedTrackFromFile",

   function(message){
      console.log("=== loadBedTrackFile");
      console.log(message);

       var uri = window.location.href + "tracks/" + message.filename;
       var config = {format: "bed",
                     name: "feature test",
                     url: uri,
                     type: "annotation",
                     order: Number.MAX_VALUE,
                     indexed: false,
                     displayMode: "EXPANDED",
                     sourceType: "file",
                     color: "lightGreen",
		     height: 50
                     };
      window.igvBrowser.loadTrack(config);
      }


);
//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("loadBedTrack",

   function(message){
      console.log("=== loadBedTrack");
      console.log(message)
      var trackName = message.trackName;
      var tbl = message.tbl;
      var color = message.color;
      var trackHeight = message.trackHeight;

      var config = {format: "bed",
                    name: trackName,
                    type: "annotation",
                    order: Number.MAX_VALUE,
                    features: tbl,
                    indexed: false,
                    displayMode: "EXPANDED",
                    color: color,
                    height: trackHeight
                    };
      window.igvBrowser.loadTrack(config);
      }


);
Shiny.addCustomMessageHandler("loadBedTrackUrl",

   function(message){
      console.log("=== loadLocalBedTrack");
      console.log(message)
      var trackName = message.trackName;
      var url = message.url;
      var color = message.color;
      var trackHeight = message.trackHeight;

      var config = {format: "bed",
                    name: trackName,
                    type: "annotation",
                    sourceType: "file",
                    url: url,
                    indexed: false,
                    displayMode: "EXPANDED",
                    color: color,
                    height: trackHeight
                    };
      window.igvBrowser.loadTrack(config);
      }


);
//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("loadGffTrackUrl",

   function(message){
      console.log("=== loadGffTrackUrl");
      console.log(message)
      var trackName = message.trackName;
      var url = message.url;
      var color = message.color;
      var trackHeight = message.trackHeight;

      var config = {format: "gff3",
                    name: trackName,
                    type: "annotation",
                    sourceType: "file",
                    url: url,
                    indexed: false,
                    displayMode: "EXPANDED",
                    color: color,
                    height: trackHeight
                    };
      window.igvBrowser.loadTrack(config);
      }


);
//-------
//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("loadBedGraphTrack",

   function(message){
      console.log("=== loadBedGraphTrack");
      console.log(message)
      var trackName = message.trackName;
      var tbl = message.tbl;
      var color = message.color;
      var trackHeight = message.trackHeight;
      var autoscale = message.autoscale;
      var min = message.min;
      var max = message.max;

      var config = {format: "bedgraph",
                    name: trackName,
                    type: "wig",
                    order: Number.MAX_VALUE,
                    features: tbl,
                    indexed: false,
                    displayMode: "EXPANDED",
                    //sourceType: "file",
                    color: color,
                    height: trackHeight,
                    autoscale: autoscale,
                    min: min,
                    max: max
                    };
      window.igvBrowser.loadTrack(config);
      }

);
//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("loadSegTrack",

   function(message){
      console.log("=== loadSegTrack");
      var trackName = message.trackName;
      var bedFeatures = message.tbl;

      var config = {format: "bed",
                    name: trackName,
                    type: "seg",
                    order: Number.MAX_VALUE,
                    features: bedFeatures,
                    indexed: false,
                    displayMode: "EXPANDED",
                    //sourceType: "file",
                    color: "red",
                    height: 50
                    };
      window.igvBrowser.loadTrack(config);
      }


);
//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("loadVcfTrack",

   function(message){

      console.log("=== loadVcfTrack");
      var trackName = message.trackName;
      var vcfFile = message.vcfDataFilepath;
      var dataURL = window.location.href + message.vcfDataFilepath;
      console.log("dataURL: " + dataURL);

      var config = {format: "vcf",
                     name: trackName,
                     url: dataURL,
                     order: Number.MAX_VALUE,
                     indexed: false,
                     displayMode: "EXPANDED",
                     sourceType: "file",
                     height: 100,
                     visibilityWindow: 1000000,
                     //homvarColor: homvarColor,
                     //hetvarColor: hetvarColor,
                     //homrefColor: homrefColor,
                     //color: locationColor,
                     type: "variant"
                    };


       window.igvBrowser.loadTrack(config);
       }


);
//------------------------------------------------------------------------------------------------------------------------
Shiny.addCustomMessageHandler("loadGenome", 
  function(message) {
    var options = message.options;
    console.log("=== loadGenome " + options.genomeName);
    var config = genomeSpecificOptions(options.genomeName, options.initialLocus,
                                                  options.displayMode, options.trackHeight);
                         
    window.igvBrowser.removeAllTracks();                         
    window.igvBrowser.loadGenome(config);
  }
); 