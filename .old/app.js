// load HTTP module
const http = require("http");
// import fs and module
const fs = require("fs");
// import our own methods
const db = require("./database.js")
const users = require("./users.js")
// define on which hostname and port the server will run on
const hostname = process.argv[2] || '127.0.0.1';
const port = process.argv[3] || 8080;

// create HTTP server and listen on port 8080 for requests
const server = http.createServer((req, res) => {
    // set the response HTTP header with HTTP status and Content type
    // in laymans terms, say that the server can handle the request properly
    res.statusCode = 200;

    // get the requested URL
    let url = req.url;
    // split the file up to get everything *before* the GET params
    let path = url.split("?")[0];
    // check if it ends with /` and append index.html
    if (path.endsWith("/")) {
        path = path + "index.html";
    }
    // check if file exists, if so, serve it, otherwise server something that needs to be processed server side
    if (fs.existsSync(__dirname + "/public-html" + path)) {
        console.log("Sending", __dirname + "/public-html" + path + "...");
        // set header to the right type so browser interprets it as proper file
        res.setHeader('Content-Type', function() { 
            let splitArr = (__dirname + "/public-html" + path).split(".");
            switch(splitArr[splitArr.length-1]) {
                case "html":
                    return 'text/html'
                case "css":
                    return 'text/css'
                case "js":
                    return 'text/js'
                default:
                    return 'text/plain'
            }
        }());
        // send content of file
        res.end(fs.readFileSync(__dirname + "/public-html" + path));
    } else {
        // node API callback function
        callback = function(type, response) {res.setHeader('Content-Type', type); res.end(response);}
        // define methods based on path extensions
        let methods = {"db": db.request, "register": users.register, "login": users.login, "logout": users.logout}
        
        // loop through methods
        for (let e in methods) {
            // if it's a match, call method and respond
            if (path.endsWith(e)) {
                methods[e](req, callback)
                return
            }
        }
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end("Sorry, we could not process your request. Resource `" + path + "` not understood.");
    }
});

// listen for request on port 8080, and as a callback function have the port listened on logged
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

// if we call a `SIGINT` (ctrl-c) event on the server, we catch that signal and handle it ourselves
process.on('SIGINT', function() {
    console.log("\nCaught interrupt signal");
    console.log("Closing server...")
    // close the server safely
    server.close();
    console.log("Closing database connection...");
    // use the imported method to close the DB connection after the server has been brought down
    db.closeDB();
    // o/
    console.log("Goodbye");
    // quit
    process.exit();
});