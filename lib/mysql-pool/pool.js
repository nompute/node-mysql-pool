"use strict";

var util = require("util");
var EventEmitter = require("events").EventEmitter;
var Cnx = require('mysql').Client;

function argumentsArray(args) {
	var result = [];
	for(var i in args) {
		result.push(args[i]);
	}
	return result;
}

function MySQLPool(properties) {
	if(!(this instanceof MySQLPool)) {
		return new MySQLPool(properties);
	}
	
	var self = this;
	EventEmitter.call(this);
	
	this.poolSize = 1;
	this._waitingPool = [];
	this._connections = [];
	
	for(var key in properties) {
		this[key] = properties[key];
	}
	
	return this;
}
util.inherits(MySQLPool, EventEmitter);
exports.MySQLPool = MySQLPool;

MySQLPool.prototype._avail = function _avail(cnx) {
	this._waitingPool.push(cnx);
	this.emit("_awake");
}

MySQLPool.prototype.connect = function connect(cb) {
	var err = new Error("MySQLPool.connect() is not available. Use connectPool()!");
	if(cb) {
		cb(err);
	} else {
		throw err;
	}
}

MySQLPool.prototype.end = function connect(cb) {
	var err = new Error("MySQLPool.end() is not available. Use endPool()!");
	if(cb) {
		cb(err);
	} else {
		throw err;
	}
}

MySQLPool.prototype.connectPool = function connectPool(n, cb) {
	var pool = this;
	
	if(n) {
		this.poolSize = n;
	}
	var params = {};
	for(var key in this) {
		if(!key.match(/^_|^poolSize$/) && this.hasOwnProperty(key)) {
			params[key] = this[key];
		}
	}
	
	var poolSize = this.poolSize;
	var calledBack = 0;
	var availableConnections = [];
	var failedConnections = [];
	
	function mkCallback(cnx) {
		return function(err) {
			if(err) {
				failedConnections.push(cnx);
				--pool.poolSize;
			} else {
				availableConnections.push(cnx);
				pool._connections.push(availableConnections[i]);
			}
			if(++calledBack >= poolSize) {
				if(availableConnections.length > 0) {
					if(cb) {
						if(failedConnections.length == 0) {
							cb(err, {avail:availableConnections});
						} else {
							cb(err, {avail:availableConnections, failed:failedConnections});
						}
					}
					for(var i in availableConnections) {
						pool._avail(availableConnections[i]);
					}
				} else {
					var err = new Error("All connections failed.");
					if(cb) {
						cb(null, {failed:failedConnections});
					} else {
						pool.emit("error", err);
					}
				}
			}
		};
	}
	
	for(var i = 0; i < poolSize; ++i) {
		var cnx = new Cnx(params);
		//cnx._nthPoolMember = i;
		//cnx._connectionPool = this;
		cnx.connect(mkCallback(cnx));
	}
	
	return this;
}

MySQLPool.prototype.endPool = function endPool(cb) {
	var pool = this;;
	this._avail = [];
	for(var i in this._connections) {
		var cnx = this._connections[i];
		cnx.end(function(err) {
			--pool.poolSize;
			if(cb) {
				cb.apply(cnx, arguments);
			} else if(err) {
				pool.emit("error", err);
			}
		});
	}
	this._connections = [];
}

function mkPrototypeMethod(method) {
	return function result() {
		var pool = this;
		var args = argumentsArray(arguments);
		
		var cnx = this._waitingPool.shift();
		if(!cnx) {
			this.once("_awake", function() {
				result.apply(pool, args);
			});
			return this;
		}
		
		var cb = args.pop()
		function callback(err) {
			pool._avail(cnx);
			if(cb) {
				cb.apply(cnx, arguments);
			} else if(err) {
				pool.emit("error", err);
			}
		}
		args.push(callback);
		method.apply(cnx, args);
		return this;
	};
}

for(var key in Cnx.prototype) {
	if(key.match(/^_/) || key in MySQLPool.prototype) {
		continue;
	}
	MySQLPool.prototype[key] = mkPrototypeMethod(Cnx.prototype[key]);
}
