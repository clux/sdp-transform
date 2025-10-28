import * as fs from 'node:fs';
import {
  parse,
  parseParams,
  parseImageAttributes,
  parseSimulcast,
  write,
} from '../index';

test('normal.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/normal.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();
  expect(session.origin.username).toBe('-');
  expect(session.origin.sessionId).toBe(20518);
  expect(session.origin.sessionVersion).toBe(0);
  expect(session.origin.netType).toBe('IN');
  expect(session.origin.ipVer).toBe(4);
  expect(session.origin.address).toBe('203.0.113.1');

  expect(session.connection!.ip).toBe('203.0.113.1');
  expect(session.connection!.version).toBe(4);

  // global ICE and fingerprint
  expect(session.iceUfrag).toBe('F7gI');
  expect(session.icePwd).toBe('x9cml/YzichV2+XlhiMu8g');

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(2);

  const audio = media[0]!;

  expect(audio.type).toBe('audio');
  expect(audio.port).toBe(54400);
  expect(audio.protocol).toBe('RTP/SAVPF');
  expect(audio.direction).toBe('sendrecv');
  expect(audio.rtp[0]!.payload).toBe(0);
  expect(audio.rtp[0]!.codec).toBe('PCMU');
  expect(audio.rtp[0]!.rate).toBe(8000);
  expect(audio.rtp[1]!.payload).toBe(96);
  expect(audio.rtp[1]!.codec).toBe('opus');
  expect(audio.rtp[1]!.rate).toBe(48000);
  expect(audio.ext![0]).toEqual({
    value: 1,
    uri: 'URI-toffset',
  });
  expect(audio.ext![1]).toEqual({
    value: 2,
    direction: 'recvonly',
    uri: 'URI-gps-string',
  });
  expect(audio.extmapAllowMixed).toBe('extmap-allow-mixed');

  const video = media[1]!;

  expect(video.type).toBe('video');
  expect(video.port).toBe(55400);
  expect(video.protocol).toBe('RTP/SAVPF');
  expect(video.direction).toBe('sendrecv');
  expect(video.rtp[0]!.payload).toBe(97);
  expect(video.rtp[0]!.codec).toBe('H264');
  expect(video.rtp[0]!.rate).toBe(90000);
  expect(video.fmtp[0]!.payload).toBe(97);

  const vidFmtp = parseParams(video.fmtp[0]!.config);

  expect(vidFmtp['profile-level-id']).toBe('4d0028');
  expect(vidFmtp['packetization-mode']).toBe(1);
  expect(vidFmtp['sprop-parameter-sets']).toBe('Z0IAH5WoFAFuQA==,aM48gA==');
  expect(video.fmtp[1]!.payload).toBe(98);

  const vidFmtp2 = parseParams(video.fmtp[1]!.config);

  expect(vidFmtp2['minptime']).toBe(10);
  expect(vidFmtp2['useinbandfec']).toBe(1);
  expect(video.rtp[1]!.payload).toBe(98);
  expect(video.rtp[1]!.codec).toBe('VP8');
  expect(video.rtp[1]!.rate).toBe(90000);
  expect(video.rtcpFb![0]!.payload).toBe('*');
  expect(video.rtcpFb![0]!.type).toBe('nack');
  expect(video.rtcpFb![1]!.payload).toBe(98);
  expect(video.rtcpFb![1]!.type).toBe('nack');
  expect(video.rtcpFb![1]!.subtype).toBe('rpsi');
  expect(video.rtcpFbTrrInt![0]!.payload).toBe(98);
  expect(video.rtcpFbTrrInt![0]!.value).toBe(100);
  expect(video.crypto![0]!.id).toBe(1);
  expect(video.crypto![0]!.suite).toBe('AES_CM_128_HMAC_SHA1_32');
  expect(video.crypto![0]!.config).toBe(
    'inline:keNcG3HezSNID7LmfDa9J4lfdUL8W1F7TNJKcbuy|2^20|1:32'
  );
  expect(video.ssrcs!.length).toBe(3);
  // test ssrc with attr:value
  expect(video.ssrcs![0]).toEqual({
    id: 1399694169,
    attribute: 'foo',
    value: 'bar',
  });
  // test ssrc with attr only
  expect(video.ssrcs![1]).toEqual({
    id: 1399694169,
    attribute: 'baz',
  });
  // test ssrc with at-tr:value
  expect(video.ssrcs![2]).toEqual({
    id: 1399694169,
    attribute: 'foo-bar',
    value: 'baz',
  });

  // ICE candidates (same for both audio and video in this case)
  for (const [i, cs] of [audio.candidates, video.candidates].entries()) {
    const port = i === 0 ? 54400 : 55400;

    expect(cs!.length).toBe(4);
    expect(cs![0]!.foundation).toBe(0);
    expect(cs![0]!.component).toBe(1);
    expect(cs![0]!.transport).toBe('UDP');
    expect(cs![0]!.priority).toBe(2113667327);
    expect(cs![0]!.ip).toBe('203.0.113.1');
    expect(cs![0]!.port).toBe(port);
    expect(cs![0]!.type).toBe('host');
    expect(cs![1]!.foundation).toBe(1);
    expect(cs![1]!.component).toBe(2);
    expect(cs![1]!.transport).toBe('UDP');
    expect(cs![1]!.priority).toBe(2113667326);
    expect(cs![1]!.ip).toBe('203.0.113.1');
    expect(cs![1]!.port).toBe(port + 1);
    expect(cs![1]!.type).toBe('host');
    expect(cs![2]!.foundation).toBe(2);
    expect(cs![2]!.component).toBe(1);
    expect(cs![2]!.transport).toBe('UDP');
    expect(cs![2]!.priority).toBe(1686052607);
    expect(cs![2]!.ip).toBe('203.0.113.1');
    expect(cs![2]!.port).toBe(port + 2);
    expect(cs![2]!.type).toBe('srflx');
    expect(cs![2]!.raddr).toBe('192.168.1.145');
    expect(cs![2]!.rport).toBe(port + 2);
    expect(cs![2]!.generation).toBe(0);
    expect(cs![2]!['network-id']).toBe(3);
    expect(cs![2]!['network-cost']).toBe(i === 0 ? 10 : undefined);
    expect(cs![3]!.foundation).toBe(3);
    expect(cs![3]!.component).toBe(2);
    expect(cs![3]!.transport).toBe('UDP');
    expect(cs![3]!.priority).toBe(1686052606);
    expect(cs![3]!.ip).toBe('203.0.113.1');
    expect(cs![3]!.port).toBe(port + 3);
    expect(cs![3]!.type).toBe('srflx');
    expect(cs![3]!.raddr).toBe('192.168.1.145');
    expect(cs![3]!.rport).toBe(port + 3);
    expect(cs![3]!.generation).toBe(0);
    expect(cs![3]!['network-id']).toBe(3);
    expect(cs![3]!['network-cost']).toBe(i === 0 ? 10 : undefined);
  }
});

// /*
//  * Test for an sdp that started out as something from chrome
//  * it's since been hacked to include tests for other stuff
//  * ignore the name
//  */
test('hacky.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/hacky.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();
  expect(session.origin.sessionId).toBe('3710604898417546434');
  expect(session.groups).toBeTruthy();
  expect(session.groups!.length).toBe(1);
  expect(session.groups![0]!.type).toBe('BUNDLE');
  expect(session.groups![0]!.mids).toBe('audio video');
  expect(session.msidSemantic).toBeTruthy();
  expect(session.msidSemantic!.semantic).toBe('WMS');
  expect(session.msidSemantic!.token).toBe(
    'Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV'
  );

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(3);

  const audio = media[0]!;

  // verify a=rtcp:65179 IN IP4 193.84.77.194
  expect(audio.rtcp!.port).toBe(1);
  expect(audio.rtcp!.netType).toBe('IN');
  expect(audio.rtcp!.ipVer).toBe(4);
  expect(audio.rtcp!.address).toBe('0.0.0.0');

  // verify ice tcp types
  expect(audio.candidates![0]!.tcptype).toBeUndefined();
  expect(audio.candidates![1]!.tcptype).toBe('active');
  expect(audio.candidates![1]!.transport).toBe('tcp');
  expect(audio.candidates![1]!.generation).toBe(0);
  expect(audio.candidates![1]!.type).toBe('host');
  expect(audio.candidates![2]!.generation).toBeUndefined();
  expect(audio.candidates![2]!.type).toBe('host');
  expect(audio.candidates![2]!.tcptype).toBe('active');
  expect(audio.candidates![3]!.tcptype).toBe('passive');
  expect(audio.candidates![4]!.tcptype).toBe('so');
  // raddr + rport + tcptype + generation
  expect(audio.candidates![5]!.type).toBe('srflx');
  expect(audio.candidates![5]!.rport).toBe(9);
  expect(audio.candidates![5]!.raddr).toBe('10.0.1.1');
  expect(audio.candidates![5]!.tcptype).toBe('active');
  expect(audio.candidates![6]!.tcptype).toBe('passive');
  expect(audio.candidates![6]!.rport).toBe(8998);
  expect(audio.candidates![6]!.raddr).toBe('10.0.1.1');
  expect(audio.candidates![6]!.generation).toBe(5);

  // verify a=label:1
  expect(audio.label).toBeTruthy();
  expect(audio.label).toBe(1);

  const video = media[1]!;

  // and verify it works without specifying the ip
  expect(video.rtcp!.port).toBe(12312);
  expect(video.rtcp!.netType).toBeUndefined();
  expect(video.rtcp!.ipVer).toBeUndefined();
  expect(video.rtcp!.address).toBeUndefined();

  // verify a=rtpmap:126 telephone-event/8000
  const lastRtp = audio.rtp.length - 1;

  expect(audio.rtp[lastRtp]!.codec).toBe('telephone-event');
  expect(audio.rtp[lastRtp]!.rate).toBe(8000);

  expect(audio.iceOptions).toBe('google-ice');
  expect(audio.ptime).toBe(0.125);
  expect(audio.maxptime).toBe(60);
  expect(audio.rtcpMux).toBe('rtcp-mux');

  expect(audio.rtp[0]!.codec).toBe('opus');
  expect(audio.rtp[0]!.encoding).toBe(2);

  const ssrcs = audio.ssrcs!;

  expect(ssrcs).toBeTruthy();
  expect(ssrcs.length).toBe(4);
  expect(ssrcs[0]).toEqual({
    id: 2754920552,
    attribute: 'cname',
    value: 't9YU8M1UxTF8Y1A1',
  });
  expect(ssrcs[1]).toEqual({
    id: 2754920552,
    attribute: 'msid',
    value:
      'Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlVa0',
  });
  expect(ssrcs[2]).toEqual({
    id: 2754920552,
    attribute: 'mslabel',
    value: 'Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV',
  });
  expect(ssrcs[3]).toEqual({
    id: 2754920552,
    attribute: 'label',
    value: 'Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlVa0',
  });

  const application = media[2]!;

  // verify a=sctpmap:5000 webrtc-datachannel 1024
  expect(application.sctpmap).toBeTruthy();
  expect(application.sctpmap!.sctpmapNumber).toBe(5000);
  expect(application.sctpmap!.app).toBe('webrtc-datachannel');
  expect(application.sctpmap!.maxMessageSize).toBe(1024);

  // verify a=framerate:29.97
  expect(application.framerate).toBeTruthy();
  expect(application.framerate).toBe(29.97);
});

test('icelite.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/icelite.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();
  expect(session.icelite).toBe('ice-lite');

  const rewritten = write(session);

  expect(rewritten.indexOf('a=ice-lite\r\n')).toBeGreaterThanOrEqual(0);
  expect(rewritten.indexOf('m=')).toBeGreaterThan(
    rewritten.indexOf('a=ice-lite')
  );
});

test('invalid.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/invalid.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();
  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const audio = media[0]!;

  // verify a=rtcp:65179 IN IP4 193.84.77.194
  expect(audio.rtcp!.port).toBe(1);
  expect(audio.rtcp!.netType).toBe('IN');
  expect(audio.rtcp!.ipVer).toBe(7);
  expect(audio.rtcp!.address).toBe('X');
  expect(audio.invalid!.length).toBe(1);
  expect(audio.invalid![0]!.value).toBe('goo:hithere');
});

test('jssip.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/jssip.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const audio = media[0]!;
  const candidates = audio.candidates!;

  expect(candidates.length).toBe(6);

  // testing ice optionals:
  expect(candidates[0]).toEqual({
    foundation: 1162875081,
    component: 1,
    transport: 'udp',
    priority: 2113937151,
    ip: '192.168.34.75',
    port: 60017,
    type: 'host',
    generation: 0,
  });
  expect(candidates[2]).toEqual({
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
  });
  expect(candidates[4]).toEqual({
    foundation: 198437945,
    component: 1,
    transport: 'tcp',
    priority: 1509957375,
    ip: '192.168.34.75',
    port: 0,
    type: 'host',
    generation: 0,
  });
});

test('jsep.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/jsep.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(2);

  const video = media[1]!;

  expect(video.ssrcGroups!.length).toBe(1);
  expect(video.ssrcGroups![0]).toEqual({
    semantics: 'FID',
    ssrcs: '1366781083 1366781084',
  });
  expect(video.msid).toEqual([
    {
      id: '61317484-2ed4-49d7-9eb7-1414322a7aae',
      appdata: 'f30bdb4a-5db8-49b5-bcdc-e0c9a23172e0',
    },
    {
      id: '93e8b9bb-ad32-417e-9d2d-42c215f50713',
      appdata: 'f30bdb4a-5db8-49b5-bcdc-e0c9a23172e0',
    },
  ]);
  expect(video.rtcpRsize).toBeTruthy();
  expect(video.bundleOnly).toBeTruthy();

  // video contains 'a=end-of-candidates'
  // we want to ensure this comes after the candidate lines
  // so this is the only place we actually test the writer in here
  expect(video.endOfCandidates).toBeTruthy();

  const rewritten = write(session).split('\r\n');
  const idx = rewritten.indexOf('a=end-of-candidates');

  expect(rewritten[idx - 1]!.slice(0, 11)).toBe('a=candidate');
});

test('alac.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/alac.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const audio = media[0]!;

  expect(audio.type).toBe('audio');
  expect(audio.protocol).toBe('RTP/AVP');
  expect(audio.fmtp[0]!.payload).toBe(96);
  expect(audio.fmtp[0]!.config).toBe('352 0 16 40 10 14 2 255 0 0 44100');
  expect(audio.rtp[0]!.payload).toBe(96);
  expect(audio.rtp[0]!.codec).toBe('AppleLossless');
  expect(audio.rtp[0]!.rate).toBeUndefined();
  expect(audio.rtp[0]!.encoding).toBeUndefined();
});

test('onvif.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/onvif.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(3);

  const audio = media[0]!;

  expect(audio.type).toBe('audio');
  expect(audio.port).toBe(0);
  expect(audio.protocol).toBe('RTP/AVP');
  expect(audio.control).toBe('rtsp://example.com/onvif_camera/audio');
  expect(audio.payloads).toBe(0);

  const video = media[1]!;

  expect(video.type).toBe('video');
  expect(video.port).toBe(0);
  expect(video.protocol).toBe('RTP/AVP');
  expect(video.control).toBe('rtsp://example.com/onvif_camera/video');
  expect(video.payloads).toBe(26);

  const application = media[2]!;

  expect(application.type).toBe('application');
  expect(application.port).toBe(0);
  expect(application.protocol).toBe('RTP/AVP');
  expect(application.control).toBe('rtsp://example.com/onvif_camera/metadata');
  expect(application.payloads).toBe(107);
  expect(application.direction).toBe('recvonly');
  expect(application.rtp[0]!.payload).toBe(107);
  expect(application.rtp[0]!.codec).toBe('vnd.onvif.metadata');
  expect(application.rtp[0]!.rate).toBe(90000);
  expect(application.rtp[0]!.encoding).toBeUndefined();
});

test('ssrc.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/ssrc.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(2);

  const video = media[1]!;

  expect(video.ssrcGroups!.length).toBe(2);
  expect(video.ssrcGroups).toEqual([
    { semantics: 'FID', ssrcs: '3004364195 1126032854' },
    { semantics: 'FEC-FR', ssrcs: '3004364195 1080772241' },
  ]);
});

test('simulcast.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/simulcast.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(2);

  const video = media[1]!;

  expect(video.type).toBe('video');

  // test rid lines
  expect(video.rids!.length).toBe(5);
  // test rid 1
  expect(video.rids![0]).toEqual({
    id: 1,
    direction: 'send',
    params: 'pt=97;max-width=1280;max-height=720;max-fps=30',
  });
  // test rid 2
  expect(video.rids![1]).toEqual({
    id: 2,
    direction: 'send',
    params: 'pt=98',
  });
  // test rid 3
  expect(video.rids![2]).toEqual({
    id: 3,
    direction: 'send',
    params: 'pt=99',
  });
  // test rid 4
  expect(video.rids![3]).toEqual({
    id: 4,
    direction: 'send',
    params: 'pt=100',
  });
  // test rid 5
  expect(video.rids![4]).toEqual({
    id: 'c',
    direction: 'recv',
    params: 'pt=97',
  });

  // test rid 1 params
  const rid1Params = parseParams(video.rids![0]!.params);

  expect(rid1Params).toEqual({
    pt: 97,
    'max-width': 1280,
    'max-height': 720,
    'max-fps': 30,
  });

  // test rid 2 params
  const rid2Params = parseParams(video.rids![1]!.params);

  expect(rid2Params).toEqual({
    pt: 98,
  });

  // test rid 3 params
  const rid3Params = parseParams(video.rids![2]!.params);

  expect(rid3Params).toEqual({
    pt: 99,
  });

  // test rid 4 params
  const rid4Params = parseParams(video.rids![3]!.params);

  expect(rid4Params).toEqual({
    pt: 100,
  });

  // test rid 5 params
  const rid5Params = parseParams(video.rids![4]!.params);

  expect(rid5Params).toEqual({
    pt: 97,
  });

  // test imageattr lines
  expect(video.imageattrs!.length).toBe(5);

  // test imageattr 1
  expect(video.imageattrs![0]).toEqual({
    pt: 97,
    dir1: 'send',
    attrs1: '[x=1280,y=720]',
    dir2: 'recv',
    attrs2: '[x=1280,y=720] [x=320,y=180] [x=160,y=90]',
  });
  // test imageattr 2
  expect(video.imageattrs![1]).toEqual({
    pt: 98,
    dir1: 'send',
    attrs1: '[x=320,y=180]',
  });
  // test imageattr 3
  expect(video.imageattrs![2]).toEqual({
    pt: 99,
    dir1: 'send',
    attrs1: '[x=160,y=90]',
  });
  // test imageattr 4
  expect(video.imageattrs![3]).toEqual({
    pt: 100,
    dir1: 'recv',
    attrs1: '[x=1280,y=720] [x=320,y=180]',
    dir2: 'send',
    attrs2: '[x=1280,y=720]',
  });
  // test imageattr 5
  expect(video.imageattrs![4]).toEqual({
    pt: '*',
    dir1: 'recv',
    attrs1: '*',
  });

  // test imageattr 1 send params
  const imageattr1SendParams = parseImageAttributes(
    video.imageattrs![0]!.attrs1
  );

  expect(imageattr1SendParams).toEqual([{ x: 1280, y: 720 }]);

  // test imageattr 1 recv params
  const imageattr1RecvParams = parseImageAttributes(
    video.imageattrs![0]!.attrs2
  );

  expect(imageattr1RecvParams).toEqual([
    { x: 1280, y: 720 },
    { x: 320, y: 180 },
    { x: 160, y: 90 },
  ]);

  // test imageattr 2 send params
  const imageattr2SendParams = parseImageAttributes(
    video.imageattrs![1]!.attrs1
  );

  expect(imageattr2SendParams).toEqual([{ x: 320, y: 180 }]);

  // test imageattr 3 send params
  const imageattr3SendParams = parseImageAttributes(
    video.imageattrs![2]!.attrs1
  );

  expect(imageattr3SendParams).toEqual([{ x: 160, y: 90 }]);

  // test imageattr 4 recv params
  const imageattr4RecvParams = parseImageAttributes(
    video.imageattrs![3]!.attrs1
  );

  expect(imageattr4RecvParams).toEqual([
    { x: 1280, y: 720 },
    { x: 320, y: 180 },
  ]);

  // test imageattr 4 send params
  const imageattr4SendParams = parseImageAttributes(
    video.imageattrs![3]!.attrs2
  );

  expect(imageattr4SendParams).toEqual([{ x: 1280, y: 720 }]);

  // test imageattr 5 recv params
  expect(video.imageattrs![4]!.attrs1).toBe('*');

  // test simulcast line
  expect(video.simulcast).toEqual({
    dir1: 'send',
    list1: '1,~4;2;3',
    dir2: 'recv',
    list2: 'c',
  });

  // test simulcast send streams
  const simulcastSendStreams = parseSimulcast(video.simulcast!.list1);

  expect(simulcastSendStreams).toEqual([
    [
      { scid: 1, paused: false },
      { scid: 4, paused: true },
    ],
    [{ scid: 2, paused: false }],
    [{ scid: 3, paused: false }],
  ]);

  // test simulcast recv streams
  const simulcastRecvStreams = parseSimulcast(video.simulcast!.list2);

  expect(simulcastRecvStreams).toEqual([[{ scid: 'c', paused: false }]]);

  // test simulcast version 03 line
  // test simulcast line
  expect(video.simulcast_03).toEqual({
    value: 'send rid=1,4;2;3 paused=4 recv rid=c',
  });
});

test('st2022-6.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/st2022-6.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const video = media[0]!;
  const sourceFilter = video.sourceFilter!;

  expect(sourceFilter.filterMode).toBe('incl');
  expect(sourceFilter.netType).toBe('IN');
  expect(sourceFilter.addressTypes).toBe('IP4');
  expect(sourceFilter.destAddress).toBe('239.0.0.1');
  expect(sourceFilter.srcList).toBe('192.168.20.20');
});

test('st2110-20.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/st2110-20.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(2);

  const video = media[0]!;

  expect(video.type).toBe('video');

  const sourceFilter = video.sourceFilter!;

  expect(sourceFilter.filterMode).toBe('incl');
  expect(sourceFilter.netType).toBe('IN');
  expect(sourceFilter.addressTypes).toBe('IP4');
  expect(sourceFilter.destAddress).toBe('239.100.9.10');
  expect(sourceFilter.srcList).toBe('192.168.100.2');

  const fmtp0Params = parseParams(video.fmtp[0]!.config);

  expect(fmtp0Params).toEqual({
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
  });
});

test('sctp-dtls-26.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/sctp-dtls-26.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  expect(session.origin.sessionId).toBe('5636137646675714991');
  expect(session.groups).toBeTruthy();
  expect(session.groups!.length).toBe(1);
  expect(session.groups![0]!.type).toBe('BUNDLE');
  expect(session.groups![0]!.mids).toBe('data');
  expect(session.msidSemantic).toBeTruthy();
  expect(session.msidSemantic!.semantic).toBe('WMS');

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const app = media[0]!;

  // verify media is data application
  expect(app.type).toBe('application');
  expect(app.mid).toBe('data');

  // verify protocol and ports
  expect(app.protocol).toBe('UDP/DTLS/SCTP');
  expect(app.port).toBe(9);
  expect(app.sctpPort).toBe(5000);

  // verify maxMessageSize
  expect(app.maxMessageSize).toBe(10000);
});

test('extmap-encrypt.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/extmap-encrypt.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  expect(session.origin.username).toBe('-');
  expect(session.origin.sessionId).toBe(20518);
  expect(session.origin.sessionVersion).toBe(0);
  expect(session.origin.netType).toBe('IN');
  expect(session.origin.ipVer).toBe(4);
  expect(session.origin.address).toBe('203.0.113.1');

  expect(session.connection!.ip).toBe('203.0.113.1');
  expect(session.connection!.version).toBe(4);

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const audio = media[0]!;

  expect(audio.type).toBe('audio');
  expect(audio.port).toBe(54400);
  expect(audio.protocol).toBe('RTP/SAVPF');
  expect(audio.rtp[0]!.payload).toBe(96);
  expect(audio.rtp[0]!.codec).toBe('opus');
  expect(audio.rtp[0]!.rate).toBe(48000);

  // extmap and encrypted extmap
  expect(audio.ext![0]).toEqual({
    value: 1,
    direction: 'sendonly',
    uri: 'URI-toffset',
  });
  expect(audio.ext![1]).toEqual({
    value: 2,
    uri: 'urn:ietf:params:rtp-hdrext:toffset',
  });
  expect(audio.ext![2]).toEqual({
    value: 3,
    'encrypt-uri': 'urn:ietf:params:rtp-hdrext:encrypt',
    uri: 'urn:ietf:params:rtp-hdrext:smpte-tc',
    config: '25@600/24',
  });
  expect(audio.ext![3]).toEqual({
    value: 4,
    direction: 'recvonly',
    'encrypt-uri': 'urn:ietf:params:rtp-hdrext:encrypt',
    uri: 'URI-gps-string',
  });
});

test('dante-aes67.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/dante-aes67.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();
  expect(session.origin.username).toBe('-');
  expect(session.origin.sessionId).toBe(1423986);
  expect(session.origin.sessionVersion).toBe(1423994);
  expect(session.origin.netType).toBe('IN');
  expect(session.origin.ipVer).toBe(4);
  expect(session.origin.address).toBe('169.254.98.63');

  expect(session.name).toBe('AOIP44-serial-1614 : 2');
  expect(session.keywords).toBe('Dante');

  expect(session.connection!.ip).toBe('239.65.125.63/32');
  expect(session.connection!.version).toBe(4);

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const audio = media[0]!;

  expect(audio.type).toBe('audio');
  expect(audio.port).toBe(5004);
  expect(audio.protocol).toBe('RTP/AVP');
  expect(audio.direction).toBe('recvonly');
  expect(audio.description).toBe('2 channels: TxChan 0, TxChan 1');
  expect(audio.ptime).toBe(1);
  expect(audio.rtp![0]!.payload).toBe(97);
  expect(audio.rtp![0]!.codec).toBe('L24');
  expect(audio.rtp![0]!.rate).toBe(48000);
  expect(audio.rtp![0]!.encoding).toBe(2);
});

test('bfcp.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/bfcp.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();
  expect(session.origin.username).toBe('-');

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(4);

  const audio = media[0]!;

  expect(audio.type).toBe('audio');

  const video = media[1]!;

  expect(video.type).toBe('video');
  expect(video.direction).toBe('sendrecv');
  expect(video.content).toBe('main');
  expect(video.label).toBe(1);

  const app = media[2]!;

  expect(app.type).toBe('application');
  expect(app.port).toBe(3238);
  expect(app.protocol).toBe('UDP/BFCP');
  expect(app.payloads).toBe('*');
  expect(app.connectionType).toBe('new');
  expect(app.bfcpFloorCtrl).toBe('s-only');
  expect(app.bfcpConfId).toBe(1);
  expect(app.bfcpUserId).toBe(1);
  expect(app.bfcpFloorId!.id).toBe(1);
  expect(app.bfcpFloorId!.mStream).toBe(3);

  const video2 = media[3]!;

  expect(video2.type).toBe('video');
  expect(video2.direction).toBe('sendrecv');
  expect(video2.content).toBe('slides');
  expect(video2.label).toBe(3);
});

test('tcp-active.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/tcp-active.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  expect(session.origin.username).toBe('-');
  expect(session.origin.sessionId).toBe(1562876543);
  expect(session.origin.sessionVersion).toBe(11);
  expect(session.origin.netType).toBe('IN');
  expect(session.origin.ipVer).toBe(4);
  expect(session.origin.address).toBe('192.0.2.3');

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const image = media[0]!;

  expect(image.type).toBe('image');
  expect(image.port).toBe(9);
  expect(image.connection!.version).toBe(4);
  expect(image.connection!.ip).toBe('192.0.2.3');
  expect(image.protocol).toBe('TCP');
  expect(image.payloads).toBe('t38');
  expect(image.setup).toBe('active');
  expect(image.connectionType).toBe('new');
});

test('tcp-passive.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/tcp-passive.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  expect(session.origin.username).toBe('-');
  expect(session.origin.sessionId).toBe(1562876543);
  expect(session.origin.sessionVersion).toBe(11);
  expect(session.origin.netType).toBe('IN');
  expect(session.origin.ipVer).toBe(4);
  expect(session.origin.address).toBe('192.0.2.2');

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const image = media[0]!;

  expect(image.type).toBe('image');
  expect(image.port).toBe(54111);
  expect(image.connection!.version).toBe(4);
  expect(image.connection!.ip).toBe('192.0.2.2');
  expect(image.protocol).toBe('TCP');
  expect(image.payloads).toBe('t38');
  expect(image.setup).toBe('passive');
  expect(image.connectionType).toBe('existing');
});

test('mediaclk-avbtp.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/mediaclk-avbtp.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const audio = media[0]!;

  expect(audio.mediaClk!.mediaClockName).toBe('IEEE1722');
  expect(audio.mediaClk!.mediaClockValue).toBe('38-D6-6D-8E-D2-78-13-2F');
});

test('mediaclk-ptp-v2-w-rate.sdp', () => {
  const sdp = fs.readFileSync(
    __dirname + '/mediaclk-ptp-v2-w-rate.sdp',
    'utf8'
  );
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const audio = media[0]!;

  expect(audio.mediaClk!.mediaClockName).toBe('direct');
  expect(audio.mediaClk!.mediaClockValue).toBe(963214424);
  expect(audio.mediaClk!.rateNumerator).toBe(1000);
  expect(audio.mediaClk!.rateDenominator).toBe(1001);
});

test('mediaclk-ptp-v2.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/mediaclk-ptp-v2.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const audio = media[0]!;

  expect(audio.mediaClk!.mediaClockName).toBe('direct');
  expect(audio.mediaClk!.mediaClockValue).toBe(963214424);
});

test('mediaclk-rtp.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/mediaclk-rtp.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(1);

  const audio = media[0]!;

  expect(audio.mediaClk!.id).toBe('MDA6NjA6MmI6MjA6MTI6MWY=');
  expect(audio.mediaClk!.mediaClockName).toBe('sender');
});

test('ts-refclk-media.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/ts-refclk-media.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const sessTsRefClocks = session.tsRefClocks!;

  expect(sessTsRefClocks.length).toBe(1);
  expect(sessTsRefClocks[0]!.clksrc).toBe('local');
  expect(sessTsRefClocks[0]!.clksrcExt).toBeUndefined();

  const media = session.media;

  expect(media).toBeTruthy();
  expect(media.length).toBe(2);

  const audio = media[0]!;
  const audTsRefClocks = audio.tsRefClocks!;

  expect(audTsRefClocks.length).toBe(2);
  expect(audTsRefClocks[0]!.clksrc).toBe('ntp');
  expect(audTsRefClocks[0]!.clksrcExt).toBe('203.0.113.10');
  expect(audTsRefClocks[1]!.clksrc).toBe('ntp');
  expect(audTsRefClocks[1]!.clksrcExt).toBe('198.51.100.22');

  const video = media[1]!;
  const vidTsRefClocks = video.tsRefClocks!;

  expect(vidTsRefClocks.length).toBe(1);

  expect(vidTsRefClocks[0]!.clksrc).toBe('ptp');
  expect(vidTsRefClocks[0]!.clksrcExt).toBe(
    'IEEE802.1AS-2011:39-A7-94-FF-FE-07-CB-D0'
  );
});

test('ts-refclk-sess.sdp', () => {
  const sdp = fs.readFileSync(__dirname + '/ts-refclk-sess.sdp', 'utf8');
  const session = parse(sdp);

  expect(session).toBeTruthy();

  const sessTsRefClocks = session.tsRefClocks!;

  expect(sessTsRefClocks.length).toBe(1);
  expect(sessTsRefClocks[0]!.clksrc).toBe('ntp');
  expect(sessTsRefClocks[0]!.clksrcExt).toBe('/traceable/');
});
