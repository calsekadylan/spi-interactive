(function(){

//psuedo-global variables
var attrArray = ["Rank_(SPI)", "Social_Progress_Index", "Rank_(BHN)", "Basic_Human_Needs",
                "Rank_(FW)", "Foundations_of_Well-Being", "Rank_(O)", "Opportunity"];

var expressed = attrArray[0];

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 1125,
        height = 540;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Robinson projection
    var projection = d3.geoRobinson()
        .scale(200)
        .translate([(width / 2)-75, (height / 2)+40]);

    var path = d3.geoPath()
        .projection(projection);

    //use d3.queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/SPI_Data.csv") //load attributes from csv
        .defer(d3.json, "data/countries.topojson") //load background spatial data
        .await(callback);

    function callback(error, csvData, world){
        //place graticule on the map
        setGraticule(map, path);

        //translate TopoJSON
        var worldCountries = topojson.feature(world, world.objects.collection).features;

        //join csv data to topojson
        worldCountries = joinData(worldCountries, csvData);

        //create color scale
        var colorScale = createColorScale(csvData);

        //add enumeration units to map
        setEnumerationUnits(worldCountries, map, path, colorScale);
      };
};

function setGraticule(map, path){

    //create graticule generator
    var graticule = d3.geoGraticule()
      .step([50, 50]); //place graticule lines every 50 degrees of longitude and latitude

    //create graticule background
    var gratBackground = map.append("path")
      .datum(graticule.outline()) //bind graticule background
      .attr("class", "gratBackground") //assign class for styling
      .attr("d", path) //project graticule

    //create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
      .data(graticule.lines()) //bind graticule lines to each element to be created
      .enter() //create an element for each datum
      .append("path") //append each element to the svg as a path element
      .attr("class", "gratLines") //assign class for styling
      .attr("d", path); //project graticule lines

};

function joinData(worldCountries, csvData){
  //loop through csv to assign each set of csv attribute values to geojson region
  for (var i=0; i<csvData.length; i++){
      var csvRegion = csvData[i]; //the current region
      var csvKey = csvRegion.adm0_a3; //the CSV primary key

  //loop through geojson regions to find correct region
  for (var a=0; a<worldCountries.length; a++){
      var geojsonProps = worldCountries[a].properties; //the current region geojson properties
      var geojsonKey = geojsonProps.adm0_a3; //the geojson primary key

      //where primary keys match, transfer csv data to geojson properties object
      if (geojsonKey == csvKey){

          //assign all attributes and values
          attrArray.forEach(function(attr){
              var val = parseFloat(csvRegion[attr]); //get csv attribute value
              geojsonProps[attr] = val; //assign attribute and value to geojson properties
          });
        };
      };
    };
  return worldCountries;
};

function setEnumerationUnits(worldCountries, map, path, colorScale){

  //add countries to map
  var countries = map.selectAll(".countries")
      .data(worldCountries)
      .enter()
      .append("path")
      .attr("class", function(d){
        return "countries " + d.properties.adm0_a3;
      })
      .attr("d", path)
      .style("fill", function(d){
          return colorScale(d.properties[expressed]);
      });
};

function createColorScale(data){

    var colorClasses = [
      "#54278f",
      "#756bb1",
      "#9e9ac8",
      "#bcbddc",
      "#dadaeb",
      "#f2f0f7",
    ];

    //create a color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values in the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale
    colorScale.domain(domainArray);

    return colorScale;
};

})();
