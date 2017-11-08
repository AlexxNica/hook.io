var hook = require('../../resources/hook');
var resource = require('resource');
var checkRoleAccess = require('./checkRoleAccess');
var config = require('../../../config');

module['exports'] = function handleHookView (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });
  return hook.find({owner: req.params.owner, name: req.params.hook }, function (err, result){
    if (err) {
      return res.end(err.message);
    }
    if (result.length === 0) {
      return res.end('Not found');
    }
    var h = result[0];
    req.hook = h;

    checkRoleAccess({ req: req, res: res, role: "hook::view::read" }, function (err, hasPermission) {

      // only protect view of private services
      if (h.isPrivate !== true) {
        hasPermission = true;
      }

      if (!hasPermission) {
        return res.end(config.messages.unauthorizedRoleAccess(req, "hook::view::read"));
      } else {
        resource.emit('hook::view::read', {
          ip: req.connection.remoteAddress,
          owner: req.params.owner,
          url: req.url
        });
        return res.end(h.themeSource);
      }

    });

  });
};