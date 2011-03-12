# node-mysql-pool

## Purpose

node-mysql-pool is MySQL [connection pool](http://en.wikipedia.org/wiki/Connection_pool)
for [node.js](http://nodejs.org/) on top of Felix Geisendörfer's great MySQL client
[node-mysql](https://github.com/felixge/node-mysql).

Using a connection pool instead of a single connection should render a remarkable
speed-up, when you have many short living connections, e.g. with message board applications.

## Current status

This module is currently not backed by proper unit testing. Nevertheless I found
it stable for my testings.

If you find an error, please file an [issue](https://github.com/Kijewski/node-mysql-pool/issues)!

## Contributers

* René Kijewski ([Kijewski](https://github.com/Kijewski))

## Compatibility

This module was only tested using node >= 0.4.x. It may work for older versions,
but I am not going to actively support them.

The node-mysql-pool works even with unknown forks of node-mysql, as long as

* the last parameter of a method is callback function
* you connect using `connect()`, disconnection using `end()`,
* the constructor gets an object containing the parameters,
* no events are emitted when supplying a callback function, and
* the when the first parameter of a callback is set, it denotes an error.

Otherwise the requirements are the same as for
[node-mysql](https://github.com/felixge/node-mysql/blob/master/Readme.md).

## Tutorial

    var MySQLPool = require("./node-mysql-pool").MySQLPool,
        client = new MySQLPool({database: "test"});
        
    client.properties.user = 'root';
    client.properties.password = 'root';
    
    client.connect(4);
    
    client.query("SELECT 'Hello, World!' AS hello", function(err, rows, fields) {
      if(err) throw err;
      console.log(rows[0].hello);
    });
    
    for(var i = 0; i < 10; ++i) {
      client.query("SELECT SLEEP(2), ? AS i", [i], function(err, rows, fields) {
        if(err) throw err;
        console.log("Slept: " + rows[0].i);
      });
    }

## API

The API of this module is as similar to node-mysql as possible, with two exceptions:

* You must always supply a callback function. Using listeners is not supported.
* Property `x`, when not supplied while creation, are to be set to `instance.properties.x`.

When called back, `this` will be the used connection.

### new mysqlPool.Pool([options])

Creates a new, currently empty, pool. Any property for the single connections or
the connectionpool, resp., can be set using the `options` object.

### client.poolSize = 1

The number of connections to establish to the server.

### client.Client = require("mysql").Client

If you do not want the npm version of node-mysql -- e.g. because you forked and
tweaked it for you purposes -- you can supply a different `Client` object.

### client.properties.xyz = undefined

Property `xyz` of the `Client` object.

See the [original documentation](https://github.com/felixge/node-mysql/blob/master/Readme.md)
of node-mysql for more property related information.

### client.connect([poolsize], [cb])

    cb = function(err, result)
    result = { [connections: Number], [errors: Array] }

Establishes a new connection pool with the size of `poolsize`.

If the parameter `poolsize` is omitted, the value of `client.poolsize`, or 1 is used.

Only if all connection attemps failed `err` is supplied.
If some connections failed, `result.error` will contain a list of Errors.
If some or all connections succeeded, `results.connections` will contains the pool's size.

### client.end([cb])

Shuts down all connections, not waiting for any enqueued and waiting queries.
Active queries won't be aborted, though.

`cb` will be called once for every shut down connection. (Subject to change!)

### client.useDatabase(database, cb)

Changes the database for every connection.

### client.destroy()

Kills every connection. You do not want do use this method!

### client.xzy(..., cb)

All methods of the `Client` object will be supported -- with `connect(...)`, `end(...)`,
`useDatabase(...)` and `destroy(...)` being overwritten.

See the [original documentation](https://github.com/felixge/node-mysql/blob/master/Readme.md)
of node-mysql for method related information.

Beware:

* You must supply a callback method, if you have any parameters.
* No events are emitted but error.

### event: 'error' (err)

Emitted if end only if an error occurred and no callback function was supplied.
You should always supply a callback function!

## Todo

* The `end([cb])`, `destroy([cb])` and `useDatabase(db, cb)` methods have a strange API.

## Licence

node-mysql-pool is licensed under the MIT license.
