var request = require('hyperquest');
var dateFormat = require('dateformat');
var forms = require('mschema-forms');

// load docs html as file
// TODO: load docs as http request
// var docs = require('fs').readFileSync(__dirname + '/../../../view/docs.html').toString();

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module['exports'] = function view (opts, callback) {
  var params = opts.request.resource.params;
  var req = opts.request,
      service = opts.service,
      res = opts.response
      result = opts;
  var $ = this.$;
  var run = params.run;
  $('title').html(req.params.owner + "/" + req.params.hook);
  var gist = opts.gist || params.gist;
  $('.gistEmbed').html('<script src="' + gist + '.js"></script>');
  $('.gist').html('<a href="' + gist + '">' + gist + '</a>');

  // $('.hookDocs').html(docs);
  $('.hookDocs .docsHeader').remove();

  if (params.theme) {
    $('.theme').attr('value', params.theme);
  }
  if (params.edit) {
    return res.redirect(301, config.app.url + "/admin?owner=" + req.params.owner + "&hook=" + req.params.hook);
  }

  if (true) {
    // check result.headers for content type
    // if the content type is not text, display binary file message
   if (result.headers && result.headers.headers && typeof result.headers.headers['Content-Type'] !== "undefined") {
     var types = result.headers.headers['Content-Type'].split(',');
     if (types.indexOf('text/html') === -1) {
       $('.viewRaw').remove();
       $('.binaryFileLink .contentType').html(types[0]);
     } else {
       $('.binaryFileLink').remove();
     }
   } else {
     $('.binaryFileLink').remove();
   }

   if (result.headers && result.headers.code === 500) {
     $('.hookResult .message').html('Error executing Hook!');
     $('.hookResult .message').addClass('error');
     $('.hookResult .message').removeClass('success');
   }

   // $('.sourceCode').remove();
   // $('.hookOptions').remove();
   $('.hookParams').html(JSON.stringify(result.params, true, 2));

   var Datauri = require('datauri'),
       dUri    = new Datauri();

   var isVideo = false;
   if (types && types.indexOf('video/mp4') !== -1) {
     isVideo = true;
     var uri = dUri.format('.mp4', result.output);
     $('.hookOutput').html('<video controls><source type="video/mp4" src="' + uri.content + '"></video>');
     $('.binaryFileLink').remove();
   }

   var mime = require('mime');

   var imageTypes = ['image/bmp', 'image/gif', 'image/jpeg', 'image/png', 'image/tiff'];

   var isImage = false, _type;
   if (types) {
     imageTypes.forEach(function(t){
       if(types.indexOf(t) !== -1) {
         _type = t;
         isImage = true;
       }
     });
   }

   if (isImage) {
     var uri = dUri.format('.' + mime.extension(_type), result.output);
     $('.hookOutput').html('<img src="' + uri.content + '"/>');
     $('.binaryFileLink').remove();
   }

   // TODO: add audio
   if (!isVideo && !isImage) {
     $('.binaryFileLink').remove();
     $('.hookOutput').html('<textarea cols="80" rows="10" class="hookOutput">' + result.output + '</textarea>');
   }

   $('.hookHeaders').html(JSON.stringify(result.headers, true, 2));
   $('.hookDebugOutput').html(JSON.stringify(result.debug, true, 2));    
   //return callback(null, $.html());

   $('.hookName').html(service.name);
   // $('.httpMethod').html(req.method.toUpperCase());

  }

 var strParams = '';
 var ignoreParams = ['hook', 'subhook', 'username', 'format', 'run'];
 for (var p in params) {
   if (ignoreParams.indexOf(p) === -1) {
     strParams += ("&" + p + "=" + encodeURI(params[p]));
   }
 }

 //$('.forkButton').attr('data-url', 'https://hook.io/' + req.hook.owner + "/" + req.hook.name + "?fork=true");
 //$('.editButton').attr('data-url', 'https://hook.io/' + req.hook.owner + "/" + req.hook.name + "?admin=true");

  // $('.counter').html('<em>' + req.hook.name + ' has run ' + numberWithCommas(req.hook.ran.toString()) + ' times since ' + dateFormat(new Date(req.hook.ctime), "mmmm dS, yyyy, h:MM:ss TT") + '</em>');
  $('.gistEmbed').html('<script src="' + gist + '.js"></script>');
  
  //$('.hookResult').remove();
  if(typeof params.forked !== "undefined") {
    $('.notice').html('<strong>You just forked a Hook!</strong> <br/> <a href="' + gist + '">Click here to view the Gist</a>');
  }

  if (typeof params.created !== "undefined") {
    $('.notice').html('<strong class="success">Hook created!</strong>');
  }

  if (typeof params.alreadyExists !== "undefined") {
    $('.notice').html('<strong class="success">Hook already exists! Here it is.</strong>');
  }

  var formSchema = service.mschema || {};

  for (var p in formSchema) {
    if(typeof params[p] !== 'undefined') {
      formSchema[p].default = params[p];
    }
  }

  formSchema.run = {
    "type": "string",
    "default": "true",
    "format": "hidden"
  };

  formSchema.format = {
    type: "string",
    enum: ["friendly", "raw"],
    default: "friendly"
  };

  formSchema.theme = {
    "type": "string",
    "format": "hidden",
    "default": params.theme
  };

  forms.generate({
    type: "generic",
    form: {
      legend: service.name + ' test form',
      submit: "Test Hook",
      action: "/" + service.owner + "/" + service.name
    },
    schema: formSchema,
    }, function (err, result){
      $('.testForm').html(result);
      $('form legend').append('&nbsp;&nbsp;&nbsp;<button title="Run This Hook" class="run-icon mega-octicon octicon-playback-play"/>')
      
      // $('form legend').append('<div class="counter"><em>Ran ' + req.hook.ran.toString() + ' times since ' + dateFormat(new Date(req.hook.ctime), "mmmm dS, yyyy, h:MM:ss TT") + '</em></div>');
      
      // load gist embed based on incoming gist url parameter
      $('#gistUrl').attr('value', gist);
      callback(null, $.html());
  });

};