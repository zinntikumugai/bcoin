'use strict';

var bn = require('bn.js');
var bcoin = require('../').set('main');
var utils = bcoin.utils;
var constants = bcoin.protocol.constants;
var network = bcoin.protocol.network;
var assert = require('assert');

describe('BIP151', function() {
  var client = new bcoin.bip151();
  var server = new bcoin.bip151();
  function payload() {
    return new Buffer('deadbeef', 'hex');
  }

  it('should do encinit', function() {
    client.encinit(server.toEncinit());
    server.encinit(client.toEncinit());
    assert(!client.handshake);
    assert(!server.handshake);
  });

  it('should do encack', function() {
    client.encack(server.toEncack());
    server.encack(client.toEncack());
    assert(client.handshake);
    assert(server.handshake);
  });

  it('should have completed ECDH handshake', function() {
    assert(client.isReady());
    assert(server.isReady());
    assert(client.handshake);
    assert(server.handshake);
  });

  it('should encrypt payload from client to server', function() {
    var packet = client.packet('fake', payload());
    var emitted = false;
    server.once('packet', function(cmd, body) {
      emitted = true;
      assert.equal(cmd, 'fake');
      assert.equal(body.toString('hex'), 'deadbeef');
    });
    server.feed(packet);
    assert(emitted);
  });

  it('should encrypt payload from server to client', function() {
    var packet = server.packet('fake', payload());
    var emitted = false;
    client.once('packet', function(cmd, body) {
      emitted = true;
      assert.equal(cmd, 'fake');
      assert.equal(body.toString('hex'), 'deadbeef');
    });
    client.feed(packet);
    assert(emitted);
  });

  it('should encrypt payload from client to server (2)', function() {
    var packet = client.packet('fake', payload());
    var emitted = false;
    server.once('packet', function(cmd, body) {
      emitted = true;
      assert.equal(cmd, 'fake');
      assert.equal(body.toString('hex'), 'deadbeef');
    });
    server.feed(packet);
    assert(emitted);
  });

  it('should encrypt payload from server to client (2)', function() {
    var packet = server.packet('fake', payload());
    var emitted = false;
    client.once('packet', function(cmd, body) {
      emitted = true;
      assert.equal(cmd, 'fake');
      assert.equal(body.toString('hex'), 'deadbeef');
    });
    client.feed(packet);
    assert(emitted);
  });

  it('client should rekey', function() {
    var rekeyed = false;
    var bytes = client.output.processed;

    client.once('rekey', function() {
      rekeyed = true;
      var packet = client.packet('encack', client.toRekey());
      var emitted = false;
      server.once('packet', function(cmd, body) {
        emitted = true;
        assert.equal(cmd, 'encack');
        server.encack(body);
      });
      server.feed(packet);
      assert(emitted);
    });

    // Force a rekey after 1gb processed.
    client.output.maybeRekey({ length: 1024 * (1 << 20) });

    assert(rekeyed);

    // Reset so as not to mess up
    // the symmetry of client and server.
    client.output.processed = bytes + 33 + 31;
  });

  it('should encrypt payload from client to server after rekey', function() {
    var packet = client.packet('fake', payload());
    var emitted = false;
    server.once('packet', function(cmd, body) {
      emitted = true;
      assert.equal(cmd, 'fake');
      assert.equal(body.toString('hex'), 'deadbeef');
    });
    server.feed(packet);
    assert(emitted);
  });

  it('should encrypt payload from server to client after rekey', function() {
    var packet = server.packet('fake', payload());
    var emitted = false;
    client.once('packet', function(cmd, body) {
      emitted = true;
      assert.equal(cmd, 'fake');
      assert.equal(body.toString('hex'), 'deadbeef');
    });
    client.feed(packet);
    assert(emitted);
  });

  it('should encrypt payload from client to server after rekey (2)', function() {
    var packet = client.packet('fake', payload());
    var emitted = false;
    server.once('packet', function(cmd, body) {
      emitted = true;
      assert.equal(cmd, 'fake');
      assert.equal(body.toString('hex'), 'deadbeef');
    });
    server.feed(packet);
    assert(emitted);
  });

  it('should encrypt payload from server to client after rekey (2)', function() {
    var packet = server.packet('fake', payload());
    var emitted = false;
    client.once('packet', function(cmd, body) {
      emitted = true;
      assert.equal(cmd, 'fake');
      assert.equal(body.toString('hex'), 'deadbeef');
    });
    client.feed(packet);
    assert(emitted);
  });

  it('should encrypt payloads both ways asynchronously', function() {
    var spacket = server.packet('fake', payload());
    var cpacket = client.packet('fake', payload());
    var cemitted = false;
    var semitted = false;
    client.once('packet', function(cmd, body) {
      cemitted = true;
      assert.equal(cmd, 'fake');
      assert.equal(body.toString('hex'), 'deadbeef');
    });
    server.once('packet', function(cmd, body) {
      semitted = true;
      assert.equal(cmd, 'fake');
      assert.equal(body.toString('hex'), 'deadbeef');
    });
    client.feed(spacket);
    server.feed(cpacket);
    assert(cemitted);
    assert(semitted);
  });
});
