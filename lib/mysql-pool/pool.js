"use strict";

var util = require("util");
var EventEmitter = require("events").EventEmitter;

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
	this.Client = null;
	this.properties = {};
	
	this._idleQueue = [];
	this._connectionPool = [];
	this._todoQueue = [];
	
	for(var key in properties) {
		switch(key) {
			case "client":
				this.Client = properties[key];
				break;
			case "poolSize":
				this.poolSize = properties[key];
				break;
			default:
				this.properties[key] = properties[key];
				break;
		}
	}
	
	return this;
}
util.inherits(MySQLPool, EventEmitter);
exports.MySQLPool = MySQLPool;

MySQLPool.prototype._avail = function _avail(client) {
	this._idleQueue.push(client);
	var top;
	while(this._todoQueue.length > 0 && (top = this._idleQueue.shift())) {
		top.method.apply(this, top.args);
	}
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
	
	if(!this.Client) {
		this.Client = require('mysql').Client;
	}
	this._populate();
	
	if(typeof n == "function") {
		cb = n;
		n = undefined;
	}
	
	var poolSize = n || this.poolSize;
	var calledBack = 0;
	var availableConnections = [];
	var errors = [];
	
	function mkCallback(client) {
		return function(err) {
			if(err) {
				errors.push(err);
				--pool.poolSize;
			} else {
				availableConnections.push(client);
				pool._connectionPool.push(client);
			}
			if(++calledBack >= poolSize) {
				if(availableConnections.length > 0) {
					if(cb) {
						if(errors.length == 0) {
							cb(null, {connections:availableConnections.length});
						} else {
							cb(null, {connections:availableConnections.length, errors:errors});
						}
					}
					for(var i in availableConnections) {
						pool._avail(availableConnections[i]);
					}
				} else {
					var err = new Error("All connections failed.");
					if(cb) {
						cb(err, {errors:errors});
					} else {
						pool.emit("error", err);
					}
				}
			}
		};
	}
	
	for(var i = 0; i < poolSize; ++i) {
		var client = this.Client(this.properties);
		//client._nthPoolMember = i;
		//client._connectionPool = this;
		client.connect(mkCallback(client));
	}
	
	delete this.Client;
	return this;
}

MySQLPool.prototype.endPool = function endPool(cb) {
	// TODO: callback _once_
	var pool = this;
	this._avail = [];
	for(var i in this._connectionPool) {
		var client = this._connectionPool[i];
		client.end(function(err) {
			--pool._poolSize;
			if(cb) {
				cb.apply(client, arguments);
			} else if(err) {
				pool.emit("error", err);
			}
		});
	}
	this._connectionPool = [];
}

MySQLPool.prototype._populate = function _populate() {
	var pool = this;
	
	function mkPrototypeMethod(method) {
		return function wrapperMethod() {
			var args = argumentsArray(arguments);
			while(typeof args[args.length-1] == "undefined") {
				args.pop();
			}
			
			var client = pool._idleQueue.shift();
			if(!client) {
				pool._todoQueue.push({method:wrapperMethod, args:args});
				return pool;
			}
			
			var cb = args.pop();
			args.push(function(err) {
				pool._avail(client);
				if(cb) {
					cb.apply(client, arguments);
				} else if(err) {
					pool.emit("error", err);
				}
			});
			method.apply(client, args);
			return pool;
		};
	}

	for(key in this.Client.prototype) {
		if(!key.match(/^_/) && !(key in this) && !(key in EventEmitter.prototype)) {
			this[key] = mkPrototypeMethod(this.Client.prototype[key]);
		}
	}
}
