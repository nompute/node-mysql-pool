<h1 id="Readme">node-mysql-pool</h1>

<h2 id="Purpose">Purpose</h2>

node-mysql-pool is a MySQL [connection pool](http://en.wikipedia.org/wiki/Connection_pool)
for [node.js](http://nodejs.org/) on top of Felix Geisendörfer's MySQL client
[node-mysql](https://github.com/felixge/node-mysql).

Using a connection pool instead of a single connection should render a remarkable
speed-up, when you have many short living connections, e.g. with message board applications.

<h2 id="Status">Current status</h2>

This module is currently not backed by proper unit testing. Nevertheless I found
it stable for my testings.

If you find an error, please file an [issue](https://github.com/Kijewski/node-mysql-pool/issues)!

<h2 id="Contributors">Contributors</h2>

* [René Kijewski](https://github.com/Kijewski)

<h2 id="Compatibility">Compatibility</h2>

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

<h2 id="Tutorial">Tutorial</h2>

    var MySQLPool = require("./node-mysql-pool").MySQLPool,
        pool = new MySQLPool({database: "test"});
        
    pool.properties.user = 'root';
    pool.properties.password = 'root';
    
    pool.connect(4);
    
    pool.query("SELECT 'Hello, World!' AS hello", function(err, rows, fields) {
      if(err) throw err;
      console.log(rows[0].hello);
    });
    
    for(var i = 0; i < 10; ++i) {
      pool.query("SELECT SLEEP(2), ? AS i", [i], function(err, rows, fields) {
        if(err) throw err;
        console.log("Slept: " + rows[0].i);
      });
    }

You probably do not have to change anything if you already used
[node-mysql](https://github.com/felixge/node-mysql/)
or any of [its forks](https://github.com/felixge/node-mysql/network)!

<h2 id="API">API</h2>

The API of this module is as similar to node-mysql as possible, with two exceptions:

* You must always supply a callback function. Using listeners is not supported.
* Property `x`, when not supplied while creation, are to be set to `instance.properties.x`.

When called back, `this` will be the used connection. (You probably never need to
know which connection was actually used.)

<h3 id="NewPool">Creation of a new pool</h3>

    new mysqlPool.Pool([options])

creates a new, currently empty, pool. Any property for the single connections or
the connectionpool, resp., can be set using the `options` object.

    client.connect([poolsize], [cb])
    // with:
    cb = function(err, result)
    result = { [connections: Number], [errors: Array] }

Establishes a new connection pool with the size of `poolsize`.

If the parameter `poolsize` is omitted, the value of `client.poolsize`, or 1 is used.

Only if all connection attemps failed `err` is supplied.
If some connections failed, `result.error` will contain a list of Errors.
If some or all connections succeeded, `results.connections` will contains the pool's size.

<h3 id="Options">Options</h3>

Defaults:

    pool.poolSize = 1
    pool.Client = require("mysql").Client

* `pool.poolSize`:
    * The number of connections to establish to the server.
* `pool.Client`:
    * If you do not want the npm version of node-mysql—e.g. because you forked and
      tweaked it for you purposes—you can supply a different `Client` object.
* `pool.properties.xyz = undefined`:
    * Property `xyz` of the `Client` object.
      See the [original documentation](https://github.com/felixge/node-mysql/blob/master/Readme.md)
      of node-mysql for more property related information.

<h3 id="AllConnections">Methods affecting all connections</h3>

    client.useDatabase(database, cb)
    client.end([cb])
    client.destroy()

* `pool.useDatabase(database, cb)`:
    * Changes the database for every connection.
* `pool.end([cb])`:
    * Shuts down every connection, not waiting for any enqueued and waiting queries.
      Active queries won't be aborted, though.
* `pool.destroy()`:
    * Kills every connection. You do not want do use this method!

For all methods you can [invoke on a single connection](#SingleConnection), there is
an equivalent `methodnameAll(...)` method. E.g. you can use `pool.pingAll(cb)`, if
you want you to ping all connections for some reason.

`cb` will be called once for every connection affected. [Subject to change!](#Todo)

<h3 id="SingleConnection">Methods invoked on a single connection</h3>

All methods of the `Client` object will be supported—with `connect(...)`, `end(...)`,
`useDatabase(...)` and `destroy(...)` being overwritten.

If you do not use a fork, that are currently:

    query(sql, [params], cb)
    statistics([cb])

See the [original documentation](https://github.com/felixge/node-mysql/blob/master/Readme.md)
of node-mysql for method related information.

**Beware:**

* You must supply a callback method, if you have *any* parameters.
* No events are emitted but [error](#EventError).

<h3 id="NoConnection">Methods unrelated to connections</h3>

    format(sql, params)
    function(val)

Will behave exactly like the original methods. They do not belong to a single
connection.

<h3 id="EventError">event: 'error' (err)</h3>

Emitted if end only if an error occurred and no callback function was supplied.
You should always supply a callback function!

<h2 id="Todo">Todo</h2>

* The methods effecting all connections have a strange API. `cb` should be called
  only once.


<h2 id="Licence">Licence</h2>

node-mysql-pool is licensed under the
[MIT license](https://github.com/Kijewski/node-mysql-pool/blob/master/License).
