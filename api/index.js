// Express
var express = require('express');
var router = express.Router();

// Body Parser
var bodyParser = require('body-parser');

// Google Auth
var googleAuth = require('simple-google-openid');
router.use(googleAuth('511406985315-ubm4a95t7qitdmmr1v6tv2rierms26hr.apps.googleusercontent.com'));
router.use('*', googleAuth.guardMiddleware({ realm: 'jwt' }));

// Users and roles
var
    users = [
        {
            'email': 'up690316@myport.ac.uk',
            'roles': [
                'admin',
                'user'
            ]
        }
    ];

// Helper functions
function currentUser(req) {
    var reqEmail = req.user.emails[0].value;
    for(var i = 0; i < users.length; i++) {
        if(users[i].email == reqEmail) {
            return users[i];
        }
    }
    // If the user wasn't found, add them to the "database"
    var newUser = {
        'email': reqEmail,
        'roles': [],
        'requestedAccess': false,
    };
    users.push(newUser);
    return newUser;
}

function isApproved(user) {
    return user.roles.indexOf('user') !== -1; // If the user has 'user' in their roles array
}

function isAdmin(user) {
    return user.roles.indexOf('admin') !== -1; // If the user has 'admin' in their roles array
}

/**
 * USER ROUTES
 */

// retrieves roles of logged-in user
router.get('/user/roles', (req, res) => {
    var user = currentUser(req);
    res.send(user.roles);
});

// requests approval for logged-in user (no body)
router.post('/user/request', (req, res) => {
    var user = currentUser(req);
    user.requestedAccess = true;
    res.sendStatus(202);
});

/**
 * APPROVED USER ROUTES
 */

// retrieves a random number
router.get('/random', (req, res) => {
    var user = currentUser(req);
    if(isApproved(user)) {
        res.set('Content-Type', 'text/plain');
        res.send('' + Math.random());
    }
    else {
        res.sendStatus(403);
    }
});

/**
 * ADMIN ROUTES
 */

// lists all known users
router.get('/users', (req, res) => {
    if(isAdmin(currentUser(req))) {
        res.send(users);
    }
    else {
        res.sendStatus(403);
    }
});

// lists approval requests
router.get('/user/request', (req, res) => {
    if(isAdmin(currentUser(req))) {
        var userRequests = [];
        for(var i = 0; i < users.length; i++) {
            if(users[i].requestedAccess) {
                userRequests.push(users[i].email);
            }
        }
        res.send(userRequests);
    }
    else {
        res.sendStatus(403);
    }
});

// adds a user (email in the body)
router.post('/user/approve', bodyParser.text(), (req, res) => {
    if(isAdmin(currentUser(req))) {
        for(var i = 0; i < users.length; i++) {
            if(req.body == users[i].email) {
                users[i].roles.push('user');
                users[i].requestedAccess = false;
                res.send(users[i]);
                return;
            }
        }
        res.sendStatus(404);
    }
    else {
        res.sendStatus(403);
    }
});

// deletes a user (email in the url)
router.delete('/user/:email', (req, res) => {
    if(isAdmin(currentUser(req))) {
        for(var i = 0; i < users.length; i++) {
            if(users[i].email == decodeURIComponent(req.params.email)) {
                users.splice(i, 1); // Removes the user from the array
                res.sendStatus(204);
                return;
            }
        }
        res.sendStatus(404);
    }
    else {
        res.sendStatus(403);
    }
});

module.exports = router;
