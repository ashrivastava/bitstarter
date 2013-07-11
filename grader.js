#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://immense-plateau-9447.herokuapp.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var buildfn = function(htmlfile, checksfile) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            //console.error("Wrote %s", htmlfile);
            fs.writeFileSync(htmlfile, result);
            var checkJson = checkHtmlFile(htmlfile, checksfile);
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
            if (fs.existsSync("heroku-app.html")) {
                fs.unlinkSync("heroku-app.html");
            }
        }
    };
    return response2console;
};


if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'web url', URL_DEFAULT)
        .parse(process.argv);

//console.log(process.argv);
    
//console.log(program.url);


var fileOption = false;
var urlOption = false;

//console.log(fileOption);
//console.log(urlOption);

process.argv.forEach(function(val, index, array) {
  if (val == "--file")
  { fileOption = true; }
  if (val == "--url")
  { urlOption = true; }

});

//console.log(fileOption);
//console.log(urlOption);

    if (urlOption)
    {
      var htmlfile = "heroku-app.html";
    //var url = "http://immense-plateau-9447.herokuapp.com";
      var url = program.url;
//console.log(program.url);
//console.log(url);
      var response2console = buildfn(htmlfile, program.checks);
      rest.get(url).on('complete', response2console);
    }
    else if (fileOption)
    {
      var checkJson = checkHtmlFile(program.file, program.checks);
    // var checkJson = checkHtmlFile(htmlfile, program.checks);
      var outJson = JSON.stringify(checkJson, null, 4);
      console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

