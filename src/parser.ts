import { grammar } from './grammar';
import type { GrammarAttributeValue } from './grammar';
import type {
  SessionDescription,
  MediaDescription,
  ParamMap,
  RemoteCandidate,
  ImageAttributes,
  SimulcastStream,
} from './types';

const ValidLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);

/**
 * Parses the given unprocessed SDP string.
 *
 * @example
 * ```ts
 * import { parse } from 'sdp-transform';
 *
 * const sdp =
 *   'v=0\r\n' +
 *   'o=- 5541944847614621320 4 IN IP4 127.0.0.1\r\n' +
 *   's=-\r\n' +
 *   't=0 0\r\n' +
 *   'a=extmap-allow-mixed\r\n' +
 *   'a=msid-semantic: WMS 3f732bb4-1828-4829-9b38-1439830ca5cc\r\n' +
 *   'a=group:BUNDLE 0 1 2\r\n' +
 *   'm=application 65210 UDP/DTLS/SCTP webrtc-datachannel\r\n' +
 *   'c=IN IP4 192.168.2.1\r\n' +
 *   'a=setup:actpass\r\n' +
 *   'a=mid:0\r\n' +
 *   'a=ice-ufrag:leNV\r\n' +
 *   'a=ice-pwd:eH+5+saS+d4+uqnT8w4L+Nt3\r\n' +
 *   'a=fingerprint:sha-256 C5:7C:6B:A6:29:2F:4E:10:8A:B6:40:46:25:3E:48:25:E6:F6:5C:72:C9:DC:3A:24:6E:AD:9A:5B:AE:94:70:16\r\n' +
 *   'a=candidate:1949709838 1 udp 2122260223 192.168.2.1 65210 typ host generation 0 network-id 1 network-cost 50\r\n' +
 *   'a=candidate:3186382549 1 udp 2122129151 192.168.1.38 53086 typ host generation 0 network-id 3 network-cost 10\r\n' +
 *   'a=ice-options:trickle\r\n' +
 *   'a=sctp-port:5000\r\n' +
 *   'a=max-message-size:262144\r\n' +
 *   'm=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126\r\n' +
 *   'c=IN IP4 0.0.0.0\r\n' +
 *   'a=rtpmap:111 opus/48000/2\r\n' +
 *   'a=rtpmap:63 red/48000/2\r\n' +
 *   'a=rtpmap:9 G722/8000\r\n' +
 *   'a=rtpmap:0 PCMU/8000\r\n' +
 *   'a=rtpmap:8 PCMA/8000\r\n' +
 *   'a=rtpmap:13 CN/8000\r\n' +
 *   'a=rtpmap:110 telephone-event/48000\r\n' +
 *   'a=rtpmap:126 telephone-event/8000\r\n' +
 *   'a=fmtp:111 minptime=10;useinbandfec=1\r\n' +
 *   'a=fmtp:63 111/111\r\n' +
 *   'a=rtcp:9 IN IP4 0.0.0.0\r\n' +
 *   'a=rtcp-fb:111 transport-cc\r\n' +
 *   'a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\n' +
 *   'a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\n' +
 *   'a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\n' +
 *   'a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\n' +
 *   'a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time\r\n' +
 *   'a=setup:actpass\r\n' +
 *   'a=mid:1\r\n' +
 *   'a=msid:3f732bb4-1828-4829-9b38-1439830ca5cc b14af6a6-a54b-4891-83c1-340afbd594e1\r\n' +
 *   'a=sendonly\r\n' +
 *   'a=ice-ufrag:leNV\r\n' +
 *   'a=ice-pwd:eH+5+saS+d4+uqnT8w4L+Nt3\r\n' +
 *   'a=fingerprint:sha-256 C5:7C:6B:A6:29:2F:4E:10:8A:B6:40:46:25:3E:48:25:E6:F6:5C:72:C9:DC:3A:24:6E:AD:9A:5B:AE:94:70:16\r\n' +
 *   'a=ice-options:trickle\r\n' +
 *   'a=ssrc:1483622301 cname:eqHkwYlYgNpcoS5f\r\n' +
 *   'a=ssrc:1483622301 msid:3f732bb4-1828-4829-9b38-1439830ca5cc b14af6a6-a54b-4891-83c1-340afbd594e1\r\n' +
 *   'a=rtcp-mux\r\n' +
 *   'a=rtcp-rsize\r\n' +
 *   'm=video 9 UDP/TLS/RTP/SAVPF 96 97 103 104 107 108 109 114 115 116 117 118 39 40 98 99 100 101 119 120 123 124 125\r\n' +
 *   'c=IN IP4 0.0.0.0\r\n' +
 *   'a=rtpmap:96 VP8/90000\r\n' +
 *   'a=rtpmap:97 rtx/90000\r\n' +
 *   'a=rtpmap:103 H264/90000\r\n' +
 *   'a=rtpmap:104 rtx/90000\r\n' +
 *   'a=rtpmap:107 H264/90000\r\n' +
 *   'a=rtpmap:108 rtx/90000\r\n' +
 *   'a=rtpmap:109 H264/90000\r\n' +
 *   'a=rtpmap:114 rtx/90000\r\n' +
 *   'a=rtpmap:115 H264/90000\r\n' +
 *   'a=rtpmap:116 rtx/90000\r\n' +
 *   'a=rtpmap:117 H264/90000\r\n' +
 *   'a=rtpmap:118 rtx/90000\r\n' +
 *   'a=rtpmap:39 H264/90000\r\n' +
 *   'a=rtpmap:40 rtx/90000\r\n' +
 *   'a=rtpmap:98 VP9/90000\r\n' +
 *   'a=rtpmap:99 rtx/90000\r\n' +
 *   'a=rtpmap:100 VP9/90000\r\n' +
 *   'a=rtpmap:101 rtx/90000\r\n' +
 *   'a=rtpmap:119 H264/90000\r\n' +
 *   'a=rtpmap:120 rtx/90000\r\n' +
 *   'a=rtpmap:123 red/90000\r\n' +
 *   'a=rtpmap:124 rtx/90000\r\n' +
 *   'a=rtpmap:125 ulpfec/90000\r\n' +
 *   'a=fmtp:97 apt=96\r\n' +
 *   'a=fmtp:103 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\n' +
 *   'a=fmtp:104 apt=103\r\n' +
 *   'a=fmtp:107 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r\n' +
 *   'a=fmtp:108 apt=107\r\n' +
 *   'a=fmtp:109 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\n' +
 *   'a=fmtp:114 apt=109\r\n' +
 *   'a=fmtp:115 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r\n' +
 *   'a=fmtp:116 apt=115\r\n' +
 *   'a=fmtp:117 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f\r\n' +
 *   'a=fmtp:118 apt=117\r\n' +
 *   'a=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f\r\n' +
 *   'a=fmtp:40 apt=39\r\n' +
 *   'a=fmtp:98 profile-id=0\r\n' +
 *   'a=fmtp:99 apt=98\r\n' +
 *   'a=fmtp:100 profile-id=2\r\n' +
 *   'a=fmtp:101 apt=100\r\n' +
 *   'a=fmtp:119 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f\r\n' +
 *   'a=fmtp:120 apt=119\r\n' +
 *   'a=fmtp:124 apt=123\r\n' +
 *   'a=rtcp:9 IN IP4 0.0.0.0\r\n' +
 *   'a=rtcp-fb:96 goog-remb\r\n' +
 *   'a=rtcp-fb:96 transport-cc\r\n' +
 *   'a=rtcp-fb:96 ccm fir\r\n' +
 *   'a=rtcp-fb:96 nack\r\n' +
 *   'a=rtcp-fb:96 nack pli\r\n' +
 *   'a=rtcp-fb:103 goog-remb\r\n' +
 *   'a=rtcp-fb:103 transport-cc\r\n' +
 *   'a=rtcp-fb:103 ccm fir\r\n' +
 *   'a=rtcp-fb:103 nack\r\n' +
 *   'a=rtcp-fb:103 nack pli\r\n' +
 *   'a=rtcp-fb:107 goog-remb\r\n' +
 *   'a=rtcp-fb:107 transport-cc\r\n' +
 *   'a=rtcp-fb:107 ccm fir\r\n' +
 *   'a=rtcp-fb:107 nack\r\n' +
 *   'a=rtcp-fb:107 nack pli\r\n' +
 *   'a=rtcp-fb:109 goog-remb\r\n' +
 *   'a=rtcp-fb:109 transport-cc\r\n' +
 *   'a=rtcp-fb:109 ccm fir\r\n' +
 *   'a=rtcp-fb:109 nack\r\n' +
 *   'a=rtcp-fb:109 nack pli\r\n' +
 *   'a=rtcp-fb:115 goog-remb\r\n' +
 *   'a=rtcp-fb:115 transport-cc\r\n' +
 *   'a=rtcp-fb:115 ccm fir\r\n' +
 *   'a=rtcp-fb:115 nack\r\n' +
 *   'a=rtcp-fb:115 nack pli\r\n' +
 *   'a=rtcp-fb:117 goog-remb\r\n' +
 *   'a=rtcp-fb:117 transport-cc\r\n' +
 *   'a=rtcp-fb:117 ccm fir\r\n' +
 *   'a=rtcp-fb:117 nack\r\n' +
 *   'a=rtcp-fb:117 nack pli\r\n' +
 *   'a=rtcp-fb:39 goog-remb\r\n' +
 *   'a=rtcp-fb:39 transport-cc\r\n' +
 *   'a=rtcp-fb:39 ccm fir\r\n' +
 *   'a=rtcp-fb:39 nack\r\n' +
 *   'a=rtcp-fb:39 nack pli\r\n' +
 *   'a=rtcp-fb:98 goog-remb\r\n' +
 *   'a=rtcp-fb:98 transport-cc\r\n' +
 *   'a=rtcp-fb:98 ccm fir\r\n' +
 *   'a=rtcp-fb:98 nack\r\n' +
 *   'a=rtcp-fb:98 nack pli\r\n' +
 *   'a=rtcp-fb:100 goog-remb\r\n' +
 *   'a=rtcp-fb:100 transport-cc\r\n' +
 *   'a=rtcp-fb:100 ccm fir\r\n' +
 *   'a=rtcp-fb:100 nack\r\n' +
 *   'a=rtcp-fb:100 nack pli\r\n' +
 *   'a=rtcp-fb:119 goog-remb\r\n' +
 *   'a=rtcp-fb:119 transport-cc\r\n' +
 *   'a=rtcp-fb:119 ccm fir\r\n' +
 *   'a=rtcp-fb:119 nack\r\n' +
 *   'a=rtcp-fb:119 nack pli\r\n' +
 *   'a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r\n' +
 *   'a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\n' +
 *   'a=extmap:13 urn:3gpp:video-orientation\r\n' +
 *   'a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\n' +
 *   'a=extmap:12 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\n' +
 *   'a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\n' +
 *   'a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\n' +
 *   'a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r\n' +
 *   'a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\n' +
 *   'a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\n' +
 *   'a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\n' +
 *   'a=extmap:16 http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00\r\n' +
 *   'a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time\r\n' +
 *   'a=setup:actpass\r\n' +
 *   'a=mid:2\r\n' +
 *   'a=msid:3f732bb4-1828-4829-9b38-1439830ca5cc 3ababdbb-d1e6-49e3-880f-d860d8bf9d76\r\n' +
 *   'a=sendonly\r\n' +
 *   'a=ice-ufrag:leNV\r\n' +
 *   'a=ice-pwd:eH+5+saS+d4+uqnT8w4L+Nt3\r\n' +
 *   'a=fingerprint:sha-256 C5:7C:6B:A6:29:2F:4E:10:8A:B6:40:46:25:3E:48:25:E6:F6:5C:72:C9:DC:3A:24:6E:AD:9A:5B:AE:94:70:16\r\n' +
 *   'a=ice-options:trickle\r\n' +
 *   'a=rtcp-mux\r\n' +
 *   'a=rtcp-rsize\r\n' +
 *   'a=rid:r0 send\r\n' +
 *   'a=rid:r1 send\r\n' +
 *   'a=rid:r2 send\r\n' +
 *   'a=simulcast:send r0;r1;r2\r\n'
 *
 * const session = parse(sdp);
 * // =>
 * {
 *   version: 0,
 *   origin: {
 *     username: '-',
 *     sessionId: '5541944847614621320',
 *     sessionVersion: 4,
 *     netType: 'IN',
 *     ipVer: 4,
 *     address: '127.0.0.1'
 *   },
 *   name: '-',
 *   timing: {
 *     start: 0,
 *     stop: 0
 *   },
 *   extmapAllowMixed: 'extmap-allow-mixed',
 *   msidSemantic: {
 *     semantic: 'WMS',
 *     token: '3f732bb4-1828-4829-9b38-1439830ca5cc'
 *   },
 *   groups: [
 *     {
 *       type: 'BUNDLE',
 *       mids: '0 1 2'
 *     }
 *   ],
 *   media: [
 *     {
 *       rtp: [],
 *       fmtp: [],
 *       type: 'application',
 *       port: 65210,
 *       protocol: 'UDP/DTLS/SCTP',
 *       payloads: 'webrtc-datachannel',
 *       connection: {
 *         version: 4,
 *         ip: '192.168.2.1'
 *       },
 *       setup: 'actpass',
 *       mid: 0,
 *       iceUfrag: 'leNV',
 *       icePwd: 'eH+5+saS+d4+uqnT8w4L+Nt3',
 *       fingerprint: {
 *         type: 'sha-256',
 *         hash: 'C5:7C:6B:A6:29:2F:4E:10:8A:B6:40:46:25:3E:48:25:E6:F6:5C:72:C9:DC:3A:24:6E:AD:9A:5B:AE:94:70:16'
 *       },
 *       candidates: [
 *         {
 *           foundation: 1949709838,
 *           component: 1,
 *           transport: 'udp',
 *           priority: 2122260223,
 *           ip: '192.168.2.1',
 *           port: 65210,
 *           type: 'host',
 *           generation: 0,
 *           'network-id': 1,
 *           'network-cost': 50
 *         },
 *         {
 *           foundation: 3186382549,
 *           component: 1,
 *           transport: 'udp',
 *           priority: 2122129151,
 *           ip: '192.168.1.38',
 *           port: 53086,
 *           type: 'host',
 *           generation: 0,
 *           'network-id': 3,
 *           'network-cost': 10
 *         }
 *       ],
 *       iceOptions: 'trickle',
 *       sctpPort: 5000,
 *       maxMessageSize: 262144
 *     },
 *     {
 *       rtp: [
 *         {
 *           payload: 111,
 *           codec: 'opus',
 *           rate: 48000,
 *           encoding: 2
 *         },
 *         {
 *           payload: 63,
 *           codec: 'red',
 *           rate: 48000,
 *           encoding: 2
 *         },
 *         {
 *           payload: 9,
 *           codec: 'G722',
 *           rate: 8000
 *         },
 *         {
 *           payload: 0,
 *           codec: 'PCMU',
 *           rate: 8000
 *         },
 *         {
 *           payload: 8,
 *           codec: 'PCMA',
 *           rate: 8000
 *         },
 *         {
 *           payload: 13,
 *           codec: 'CN',
 *           rate: 8000
 *         },
 *         {
 *           payload: 110,
 *           codec: 'telephone-event',
 *           rate: 48000
 *         },
 *         {
 *           payload: 126,
 *           codec: 'telephone-event',
 *           rate: 8000
 *         }
 *       ],
 *       fmtp: [
 *         {
 *           payload: 111,
 *           config: 'minptime=10;useinbandfec=1'
 *         },
 *         {
 *           payload: 63,
 *           config: '111/111'
 *         }
 *       ],
 *       type: 'audio',
 *       port: 9,
 *       protocol: 'UDP/TLS/RTP/SAVPF',
 *       payloads: '111 63 9 0 8 13 110 126',
 *       connection: {
 *         version: 4,
 *         ip: '0.0.0.0'
 *       },
 *       rtcp: {
 *         port: 9,
 *         netType: 'IN',
 *         ipVer: 4,
 *         address: '0.0.0.0'
 *       },
 *       rtcpFb: [
 *         {
 *           payload: 111,
 *           type: 'transport-cc'
 *         }
 *       ],
 *       ext: [
 *         {
 *           value: 1,
 *           uri: 'urn:ietf:params:rtp-hdrext:ssrc-audio-level'
 *         },
 *         {
 *           value: 2,
 *           uri: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time'
 *         },
 *         {
 *           value: 3,
 *           uri: 'http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01'
 *         },
 *         {
 *           value: 4,
 *           uri: 'urn:ietf:params:rtp-hdrext:sdes:mid'
 *         },
 *         {
 *           value: 5,
 *           uri: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time'
 *         }
 *       ],
 *       setup: 'actpass',
 *       mid: 1,
 *       msid: [
 *         {
 *           id: '3f732bb4-1828-4829-9b38-1439830ca5cc',
 *           appdata: 'b14af6a6-a54b-4891-83c1-340afbd594e1'
 *         }
 *       ],
 *       direction: 'sendonly',
 *       iceUfrag: 'leNV',
 *       icePwd: 'eH+5+saS+d4+uqnT8w4L+Nt3',
 *       fingerprint: {
 *         type: 'sha-256',
 *         hash: 'C5:7C:6B:A6:29:2F:4E:10:8A:B6:40:46:25:3E:48:25:E6:F6:5C:72:C9:DC:3A:24:6E:AD:9A:5B:AE:94:70:16'
 *       },
 *       iceOptions: 'trickle',
 *       ssrcs: [
 *         {
 *           id: 1483622301,
 *           attribute: 'cname',
 *           value: 'eqHkwYlYgNpcoS5f'
 *         },
 *         {
 *           id: 1483622301,
 *           attribute: 'msid',
 *           value: '3f732bb4-1828-4829-9b38-1439830ca5cc b14af6a6-a54b-4891-83c1-340afbd594e1'
 *         }
 *       ],
 *       rtcpMux: 'rtcp-mux',
 *       rtcpRsize: 'rtcp-rsize'
 *     },
 *     {
 *       rtp: [
 *         {
 *           payload: 96,
 *           codec: 'VP8',
 *           rate: 90000
 *         },
 *         {
 *           payload: 97,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 103,
 *           codec: 'H264',
 *           rate: 90000
 *         },
 *         {
 *           payload: 104,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 107,
 *           codec: 'H264',
 *           rate: 90000
 *         },
 *         {
 *           payload: 108,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 109,
 *           codec: 'H264',
 *           rate: 90000
 *         },
 *         {
 *           payload: 114,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 115,
 *           codec: 'H264',
 *           rate: 90000
 *         },
 *         {
 *           payload: 116,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 117,
 *           codec: 'H264',
 *           rate: 90000
 *         },
 *         {
 *           payload: 118,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 39,
 *           codec: 'H264',
 *           rate: 90000
 *         },
 *         {
 *           payload: 40,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 98,
 *           codec: 'VP9',
 *           rate: 90000
 *         },
 *         {
 *           payload: 99,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 100,
 *           codec: 'VP9',
 *           rate: 90000
 *         },
 *         {
 *           payload: 101,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 119,
 *           codec: 'H264',
 *           rate: 90000
 *         },
 *         {
 *           payload: 120,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 123,
 *           codec: 'red',
 *           rate: 90000
 *         },
 *         {
 *           payload: 124,
 *           codec: 'rtx',
 *           rate: 90000
 *         },
 *         {
 *           payload: 125,
 *           codec: 'ulpfec',
 *           rate: 90000
 *         }
 *       ],
 *       fmtp: [
 *         {
 *           payload: 97,
 *           config: 'apt=96'
 *         },
 *         {
 *           payload: 103,
 *           config: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f'
 *         },
 *         {
 *           payload: 104,
 *           config: 'apt=103'
 *         },
 *         {
 *           payload: 107,
 *           config: 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f'
 *         },
 *         {
 *           payload: 108,
 *           config: 'apt=107'
 *         },
 *         {
 *           payload: 109,
 *           config: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f'
 *         },
 *         {
 *           payload: 114,
 *           config: 'apt=109'
 *         },
 *         {
 *           payload: 115,
 *           config: 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f'
 *         },
 *         {
 *           payload: 116,
 *           config: 'apt=115'
 *         },
 *         {
 *           payload: 117,
 *           config: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f'
 *         },
 *         {
 *           payload: 118,
 *           config: 'apt=117'
 *         },
 *         {
 *           payload: 39,
 *           config: 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f'
 *         },
 *         {
 *           payload: 40,
 *           config: 'apt=39'
 *         },
 *         {
 *           payload: 98,
 *           config: 'profile-id=0'
 *         },
 *         {
 *           payload: 99,
 *           config: 'apt=98'
 *         },
 *         {
 *           payload: 100,
 *           config: 'profile-id=2'
 *         },
 *         {
 *           payload: 101,
 *           config: 'apt=100'
 *         },
 *         {
 *           payload: 119,
 *           config: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f'
 *         },
 *         {
 *           payload: 120,
 *           config: 'apt=119'
 *         },
 *         {
 *           payload: 124,
 *           config: 'apt=123'
 *         }
 *       ],
 *       type: 'video',
 *       port: 9,
 *       protocol: 'UDP/TLS/RTP/SAVPF',
 *       payloads: '96 97 103 104 107 108 109 114 115 116 117 118 39 40 98 99 100 101 119 120 123 124 125',
 *       connection: {
 *         version: 4,
 *         ip: '0.0.0.0'
 *       },
 *       rtcp: {
 *         port: 9,
 *         netType: 'IN',
 *         ipVer: 4,
 *         address: '0.0.0.0'
 *       },
 *       rtcpFb: [
 *         {
 *           payload: 96,
 *           type: 'goog-remb'
 *         },
 *         {
 *           payload: 96,
 *           type: 'transport-cc'
 *         },
 *         {
 *           payload: 96,
 *           type: 'ccm',
 *           subtype: 'fir'
 *         },
 *         {
 *           payload: 96,
 *           type: 'nack'
 *         },
 *         {
 *           payload: 96,
 *           type: 'nack',
 *           subtype: 'pli'
 *         },
 *         {
 *           payload: 103,
 *           type: 'goog-remb'
 *         },
 *         {
 *           payload: 103,
 *           type: 'transport-cc'
 *         },
 *         {
 *           payload: 103,
 *           type: 'ccm',
 *           subtype: 'fir'
 *         },
 *         {
 *           payload: 103,
 *           type: 'nack'
 *         },
 *         {
 *           payload: 103,
 *           type: 'nack',
 *           subtype: 'pli'
 *         },
 *         {
 *           payload: 107,
 *           type: 'goog-remb'
 *         },
 *         {
 *           payload: 107,
 *           type: 'transport-cc'
 *         },
 *         {
 *           payload: 107,
 *           type: 'ccm',
 *           subtype: 'fir'
 *         },
 *         {
 *           payload: 107,
 *           type: 'nack'
 *         },
 *         {
 *           payload: 107,
 *           type: 'nack',
 *           subtype: 'pli'
 *         },
 *         {
 *           payload: 109,
 *           type: 'goog-remb'
 *         },
 *         {
 *           payload: 109,
 *           type: 'transport-cc'
 *         },
 *         {
 *           payload: 109,
 *           type: 'ccm',
 *           subtype: 'fir'
 *         },
 *         {
 *           payload: 109,
 *           type: 'nack'
 *         },
 *         {
 *           payload: 109,
 *           type: 'nack',
 *           subtype: 'pli'
 *         },
 *         {
 *           payload: 115,
 *           type: 'goog-remb'
 *         },
 *         {
 *           payload: 115,
 *           type: 'transport-cc'
 *         },
 *         {
 *           payload: 115,
 *           type: 'ccm',
 *           subtype: 'fir'
 *         },
 *         {
 *           payload: 115,
 *           type: 'nack'
 *         },
 *         {
 *           payload: 115,
 *           type: 'nack',
 *           subtype: 'pli'
 *         },
 *         {
 *           payload: 117,
 *           type: 'goog-remb'
 *         },
 *         {
 *           payload: 117,
 *           type: 'transport-cc'
 *         },
 *         {
 *           payload: 117,
 *           type: 'ccm',
 *           subtype: 'fir'
 *         },
 *         {
 *           payload: 117,
 *           type: 'nack'
 *         },
 *         {
 *           payload: 117,
 *           type: 'nack',
 *           subtype: 'pli'
 *         },
 *         {
 *           payload: 39,
 *           type: 'goog-remb'
 *         },
 *         {
 *           payload: 39,
 *           type: 'transport-cc'
 *         },
 *         {
 *           payload: 39,
 *           type: 'ccm',
 *           subtype: 'fir'
 *         },
 *         {
 *           payload: 39,
 *           type: 'nack'
 *         },
 *         {
 *           payload: 39,
 *           type: 'nack',
 *           subtype: 'pli'
 *         },
 *         {
 *           payload: 98,
 *           type: 'goog-remb'
 *         },
 *         {
 *           payload: 98,
 *           type: 'transport-cc'
 *         },
 *         {
 *           payload: 98,
 *           type: 'ccm',
 *           subtype: 'fir'
 *         },
 *         {
 *           payload: 98,
 *           type: 'nack'
 *         },
 *         {
 *           payload: 98,
 *           type: 'nack',
 *           subtype: 'pli'
 *         },
 *         {
 *           payload: 100,
 *           type: 'goog-remb'
 *         },
 *         {
 *           payload: 100,
 *           type: 'transport-cc'
 *         },
 *         {
 *           payload: 100,
 *           type: 'ccm',
 *           subtype: 'fir'
 *         },
 *         {
 *           payload: 100,
 *           type: 'nack'
 *         },
 *         {
 *           payload: 100,
 *           type: 'nack',
 *           subtype: 'pli'
 *         },
 *         {
 *           payload: 119,
 *           type: 'goog-remb'
 *         },
 *         {
 *           payload: 119,
 *           type: 'transport-cc'
 *         },
 *         {
 *           payload: 119,
 *           type: 'ccm',
 *           subtype: 'fir'
 *         },
 *         {
 *           payload: 119,
 *           type: 'nack'
 *         },
 *         {
 *           payload: 119,
 *           type: 'nack',
 *           subtype: 'pli'
 *         }
 *       ],
 *       ext: [
 *         {
 *           value: 14,
 *           uri: 'urn:ietf:params:rtp-hdrext:toffset'
 *         },
 *         {
 *           value: 2,
 *           uri: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time'
 *         },
 *         {
 *           value: 13,
 *           uri: 'urn:3gpp:video-orientation'
 *         },
 *         {
 *           value: 3,
 *           uri: 'http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01'
 *         },
 *         {
 *           value: 12,
 *           uri: 'http://www.webrtc.org/experiments/rtp-hdrext/playout-delay'
 *         },
 *         {
 *           value: 6,
 *           uri: 'http://www.webrtc.org/experiments/rtp-hdrext/video-content-type'
 *         },
 *         {
 *           value: 7,
 *           uri: 'http://www.webrtc.org/experiments/rtp-hdrext/video-timing'
 *         },
 *         {
 *           value: 8,
 *           uri: 'http://www.webrtc.org/experiments/rtp-hdrext/color-space'
 *         },
 *         {
 *           value: 4,
 *           uri: 'urn:ietf:params:rtp-hdrext:sdes:mid'
 *         },
 *         {
 *           value: 10,
 *           uri: 'urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id'
 *         },
 *         {
 *           value: 11,
 *           uri: 'urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id'
 *         },
 *         {
 *           value: 16,
 *           uri: 'http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00'
 *         },
 *         {
 *           value: 5,
 *           uri: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time'
 *         }
 *       ],
 *       setup: 'actpass',
 *       mid: 2,
 *       msid: [
 *         {
 *           id: '3f732bb4-1828-4829-9b38-1439830ca5cc',
 *           appdata: '3ababdbb-d1e6-49e3-880f-d860d8bf9d76'
 *         }
 *       ],
 *       direction: 'sendonly',
 *       iceUfrag: 'leNV',
 *       icePwd: 'eH+5+saS+d4+uqnT8w4L+Nt3',
 *       fingerprint: {
 *         type: 'sha-256',
 *         hash: 'C5:7C:6B:A6:29:2F:4E:10:8A:B6:40:46:25:3E:48:25:E6:F6:5C:72:C9:DC:3A:24:6E:AD:9A:5B:AE:94:70:16'
 *       },
 *       iceOptions: 'trickle',
 *       rtcpMux: 'rtcp-mux',
 *       rtcpRsize: 'rtcp-rsize',
 *       rids: [
 *         {
 *           id: 'r0',
 *           direction: 'send'
 *         },
 *         {
 *           id: 'r1',
 *           direction: 'send'
 *         },
 *         {
 *           id: 'r2',
 *           direction: 'send'
 *         }
 *       ],
 *       simulcast: {
 *         dir1: 'send',
 *         list1: 'r0;r1;r2'
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * In this example, only slightly dodgy string coercion case here is for
 * {@link MediaAttributes.candidates candidates[i].foundation}, which can be
 * a string, but in this case can be equally parsed as an integer.
 *
 * No excess parsing is done to the raw strings apart from maybe coercing to
 * integers, because the {@link write write()} function is built to be the
 * inverse of `parse()`. That said, a few helpers have been built in:
 *
 * - {@link parseParams parseParams()}
 * - {@link parsePayloads parsePayloads()}
 * - {@link parseSimulcast parseSimulcast()}
 * - {@link parseImageAttributes parseImageAttributes()}
 * - {@link parseRemoteCandidates parseRemoteCandidates()}
 */
export function parse(sdp: string): SessionDescription {
  const session: SessionDescription = {} as SessionDescription;
  const media: MediaDescription[] = [];

  // points at where properties go under (one of the above)
  let location: SessionDescription | MediaDescription = session;

  // parse lines we understand
  sdp
    .split(/(\r\n|\r|\n)/)
    .filter(ValidLine)
    .forEach(function (l) {
      const type = l[0]!;
      const content = l.slice(2);

      if (type === 'm') {
        media.push({ rtp: [], fmtp: [] } as unknown as MediaDescription);
        // point at latest media line
        location = media[media.length - 1]!;
      }

      for (let j = 0; j < (grammar[type] ?? []).length; j++) {
        const obj = grammar[type]![j]!;

        if (obj.reg.test(content)) {
          return parseReg(obj, location, content);
        }
      }
    });

  // link it up
  session.media = media;

  return session;
}

/**
 * Parses {@link MediaAttributes.fmtp fmtp.config} and others such as
 * {@link MediaAttributes.rids rid.params} and returns an object with all the
 * params in a key/value fashion.
 *
 * @example
 * ```ts
 * import { parseParams } from 'sdp-transform';
 *
 * parseParams(res.media[1].fmtp[0].config);
 * // =>
 * {
 *   'profile-level-id': '4d0028',
 *   'packetization-mode': 1
 * }
 * ```
 */
export function parseParams(str?: string): ParamMap {
  if (!str) {
    return {};
  }

  return str.split(/;\s?/).reduce(paramReducer, {});
}

/**
 * Returns an array with all the payload advertised in the main
 * {@link SessionDescription.media m-line}.
 *
 * @example
 * ```ts
 * import { parsePayloads } from 'sdp-transform';
 *
 * parsePayloads(res.media[1].payloads);
 * // =>
 * [97, 98]
 * ```
 */
export function parsePayloads(str?: string): number[] {
  if (!str) {
    return [];
  }

  return str.toString().split(' ').map(Number);
}

/**
 * Parses [simulcast](https://datatracker.ietf.org/doc/rfc8853/) streams/formats.
 * Must be provided with the `list1` or `list2` string of the
 * {@link MediaAttributes.simulcast media.simulcast} field.
 *
 * Returns an array of simulcast streams. Each entry is an array of alternative
 * simulcast formats.
 *
 * @example
 * ```ts
 * import { parseSimulcast } from 'sdp-transform';
 *
 * // a=simulcast:send 1,~4;2;3 recv c
 *
 * parseSimulcastStreamList(res.media[1].simulcast.list1);
 * // =>
 * [
 *   // First simulcast stream (two alternative formats).
 *   [{ scid: 1, paused: false }, { scid: 4, paused: true }],
 *   // Second simulcast stream.
 *   [{ scid: 2, paused: false }],
 *   // Third simulcast stream.
 *   [{ scid: 3, paused: false }]
 * ]
 * ```
 */
export function parseSimulcast(str?: string): SimulcastStream[] {
  if (!str) {
    return [];
  }

  return str.split(';').map(function (stream) {
    return stream.split(',').map(function (format) {
      let scid: number | string;
      let paused: boolean = false;

      if (!format.startsWith('~')) {
        scid = toIntIfInt(format);
      } else {
        scid = toIntIfInt(format.substring(1, format.length));
        paused = true;
      }

      return {
        scid: scid,
        paused: paused,
      };
    });
  });
}

/**
 * Parses [Generic Image Attributes](https://tools.ietf.org/html/rfc6236). Must
 * be provided with the `attrs1` or `attrs2` string of a
 * {@link MediaAttributes.imageattrs media.imageattrs} entry.
 *
 * @example
 * ```ts
 * import { parseImageAttributes } from 'sdp-transform';
 *
 * // a=imageattr:97 send [x=1280,y=720] recv [x=1280,y=720] [x=320,y=180]
 *
 * parseImageAttributes(res.media[1].imageattrs[0].attrs2);
 * // =>
 * [{ x: 1280, y: 720 }, { x: 320, y: 180 }]
 * ```
 */
export function parseImageAttributes(str?: string): ImageAttributes[] {
  if (!str) {
    return [];
  }

  return str.split(' ').map(function (item) {
    return item
      .substring(1, item.length - 1)
      .split(',')
      .reduce(
        paramReducer<{
          component: number;
          ip: string;
          port: number;
        }>,
        {}
      );
  });
}

/**
 * Parses {@link MediaAttributes.remoteCandidates media.remoteCandidates}
 * field.
 */
export function parseRemoteCandidates(str?: string): RemoteCandidate[] {
  if (!str) {
    return [];
  }

  const remoteCandidates: RemoteCandidate[] = [];
  const parts = str.split(' ').map(toIntIfInt);

  for (let i = 0; i < parts.length; i += 3) {
    remoteCandidates.push({
      component: Number(parts[i]),
      ip: String(parts[i + 1]),
      port: Number(parts[i + 2]),
    });
  }

  return remoteCandidates;
}

function paramReducer<T extends ParamMap = ParamMap>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  acc: any,
  expr: string
): T {
  const s = expr.split(/=(.+)/, 2);

  if (s.length === 2) {
    acc[s[0]!] = toIntIfInt(s[1]!);
  } else if (s.length === 1 && expr.length > 1) {
    acc[s[0]!] = undefined;
  }

  return acc as T;
}

function toIntIfInt(v: number | string): number | string {
  return String(Number(v)) === v ? Number(v) : v;
}

function attachProperties(
  match: RegExpMatchArray,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  location: any,
  names?: string[],
  rawName?: string
): void {
  if (rawName && !names) {
    location[rawName] = toIntIfInt(match[1]!);
  } else if (names) {
    for (let i = 0; i < names.length; i++) {
      if (match[i + 1] != null) {
        location[names[i]!] = toIntIfInt(match[i + 1]!);
      }
    }
  }
}

function parseReg(
  obj: GrammarAttributeValue,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  location: any,
  content: string
): void {
  const needsBlank = obj.name && obj.names;

  if (obj.push && !location[obj.push]) {
    location[obj.push] = [];
  } else if (needsBlank && !location[obj.name!]) {
    location[obj.name!] = {};
  }

  const keyLocation = obj.push
    ? {} // blank object that will be pushed
    : needsBlank
      ? location[obj.name!]
      : location; // otherwise, named location or root

  attachProperties(content.match(obj.reg)!, keyLocation, obj.names, obj.name);

  if (obj.push) {
    location[obj.push].push(keyLocation);
  }
}
