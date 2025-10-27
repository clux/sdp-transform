const fs = require('co-fs');
const test = require('bandage');
const {
  parse,
  parseParams,
  parseImageAttributes,
  parseSimulcast,
  write,
} = require('../lib');

test('normalSdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/normal.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  t.equal(session.origin.username, '-', 'origin username');
  t.equal(session.origin.sessionId, 20518, 'origin sessionId');
  t.equal(session.origin.sessionVersion, 0, 'origin sessionVersion');
  t.equal(session.origin.netType, 'IN', 'origin netType');
  t.equal(session.origin.ipVer, 4, 'origin ipVer');
  t.equal(session.origin.address, '203.0.113.1', 'origin address');

  t.equal(session.connection.ip, '203.0.113.1', 'session connect ip');
  t.equal(session.connection.version, 4, 'session connect ip ver');

  // global ICE and fingerprint
  t.equal(session.iceUfrag, 'F7gI', 'global ufrag');
  t.equal(session.icePwd, 'x9cml/YzichV2+XlhiMu8g', 'global pwd');

  var audio = media[0];
  t.equal(audio.type, 'audio', 'audio type');
  t.equal(audio.port, 54400, 'audio port');
  t.equal(audio.protocol, 'RTP/SAVPF', 'audio protocol');
  t.equal(audio.direction, 'sendrecv', 'audio direction');
  t.equal(audio.rtp[0].payload, 0, 'audio rtp 0 payload');
  t.equal(audio.rtp[0].codec, 'PCMU', 'audio rtp 0 codec');
  t.equal(audio.rtp[0].rate, 8000, 'audio rtp 0 rate');
  t.equal(audio.rtp[1].payload, 96, 'audio rtp 1 payload');
  t.equal(audio.rtp[1].codec, 'opus', 'audio rtp 1 codec');
  t.equal(audio.rtp[1].rate, 48000, 'audio rtp 1 rate');
  t.deepEqual(
    audio.ext[0],
    {
      value: 1,
      uri: 'URI-toffset',
    },
    'audio extension 0'
  );
  t.deepEqual(
    audio.ext[1],
    {
      value: 2,
      direction: 'recvonly',
      uri: 'URI-gps-string',
    },
    'audio extension 1'
  );
  t.equal(
    audio.extmapAllowMixed,
    'extmap-allow-mixed',
    'extmap-allow-mixed present'
  );

  var video = media[1];
  t.equal(video.type, 'video', 'video type');
  t.equal(video.port, 55400, 'video port');
  t.equal(video.protocol, 'RTP/SAVPF', 'video protocol');
  t.equal(video.direction, 'sendrecv', 'video direction');
  t.equal(video.rtp[0].payload, 97, 'video rtp 0 payload');
  t.equal(video.rtp[0].codec, 'H264', 'video rtp 0 codec');
  t.equal(video.rtp[0].rate, 90000, 'video rtp 0 rate');
  t.equal(video.fmtp[0].payload, 97, 'video fmtp 0 payload');
  var vidFmtp = parseParams(video.fmtp[0].config);
  t.equal(
    vidFmtp['profile-level-id'],
    '4d0028',
    'video fmtp 0 profile-level-id'
  );
  t.equal(vidFmtp['packetization-mode'], 1, 'video fmtp 0 packetization-mode');
  t.equal(
    vidFmtp['sprop-parameter-sets'],
    'Z0IAH5WoFAFuQA==,aM48gA==',
    'video fmtp 0 sprop-parameter-sets'
  );
  t.equal(video.fmtp[1].payload, 98, 'video fmtp 1 payload');
  var vidFmtp2 = parseParams(video.fmtp[1].config);
  t.equal(vidFmtp2.minptime, 10, 'video fmtp 1 minptime');
  t.equal(vidFmtp2.useinbandfec, 1, 'video fmtp 1 useinbandfec');
  t.equal(video.rtp[1].payload, 98, 'video rtp 1 payload');
  t.equal(video.rtp[1].codec, 'VP8', 'video rtp 1 codec');
  t.equal(video.rtp[1].rate, 90000, 'video rtp 1 rate');
  t.equal(video.rtcpFb[0].payload, '*', 'video rtcp-fb 0 payload');
  t.equal(video.rtcpFb[0].type, 'nack', 'video rtcp-fb 0 type');
  t.equal(video.rtcpFb[1].payload, 98, 'video rtcp-fb 0 payload');
  t.equal(video.rtcpFb[1].type, 'nack', 'video rtcp-fb 0 type');
  t.equal(video.rtcpFb[1].subtype, 'rpsi', 'video rtcp-fb 0 subtype');
  t.equal(video.rtcpFbTrrInt[0].payload, 98, 'video rtcp-fb trr-int 0 payload');
  t.equal(video.rtcpFbTrrInt[0].value, 100, 'video rtcp-fb trr-int 0 value');
  t.equal(video.crypto[0].id, 1, 'video crypto 0 id');
  t.equal(
    video.crypto[0].suite,
    'AES_CM_128_HMAC_SHA1_32',
    'video crypto 0 suite'
  );
  t.equal(
    video.crypto[0].config,
    'inline:keNcG3HezSNID7LmfDa9J4lfdUL8W1F7TNJKcbuy|2^20|1:32',
    'video crypto 0 config'
  );
  t.equal(video.ssrcs.length, 3, 'video got 3 ssrc lines');
  // test ssrc with attr:value
  t.deepEqual(
    video.ssrcs[0],
    {
      id: 1399694169,
      attribute: 'foo',
      value: 'bar',
    },
    'video 1st ssrc line attr:value'
  );
  // test ssrc with attr only
  t.deepEqual(
    video.ssrcs[1],
    {
      id: 1399694169,
      attribute: 'baz',
    },
    'video 2nd ssrc line attr only'
  );
  // test ssrc with at-tr:value
  t.deepEqual(
    video.ssrcs[2],
    {
      id: 1399694169,
      attribute: 'foo-bar',
      value: 'baz',
    },
    'video 3rd ssrc line attr with dash'
  );

  // ICE candidates (same for both audio and video in this case)
  [audio.candidates, video.candidates].forEach(function (cs, i) {
    var str = i === 0 ? 'audio ' : 'video ';
    var port = i === 0 ? 54400 : 55400;
    t.equal(cs.length, 4, str + 'got 4 candidates');
    t.equal(cs[0].foundation, 0, str + 'ice candidate 0 foundation');
    t.equal(cs[0].component, 1, str + 'ice candidate 0 component');
    t.equal(cs[0].transport, 'UDP', str + 'ice candidate 0 transport');
    t.equal(cs[0].priority, 2113667327, str + 'ice candidate 0 priority');
    t.equal(cs[0].ip, '203.0.113.1', str + 'ice candidate 0 ip');
    t.equal(cs[0].port, port, str + 'ice candidate 0 port');
    t.equal(cs[0].type, 'host', str + 'ice candidate 0 type');
    t.equal(cs[1].foundation, 1, str + 'ice candidate 1 foundation');
    t.equal(cs[1].component, 2, str + 'ice candidate 1 component');
    t.equal(cs[1].transport, 'UDP', str + 'ice candidate 1 transport');
    t.equal(cs[1].priority, 2113667326, str + 'ice candidate 1 priority');
    t.equal(cs[1].ip, '203.0.113.1', str + 'ice candidate 1 ip');
    t.equal(cs[1].port, port + 1, str + 'ice candidate 1 port');
    t.equal(cs[1].type, 'host', str + 'ice candidate 1 type');
    t.equal(cs[2].foundation, 2, str + 'ice candidate 2 foundation');
    t.equal(cs[2].component, 1, str + 'ice candidate 2 component');
    t.equal(cs[2].transport, 'UDP', str + 'ice candidate 2 transport');
    t.equal(cs[2].priority, 1686052607, str + 'ice candidate 2 priority');
    t.equal(cs[2].ip, '203.0.113.1', str + 'ice candidate 2 ip');
    t.equal(cs[2].port, port + 2, str + 'ice candidate 2 port');
    t.equal(cs[2].type, 'srflx', str + 'ice candidate 2 type');
    t.equal(cs[2].raddr, '192.168.1.145', str + 'ice candidate 2 raddr');
    t.equal(cs[2].rport, port + 2, str + 'ice candidate 2 rport');
    t.equal(cs[2].generation, 0, str + 'ice candidate 2 generation');
    t.equal(cs[2]['network-id'], 3, str + 'ice candidate 2 network-id');
    t.equal(
      cs[2]['network-cost'],
      i === 0 ? 10 : undefined,
      str + 'ice candidate 2 network-cost'
    );
    t.equal(cs[3].foundation, 3, str + 'ice candidate 3 foundation');
    t.equal(cs[3].component, 2, str + 'ice candidate 3 component');
    t.equal(cs[3].transport, 'UDP', str + 'ice candidate 3 transport');
    t.equal(cs[3].priority, 1686052606, str + 'ice candidate 3 priority');
    t.equal(cs[3].ip, '203.0.113.1', str + 'ice candidate 3 ip');
    t.equal(cs[3].port, port + 3, str + 'ice candidate 3 port');
    t.equal(cs[3].type, 'srflx', str + 'ice candidate 3 type');
    t.equal(cs[3].raddr, '192.168.1.145', str + 'ice candidate 3 raddr');
    t.equal(cs[3].rport, port + 3, str + 'ice candidate 3 rport');
    t.equal(cs[3].generation, 0, str + 'ice candidate 3 generation');
    t.equal(cs[3]['network-id'], 3, str + 'ice candidate 3 network-id');
    t.equal(
      cs[3]['network-cost'],
      i === 0 ? 10 : undefined,
      str + 'ice candidate 3 network-cost'
    );
  });

  t.equal(media.length, 2, 'got 2 m-lines');
});

/*
 * Test for an sdp that started out as something from chrome
 * it's since been hacked to include tests for other stuff
 * ignore the name
 */
test('hackySdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/hacky.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  t.equal(session.origin.sessionId, '3710604898417546434', 'origin sessionId');
  t.ok(session.groups, 'parsing session groups');
  t.equal(session.groups.length, 1, 'one grouping');
  t.equal(session.groups[0].type, 'BUNDLE', 'grouping is BUNDLE');
  t.equal(session.groups[0].mids, 'audio video', 'bundling audio video');
  t.ok(session.msidSemantic, 'have an msid semantic');
  t.equal(session.msidSemantic.semantic, 'WMS', 'webrtc semantic');
  t.equal(
    session.msidSemantic.token,
    'Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV',
    'semantic token'
  );

  // verify a=rtcp:65179 IN IP4 193.84.77.194
  t.equal(media[0].rtcp.port, 1, 'rtcp port');
  t.equal(media[0].rtcp.netType, 'IN', 'rtcp netType');
  t.equal(media[0].rtcp.ipVer, 4, 'rtcp ipVer');
  t.equal(media[0].rtcp.address, '0.0.0.0', 'rtcp address');

  // verify ice tcp types
  t.equal(media[0].candidates[0].tcptype, undefined, 'no tcptype');
  t.equal(media[0].candidates[1].tcptype, 'active', 'active tcptype');
  t.equal(media[0].candidates[1].transport, 'tcp', 'tcp transport');
  t.equal(media[0].candidates[1].generation, 0, 'generation 0');
  t.equal(media[0].candidates[1].type, 'host', 'tcp host');
  t.equal(media[0].candidates[2].generation, undefined, 'no generation');
  t.equal(media[0].candidates[2].type, 'host', 'tcp host');
  t.equal(media[0].candidates[2].tcptype, 'active', 'active tcptype');
  t.equal(media[0].candidates[3].tcptype, 'passive', 'passive tcptype');
  t.equal(media[0].candidates[4].tcptype, 'so', 'so tcptype');
  // raddr + rport + tcptype + generation
  t.equal(media[0].candidates[5].type, 'srflx', 'tcp srflx');
  t.equal(media[0].candidates[5].rport, 9, 'tcp rport');
  t.equal(media[0].candidates[5].raddr, '10.0.1.1', 'tcp raddr');
  t.equal(media[0].candidates[5].tcptype, 'active', 'active tcptype');
  t.equal(media[0].candidates[6].tcptype, 'passive', 'passive tcptype');
  t.equal(media[0].candidates[6].rport, 8998, 'tcp rport');
  t.equal(media[0].candidates[6].raddr, '10.0.1.1', 'tcp raddr');
  t.equal(media[0].candidates[6].generation, 5, 'tcp generation');

  // and verify it works without specifying the ip
  t.equal(media[1].rtcp.port, 12312, 'rtcp port');
  t.equal(media[1].rtcp.netType, undefined, 'rtcp netType');
  t.equal(media[1].rtcp.ipVer, undefined, 'rtcp ipVer');
  t.equal(media[1].rtcp.address, undefined, 'rtcp address');

  // verify a=rtpmap:126 telephone-event/8000
  var lastRtp = media[0].rtp.length - 1;
  t.equal(media[0].rtp[lastRtp].codec, 'telephone-event', 'dtmf codec');
  t.equal(media[0].rtp[lastRtp].rate, 8000, 'dtmf rate');

  t.equal(media[0].iceOptions, 'google-ice', 'ice options parsed');
  t.equal(media[0].ptime, 0.125, 'audio packet duration');
  t.equal(media[0].maxptime, 60, 'maxptime parsed');
  t.equal(media[0].rtcpMux, 'rtcp-mux', 'rtcp-mux present');

  t.equal(media[0].rtp[0].codec, 'opus', 'audio rtp 0 codec');
  t.equal(media[0].rtp[0].encoding, 2, 'audio rtp 0 encoding');

  t.ok(media[0].ssrcs, 'have ssrc lines');
  t.equal(media[0].ssrcs.length, 4, 'got 4 ssrc lines');
  var ssrcs = media[0].ssrcs;
  t.deepEqual(
    ssrcs[0],
    {
      id: 2754920552,
      attribute: 'cname',
      value: 't9YU8M1UxTF8Y1A1',
    },
    '1st ssrc line'
  );

  t.deepEqual(
    ssrcs[1],
    {
      id: 2754920552,
      attribute: 'msid',
      value:
        'Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlVa0',
    },
    '2nd ssrc line'
  );

  t.deepEqual(
    ssrcs[2],
    {
      id: 2754920552,
      attribute: 'mslabel',
      value: 'Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV',
    },
    '3rd ssrc line'
  );

  t.deepEqual(
    ssrcs[3],
    {
      id: 2754920552,
      attribute: 'label',
      value: 'Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlVa0',
    },
    '4th ssrc line'
  );

  // verify a=sctpmap:5000 webrtc-datachannel 1024
  t.ok(media[2].sctpmap, 'we have sctpmap');
  t.equal(media[2].sctpmap.sctpmapNumber, 5000, 'sctpmap number is 5000');
  t.equal(
    media[2].sctpmap.app,
    'webrtc-datachannel',
    'sctpmap app is webrtc-datachannel'
  );
  t.equal(
    media[2].sctpmap.maxMessageSize,
    1024,
    'sctpmap maxMessageSize is 1024'
  );

  // verify a=framerate:29.97
  t.ok(media[2].framerate, 'we have framerate');
  t.equal(media[2].framerate, 29.97, 'framerate is 29.97');

  // verify a=label:1
  t.ok(media[0].label, 'we have label');
  t.equal(media[0].label, 1, 'label is 1');
});

test('iceliteSdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/icelite.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  t.equal(session.icelite, 'ice-lite', 'icelite parsed');

  var rew = write(session);
  t.ok(rew.indexOf('a=ice-lite\r\n') >= 0, 'got ice-lite');
  t.ok(rew.indexOf('m=') > rew.indexOf('a=ice-lite'), 'session level icelite');
});

test('invalidSdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/invalid.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  // verify a=rtcp:65179 IN IP4 193.84.77.194
  t.equal(media[0].rtcp.port, 1, 'rtcp port');
  t.equal(media[0].rtcp.netType, 'IN', 'rtcp netType');
  t.equal(media[0].rtcp.ipVer, 7, 'rtcp ipVer');
  t.equal(media[0].rtcp.address, 'X', 'rtcp address');
  t.equal(media[0].invalid.length, 1, 'found exactly 1 invalid line'); // f= lost
  t.equal(media[0].invalid[0].value, 'goo:hithere', 'copied verbatim');
});

test('jssipSdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/jssip.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  var audio = media[0];
  var audCands = audio.candidates;
  t.equal(audCands.length, 6, '6 candidates');

  // testing ice optionals:
  t.deepEqual(
    audCands[0],
    {
      foundation: 1162875081,
      component: 1,
      transport: 'udp',
      priority: 2113937151,
      ip: '192.168.34.75',
      port: 60017,
      type: 'host',
      generation: 0,
    },
    'audio candidate 0'
  );
  t.deepEqual(
    audCands[2],
    {
      foundation: 3289912957,
      component: 1,
      transport: 'udp',
      priority: 1845501695,
      ip: '193.84.77.194',
      port: 60017,
      type: 'srflx',
      raddr: '192.168.34.75',
      rport: 60017,
      generation: 0,
    },
    'audio candidate 2 (raddr rport)'
  );
  t.deepEqual(
    audCands[4],
    {
      foundation: 198437945,
      component: 1,
      transport: 'tcp',
      priority: 1509957375,
      ip: '192.168.34.75',
      port: 0,
      type: 'host',
      generation: 0,
    },
    'audio candidate 4 (tcp)'
  );
});

test('jsepSdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/jsep.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length === 2, 'got media');

  var video = media[1];
  t.equal(video.ssrcGroups.length, 1, '1 ssrc grouping');
  t.deepEqual(
    video.ssrcGroups[0],
    {
      semantics: 'FID',
      ssrcs: '1366781083 1366781084',
    },
    'ssrc-group'
  );

  t.equal(
    video.msid,
    [
      {
        id: '61317484-2ed4-49d7-9eb7-1414322a7aae',
        appdata: 'f30bdb4a-5db8-49b5-bcdc-e0c9a23172e0',
      },
      {
        id: '93e8b9bb-ad32-417e-9d2d-42c215f50713',
        appdata: 'f30bdb4a-5db8-49b5-bcdc-e0c9a23172e0',
      },
    ],
    'msid'
  );

  t.ok(video.rtcpRsize, 'rtcp-rsize present');
  t.ok(video.bundleOnly, 'bundle-only present');

  // video contains 'a=end-of-candidates'
  // we want to ensure this comes after the candidate lines
  // so this is the only place we actually test the writer in here
  t.ok(video.endOfCandidates, 'have end of candidates marker');
  var rewritten = write(session).split('\r\n');
  var idx = rewritten.indexOf('a=end-of-candidates');
  t.equal(
    rewritten[idx - 1].slice(0, 11),
    'a=candidate',
    'marker after candidate'
  );
});

test('alacSdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/alac.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  var audio = media[0];
  t.equal(audio.type, 'audio', 'audio type');
  t.equal(audio.protocol, 'RTP/AVP', 'audio protocol');
  t.equal(audio.fmtp[0].payload, 96, 'audio fmtp 0 payload');
  t.equal(
    audio.fmtp[0].config,
    '352 0 16 40 10 14 2 255 0 0 44100',
    'audio fmtp 0 config'
  );
  t.equal(audio.rtp[0].payload, 96, 'audio rtp 0 payload');
  t.equal(audio.rtp[0].codec, 'AppleLossless', 'audio rtp 0 codec');
  t.equal(audio.rtp[0].rate, undefined, 'audio rtp 0 rate');
  t.equal(audio.rtp[0].encoding, undefined, 'audio rtp 0 encoding');
});

test('onvifSdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/onvif.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  var audio = media[0];
  t.equal(audio.type, 'audio', 'audio type');
  t.equal(audio.port, 0, 'audio port');
  t.equal(audio.protocol, 'RTP/AVP', 'audio protocol');
  t.equal(
    audio.control,
    'rtsp://example.com/onvif_camera/audio',
    'audio control'
  );
  t.equal(audio.payloads, 0, 'audio payloads');

  var video = media[1];
  t.equal(video.type, 'video', 'video type');
  t.equal(video.port, 0, 'video port');
  t.equal(video.protocol, 'RTP/AVP', 'video protocol');
  t.equal(
    video.control,
    'rtsp://example.com/onvif_camera/video',
    'video control'
  );
  t.equal(video.payloads, 26, 'video payloads');

  var application = media[2];
  t.equal(application.type, 'application', 'application type');
  t.equal(application.port, 0, 'application port');
  t.equal(application.protocol, 'RTP/AVP', 'application protocol');
  t.equal(
    application.control,
    'rtsp://example.com/onvif_camera/metadata',
    'application control'
  );
  t.equal(application.payloads, 107, 'application payloads');
  t.equal(application.direction, 'recvonly', 'application direction');
  t.equal(application.rtp[0].payload, 107, 'application rtp 0 payload');
  t.equal(
    application.rtp[0].codec,
    'vnd.onvif.metadata',
    'application rtp 0 codec'
  );
  t.equal(application.rtp[0].rate, 90000, 'application rtp 0 rate');
  t.equal(application.rtp[0].encoding, undefined, 'application rtp 0 encoding');
});

test('ssrcSdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/ssrc.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  var video = media[1];
  t.equal(video.ssrcGroups.length, 2, 'video got 2 ssrc-group lines');

  var expectedSsrc = [
    { semantics: 'FID', ssrcs: '3004364195 1126032854' },
    { semantics: 'FEC-FR', ssrcs: '3004364195 1080772241' },
  ];
  t.deepEqual(video.ssrcGroups, expectedSsrc, 'video ssrc-group obj');
});

test('simulcastSdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/simulcast.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  var video = media[1];
  t.equal(video.type, 'video', 'video type');

  // test rid lines
  t.equal(video.rids.length, 5, 'video got 5 rid lines');
  // test rid 1
  t.deepEqual(
    video.rids[0],
    {
      id: 1,
      direction: 'send',
      params: 'pt=97;max-width=1280;max-height=720;max-fps=30',
    },
    'video 1st rid line'
  );
  // test rid 2
  t.deepEqual(
    video.rids[1],
    {
      id: 2,
      direction: 'send',
      params: 'pt=98',
    },
    'video 2nd rid line'
  );
  // test rid 3
  t.deepEqual(
    video.rids[2],
    {
      id: 3,
      direction: 'send',
      params: 'pt=99',
    },
    'video 3rd rid line'
  );
  // test rid 4
  t.deepEqual(
    video.rids[3],
    {
      id: 4,
      direction: 'send',
      params: 'pt=100',
    },
    'video 4th rid line'
  );
  // test rid 5
  t.deepEqual(
    video.rids[4],
    {
      id: 'c',
      direction: 'recv',
      params: 'pt=97',
    },
    'video 5th rid line'
  );
  // test rid 1 params
  var rid1Params = parseParams(video.rids[0].params);
  t.deepEqual(
    rid1Params,
    {
      pt: 97,
      'max-width': 1280,
      'max-height': 720,
      'max-fps': 30,
    },
    'video 1st rid params'
  );
  // test rid 2 params
  var rid2Params = parseParams(video.rids[1].params);
  t.deepEqual(
    rid2Params,
    {
      pt: 98,
    },
    'video 2nd rid params'
  );
  // test rid 3 params
  var rid3Params = parseParams(video.rids[2].params);
  t.deepEqual(
    rid3Params,
    {
      pt: 99,
    },
    'video 3rd rid params'
  );
  // test rid 4 params
  var rid4Params = parseParams(video.rids[3].params);
  t.deepEqual(
    rid4Params,
    {
      pt: 100,
    },
    'video 4th rid params'
  );
  // test rid 5 params
  var rid5Params = parseParams(video.rids[4].params);
  t.deepEqual(
    rid5Params,
    {
      pt: 97,
    },
    'video 5th rid params'
  );

  // test imageattr lines
  t.equal(video.imageattrs.length, 5, 'video got 5 imageattr lines');
  // test imageattr 1
  t.deepEqual(
    video.imageattrs[0],
    {
      pt: 97,
      dir1: 'send',
      attrs1: '[x=1280,y=720]',
      dir2: 'recv',
      attrs2: '[x=1280,y=720] [x=320,y=180] [x=160,y=90]',
    },
    'video 1st imageattr line'
  );
  // test imageattr 2
  t.deepEqual(
    video.imageattrs[1],
    {
      pt: 98,
      dir1: 'send',
      attrs1: '[x=320,y=180]',
    },
    'video 2nd imageattr line'
  );
  // test imageattr 3
  t.deepEqual(
    video.imageattrs[2],
    {
      pt: 99,
      dir1: 'send',
      attrs1: '[x=160,y=90]',
    },
    'video 3rd imageattr line'
  );
  // test imageattr 4
  t.deepEqual(
    video.imageattrs[3],
    {
      pt: 100,
      dir1: 'recv',
      attrs1: '[x=1280,y=720] [x=320,y=180]',
      dir2: 'send',
      attrs2: '[x=1280,y=720]',
    },
    'video 4th imageattr line'
  );
  // test imageattr 5
  t.deepEqual(
    video.imageattrs[4],
    {
      pt: '*',
      dir1: 'recv',
      attrs1: '*',
    },
    'video 5th imageattr line'
  );
  // test imageattr 1 send params
  var imageattr1SendParams = parseImageAttributes(video.imageattrs[0].attrs1);
  t.deepEqual(
    imageattr1SendParams,
    [{ x: 1280, y: 720 }],
    'video 1st imageattr send params'
  );
  // test imageattr 1 recv params
  var imageattr1RecvParams = parseImageAttributes(video.imageattrs[0].attrs2);
  t.deepEqual(
    imageattr1RecvParams,
    [
      { x: 1280, y: 720 },
      { x: 320, y: 180 },
      { x: 160, y: 90 },
    ],
    'video 1st imageattr recv params'
  );
  // test imageattr 2 send params
  var imageattr2SendParams = parseImageAttributes(video.imageattrs[1].attrs1);
  t.deepEqual(
    imageattr2SendParams,
    [{ x: 320, y: 180 }],
    'video 2nd imageattr send params'
  );
  // test imageattr 3 send params
  var imageattr3SendParams = parseImageAttributes(video.imageattrs[2].attrs1);
  t.deepEqual(
    imageattr3SendParams,
    [{ x: 160, y: 90 }],
    'video 3rd imageattr send params'
  );
  // test imageattr 4 recv params
  var imageattr4RecvParams = parseImageAttributes(video.imageattrs[3].attrs1);
  t.deepEqual(
    imageattr4RecvParams,
    [
      { x: 1280, y: 720 },
      { x: 320, y: 180 },
    ],
    'video 4th imageattr recv params'
  );
  // test imageattr 4 send params
  var imageattr4SendParams = parseImageAttributes(video.imageattrs[3].attrs2);
  t.deepEqual(
    imageattr4SendParams,
    [{ x: 1280, y: 720 }],
    'video 4th imageattr send params'
  );
  // test imageattr 5 recv params
  t.equal(video.imageattrs[4].attrs1, '*', 'video 5th imageattr recv params');

  // test simulcast line
  t.deepEqual(
    video.simulcast,
    {
      dir1: 'send',
      list1: '1,~4;2;3',
      dir2: 'recv',
      list2: 'c',
    },
    'video simulcast line'
  );
  // test simulcast send streams
  var simulcastSendStreams = parseSimulcast(video.simulcast.list1);
  t.deepEqual(
    simulcastSendStreams,
    [
      [
        { scid: 1, paused: false },
        { scid: 4, paused: true },
      ],
      [{ scid: 2, paused: false }],
      [{ scid: 3, paused: false }],
    ],
    'video simulcast send streams'
  );
  // test simulcast recv streams
  var simulcastRecvStreams = parseSimulcast(video.simulcast.list2);
  t.deepEqual(
    simulcastRecvStreams,
    [[{ scid: 'c', paused: false }]],
    'video simulcast recv streams'
  );

  // test simulcast version 03 line
  // test simulcast line
  t.deepEqual(
    video.simulcast_03,
    {
      value: 'send rid=1,4;2;3 paused=4 recv rid=c',
    },
    'video simulcast draft 03 line'
  );
});

test('ST2022-6', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/st2022-6.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  var video = media[0];
  var sourceFilter = video.sourceFilter;
  t.equal(sourceFilter.filterMode, 'incl', 'filter-mode is "incl"');
  t.equal(sourceFilter.netType, 'IN', 'nettype is "IN"');
  t.equal(sourceFilter.addressTypes, 'IP4', 'address-type is "IP4"');
  t.equal(sourceFilter.destAddress, '239.0.0.1', 'dest-address is "239.0.0.1"');
  t.equal(sourceFilter.srcList, '192.168.20.20', 'src-list is "192.168.20.20"');
});

test('ST2110-20', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/st2110-20.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  var video = media[0];
  var sourceFilter = video.sourceFilter;
  t.equal(sourceFilter.filterMode, 'incl', 'filter-mode is "incl"');
  t.equal(sourceFilter.netType, 'IN', 'nettype is "IN"');
  t.equal(sourceFilter.addressTypes, 'IP4', 'address-type is "IP4"');
  t.equal(
    sourceFilter.destAddress,
    '239.100.9.10',
    'dest-address is "239.100.9.10"'
  );
  t.equal(sourceFilter.srcList, '192.168.100.2', 'src-list is "192.168.100.2"');

  t.equal(video.type, 'video', 'video type');
  var fmtp0Params = parseParams(video.fmtp[0].config);
  t.deepEqual(
    fmtp0Params,
    {
      sampling: 'YCbCr-4:2:2',
      width: 1280,
      height: 720,
      interlace: undefined,
      exactframerate: '60000/1001',
      depth: 10,
      TCS: 'SDR',
      colorimetry: 'BT709',
      PM: '2110GPM',
      SSN: 'ST2110-20:2017',
    },
    'video 5th rid params'
  );
});

test('SCTP-DTLS-26', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/sctp-dtls-26.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  t.equal(session.origin.sessionId, '5636137646675714991', 'origin sessionId');
  t.ok(session.groups, 'parsing session groups');
  t.equal(session.groups.length, 1, 'one grouping');
  t.equal(session.groups[0].type, 'BUNDLE', 'grouping is BUNDLE');
  t.equal(session.groups[0].mids, 'data', 'bundling data');
  t.ok(session.msidSemantic, 'have an msid semantic');
  t.equal(session.msidSemantic.semantic, 'WMS', 'webrtc semantic');

  // verify media is data application
  t.equal(media[0].type, 'application', 'media type application');
  t.equal(media[0].mid, 'data', 'media  id pplication');

  // verify protocol and ports
  t.equal(media[0].protocol, 'UDP/DTLS/SCTP', 'protocol is UDP/DTLS/SCTP');
  t.equal(media[0].port, 9, 'the UDP port value is 9');
  t.equal(
    media[0].sctpPort,
    5000,
    'the offerer/answer SCTP port value is 5000'
  );

  // verify maxMessageSize
  t.equal(media[0].maxMessageSize, 10000, 'maximum message size is 10000');
});

test('extmapEncryptSdp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/extmap-encrypt.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length > 0, 'got media');

  t.equal(session.origin.username, '-', 'origin username');
  t.equal(session.origin.sessionId, 20518, 'origin sessionId');
  t.equal(session.origin.sessionVersion, 0, 'origin sessionVersion');
  t.equal(session.origin.netType, 'IN', 'origin netType');
  t.equal(session.origin.ipVer, 4, 'origin ipVer');
  t.equal(session.origin.address, '203.0.113.1', 'origin address');

  t.equal(session.connection.ip, '203.0.113.1', 'session connect ip');
  t.equal(session.connection.version, 4, 'session connect ip ver');

  var audio = media[0];
  t.equal(audio.type, 'audio', 'audio type');
  t.equal(audio.port, 54400, 'audio port');
  t.equal(audio.protocol, 'RTP/SAVPF', 'audio protocol');
  t.equal(audio.rtp[0].payload, 96, 'audio rtp 0 payload');
  t.equal(audio.rtp[0].codec, 'opus', 'audio rtp 0 codec');
  t.equal(audio.rtp[0].rate, 48000, 'audio rtp 0 rate');

  // extmap and encrypted extmap
  t.deepEqual(
    audio.ext[0],
    {
      value: 1,
      direction: 'sendonly',
      uri: 'URI-toffset',
    },
    'audio extension 0'
  );
  t.deepEqual(
    audio.ext[1],
    {
      value: 2,
      uri: 'urn:ietf:params:rtp-hdrext:toffset',
    },
    'audio extension 1'
  );
  t.deepEqual(
    audio.ext[2],
    {
      value: 3,
      'encrypt-uri': 'urn:ietf:params:rtp-hdrext:encrypt',
      uri: 'urn:ietf:params:rtp-hdrext:smpte-tc',
      config: '25@600/24',
    },
    'audio extension 2'
  );
  t.deepEqual(
    audio.ext[3],
    {
      value: 4,
      direction: 'recvonly',
      'encrypt-uri': 'urn:ietf:params:rtp-hdrext:encrypt',
      uri: 'URI-gps-string',
    },
    'audio extension 3'
  );

  t.equal(media.length, 1, 'got 1 m-lines');
});

test('dante-aes67', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/dante-aes67.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length == 1, 'got single media');

  t.equal(session.origin.username, '-', 'origin username');
  t.equal(session.origin.sessionId, 1423986, 'origin sessionId');
  t.equal(session.origin.sessionVersion, 1423994, 'origin sessionVersion');
  t.equal(session.origin.netType, 'IN', 'origin netType');
  t.equal(session.origin.ipVer, 4, 'origin ipVer');
  t.equal(session.origin.address, '169.254.98.63', 'origin address');

  t.equal(session.name, 'AOIP44-serial-1614 : 2', 'Session Name');
  t.equal(session.keywords, 'Dante', 'Keywords');

  t.equal(session.connection.ip, '239.65.125.63/32', 'session connect ip');
  t.equal(session.connection.version, 4, 'session connect ip ver');

  var audio = media[0];
  t.equal(audio.type, 'audio', 'audio type');
  t.equal(audio.port, 5004, 'audio port');
  t.equal(audio.protocol, 'RTP/AVP', 'audio protocol');
  t.equal(audio.direction, 'recvonly', 'audio direction');
  t.equal(
    audio.description,
    '2 channels: TxChan 0, TxChan 1',
    'audio description'
  );
  t.equal(audio.ptime, 1, 'audio packet duration');
  t.equal(audio.rtp[0].payload, 97, 'audio rtp payload type');
  t.equal(audio.rtp[0].codec, 'L24', 'audio rtp codec');
  t.equal(audio.rtp[0].rate, 48000, 'audio sample rate');
  t.equal(audio.rtp[0].encoding, 2, 'audio channels');
});

test('bfcp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/bfcp.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length == 4, 'got 4 media');

  t.equal(session.origin.username, '-', 'origin username');

  var audio = media[0];
  t.equal(audio.type, 'audio', 'audio type');

  var video = media[1];
  t.equal(video.type, 'video', 'main video type');
  t.equal(video.direction, 'sendrecv', 'main video direction');
  t.equal(video.content, 'main', 'main video content');
  t.equal(video.label, 1, 'main video label');

  var app = media[2];
  t.equal(app.type, 'application', 'application type');
  t.equal(app.port, 3238, 'application port');
  t.equal(app.protocol, 'UDP/BFCP', 'bfcp protocol');
  t.equal(app.payloads, '*', 'bfcp payloads');
  t.equal(app.connectionType, 'new', 'connection type');
  t.equal(app.bfcpFloorCtrl, 's-only', 'bfcp Floor Control');
  t.equal(app.bfcpConfId, 1, 'bfcp ConfId');
  t.equal(app.bfcpUserId, 1, 'bfcp UserId');
  t.equal(app.bfcpFloorId.id, 1, 'bfcp FloorId');
  t.equal(app.bfcpFloorId.mStream, 3, 'bfcp Floor Stream');

  var video2 = media[3];
  t.equal(video2.type, 'video', '2nd video type');
  t.equal(video2.direction, 'sendrecv', '2nd video direction');
  t.equal(video2.content, 'slides', '2nd video content');
  t.equal(video2.label, 3, '2nd video label');
});

test('tcp-active', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/tcp-active.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length == 1, 'got single media');

  t.equal(session.origin.username, '-', 'origin username');
  t.equal(session.origin.sessionId, 1562876543, 'origin sessionId');
  t.equal(session.origin.sessionVersion, 11, 'origin sessionVersion');
  t.equal(session.origin.netType, 'IN', 'origin netType');
  t.equal(session.origin.ipVer, 4, 'origin ipVer');
  t.equal(session.origin.address, '192.0.2.3', 'origin address');

  var image = media[0];
  t.equal(image.type, 'image', 'image type');
  t.equal(image.port, 9, 'port');
  t.equal(image.connection.version, 4, 'Connection is IPv4');
  t.equal(image.connection.ip, '192.0.2.3', 'Connection address');
  t.equal(image.protocol, 'TCP', 'TCP protocol');
  t.equal(image.payloads, 't38', 'TCP payload');
  t.equal(image.setup, 'active', 'setup active');
  t.equal(image.connectionType, 'new', 'new connection');
});

test('tcp-passive', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/tcp-passive.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length == 1, 'got single media');

  t.equal(session.origin.username, '-', 'origin username');
  t.equal(session.origin.sessionId, 1562876543, 'origin sessionId');
  t.equal(session.origin.sessionVersion, 11, 'origin sessionVersion');
  t.equal(session.origin.netType, 'IN', 'origin netType');
  t.equal(session.origin.ipVer, 4, 'origin ipVer');
  t.equal(session.origin.address, '192.0.2.2', 'origin address');

  var image = media[0];
  t.equal(image.type, 'image', 'image type');
  t.equal(image.port, 54111, 'port');
  t.equal(image.connection.version, 4, 'Connection is IPv4');
  t.equal(image.connection.ip, '192.0.2.2', 'Connection address');
  t.equal(image.protocol, 'TCP', 'TCP protocol');
  t.equal(image.payloads, 't38', 'TCP payload');
  t.equal(image.setup, 'passive', 'setup passive');
  t.equal(image.connectionType, 'existing', 'existing connection');
});

test('mediaclk-avbtp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/mediaclk-avbtp.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length == 1, 'got single media');

  var audio = media[0];
  t.equal(audio.mediaClk.mediaClockName, 'IEEE1722', 'IEEE1722 Media Clock');
  t.equal(
    audio.mediaClk.mediaClockValue,
    '38-D6-6D-8E-D2-78-13-2F',
    'AVB stream ID'
  );
});

test('mediaclk-ptp-v2-w-rate', function* (t) {
  var sdp = yield fs.readFile(
    __dirname + '/mediaclk-ptp-v2-w-rate.sdp',
    'utf8'
  );

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length == 1, 'got single media');

  var audio = media[0];
  t.equal(audio.mediaClk.mediaClockName, 'direct', 'Direct Media Clock');
  t.equal(audio.mediaClk.mediaClockValue, 963214424, 'offset');
  t.equal(audio.mediaClk.rateNumerator, 1000, 'rate numerator');
  t.equal(audio.mediaClk.rateDenominator, 1001, 'rate denominator');
});

test('mediaclk-ptp-v2', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/mediaclk-ptp-v2.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length == 1, 'got single media');

  var audio = media[0];
  t.equal(audio.mediaClk.mediaClockName, 'direct', 'Direct Media Clock');
  t.equal(audio.mediaClk.mediaClockValue, 963214424, 'offset');
});

test('mediaclk-rtp', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/mediaclk-rtp.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');
  var media = session.media;
  t.ok(media && media.length == 1, 'got single media');

  var audio = media[0];
  t.equal(audio.mediaClk.id, 'MDA6NjA6MmI6MjA6MTI6MWY=', 'Media Clock ID');
  t.equal(audio.mediaClk.mediaClockName, 'sender', 'sender type');
});

test('ts-refclk-media', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/ts-refclk-media.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');

  var sessTsRefClocks = session.tsRefClocks;
  t.ok(sessTsRefClocks && sessTsRefClocks.length == 1, 'got one TS Ref Clock');
  t.equal(
    sessTsRefClocks[0].clksrc,
    'local',
    'local Clock Source at Session Level'
  );

  var media = session.media;
  t.ok(media && media.length == 2, 'got two media');

  var audio = media[0];
  var audTsRefClocks = audio.tsRefClocks;
  t.ok(
    audTsRefClocks && audTsRefClocks.length == 2,
    'got two audio TS Ref Clocks'
  );

  var audTsRefClock1 = audTsRefClocks[0];
  t.equal(audTsRefClock1.clksrc, 'ntp', 'NTP Clock Source');
  t.equal(audTsRefClock1.clksrcExt, '203.0.113.10', 'IPv4 address');

  var audTsRefClock2 = audTsRefClocks[1];
  t.equal(audTsRefClock2.clksrc, 'ntp', 'NTP Clock Source');
  t.equal(audTsRefClock2.clksrcExt, '198.51.100.22', 'IPv4 address');

  var video = media[1];
  var vidTsRefClocks = video.tsRefClocks;
  t.ok(
    vidTsRefClocks && vidTsRefClocks.length == 1,
    'got one video TS Ref Clocks'
  );
  t.equal(vidTsRefClocks[0].clksrc, 'ptp', 'PTP Clock Source');
  t.equal(
    vidTsRefClocks[0].clksrcExt,
    'IEEE802.1AS-2011:39-A7-94-FF-FE-07-CB-D0',
    'PTP config'
  );
});

test('ts-refclk-sess', function* (t) {
  var sdp = yield fs.readFile(__dirname + '/ts-refclk-sess.sdp', 'utf8');

  var session = parse(sdp + '');
  t.ok(session, 'got session info');

  var sessTsRefClocks = session.tsRefClocks;
  t.ok(
    sessTsRefClocks && sessTsRefClocks.length == 1,
    'got one TS Ref Clock at Session Level'
  );
  t.equal(sessTsRefClocks[0].clksrc, 'ntp', 'NTP Clock Source');
  t.equal(
    sessTsRefClocks[0].clksrcExt,
    '/traceable/',
    'traceable Clock Source'
  );
});
