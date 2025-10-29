/**
 * Type definition of the supported SDP grammar.
 */
export type Grammar = {
  [key: string]: {
    name?: string;
    push?: string;
    reg: RegExp;
    names?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    format: string | ((o: any) => string);
  }[];
};

export type GrammarAttributeValue = Grammar[keyof Grammar][number];

/**
 * Definition of the supported SDP grammar.
 *
 * In case you need to add custom grammar (e.g. add unofficial attributes) to
 * the parser, you can do so by mutating the `grammar` object before parsing.
 *
 * @example
 * ```ts
 * import { grammar } from 'sdp-transform';
 *
 * grammar['a']!.push({
 *   name: 'xCustomTag',
 *   reg: /^x-custom-tag:(\d*)/,
 *   names: ['tagId'],
 *   format: 'x-custom-tag:%d
 * })
 * ```
 */
export const grammar: Grammar = {
  v: [
    {
      name: 'version',
      reg: /^(\d*)$/,
      format: '%s',
    },
  ],
  o: [
    {
      // o=- 20518 0 IN IP4 203.0.113.1
      // NB: sessionId will be a String in most cases because it is huge
      name: 'origin',
      reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
      names: [
        'username',
        'sessionId',
        'sessionVersion',
        'netType',
        'ipVer',
        'address',
      ],
      format: '%s %s %d %s IP%d %s',
    },
  ],
  // default parsing of these only (though some of these feel outdated)
  s: [{ name: 'name', reg: /(.*)/, format: '%s' }],
  i: [{ name: 'description', reg: /(.*)/, format: '%s' }],
  u: [{ name: 'uri', reg: /(.*)/, format: '%s' }],
  e: [{ name: 'email', reg: /(.*)/, format: '%s' }],
  p: [{ name: 'phone', reg: /(.*)/, format: '%s' }],
  // TODO: this one can actually be parsed properly...
  z: [{ name: 'timezones', reg: /(.*)/, format: '%s' }],
  // TODO: this one can also be parsed properly
  r: [{ name: 'repeats', reg: /(.*)/, format: '%s' }],
  // k: [{}], // outdated thing ignored
  t: [
    {
      // t=0 0
      name: 'timing',
      reg: /^(\d*) (\d*)/,
      names: ['start', 'stop'],
      format: '%d %d',
    },
  ],
  c: [
    {
      // c=IN IP4 10.47.197.26
      name: 'connection',
      reg: /^IN IP(\d) (\S*)/,
      names: ['version', 'ip'],
      format: 'IN IP%d %s',
    },
  ],
  b: [
    {
      // b=AS:4000
      push: 'bandwidth',
      reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
      names: ['type', 'limit'],
      format: '%s:%s',
    },
  ],
  m: [
    {
      // m=video 51744 RTP/AVP 126 97 98 34 31
      // NB: special - pushes to session
      // TODO: rtp/fmtp should be filtered by the payloads found here?
      reg: /^(\w*) (\d*) ([\w/]*)(?: (.*))?/,
      names: ['type', 'port', 'protocol', 'payloads'],
      format: '%s %d %s %s',
    },
  ],
  a: [
    {
      // a=rtpmap:110 opus/48000/2
      push: 'rtp',
      reg: /^rtpmap:(\d*) ([\w\-.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,
      names: ['payload', 'codec', 'rate', 'encoding'],
      format: function (o: {
        payload: number;
        codec: string;
        rate?: number;
        encoding?: string;
      }) {
        return o.encoding != null
          ? 'rtpmap:%d %s/%s/%s'
          : o.rate != null
            ? 'rtpmap:%d %s/%s'
            : 'rtpmap:%d %s';
      },
    },
    {
      // a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
      // a=fmtp:111 minptime=10; useinbandfec=1
      push: 'fmtp',
      reg: /^fmtp:(\d*) ([\S| ]*)/,
      names: ['payload', 'config'],
      format: 'fmtp:%d %s',
    },
    {
      // a=control:streamid=0
      name: 'control',
      reg: /^control:(.*)/,
      format: 'control:%s',
    },
    {
      // a=rtcp:65179 IN IP4 193.84.77.194
      name: 'rtcp',
      reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
      names: ['port', 'netType', 'ipVer', 'address'],
      format: function (o: {
        port: number;
        netType: string;
        ipVer: number;
        address?: string;
      }) {
        return o.address != null ? 'rtcp:%d %s IP%d %s' : 'rtcp:%d';
      },
    },
    {
      // a=rtcp-fb:98 trr-int 100
      push: 'rtcpFbTrrInt',
      reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
      names: ['payload', 'value'],
      format: 'rtcp-fb:%s trr-int %d',
    },
    {
      // a=rtcp-fb:98 nack rpsi
      push: 'rtcpFb',
      reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
      names: ['payload', 'type', 'subtype'],
      format: function (o: {
        payload: number | '*';
        type: string;
        subtype?: string;
      }) {
        return o.subtype != null ? 'rtcp-fb:%s %s %s' : 'rtcp-fb:%s %s';
      },
    },
    {
      // a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
      // a=extmap:1/recvonly URI-gps-string
      // a=extmap:3 urn:ietf:params:rtp-hdrext:encrypt urn:ietf:params:rtp-hdrext:smpte-tc 25@600/24
      push: 'ext',
      reg: /^extmap:(\d+)(?:\/(\w+))?(?: (urn:ietf:params:rtp-hdrext:encrypt))? (\S*)(?: (\S*))?/,
      names: ['value', 'direction', 'encrypt-uri', 'uri', 'config'],
      format: function (o: {
        value: number;
        direction?: string;
        'encrypt-uri': number;
        uri?: string;
        config?: string;
      }) {
        return (
          'extmap:%d' +
          (o.direction != null ? '/%s' : '%v') +
          (o['encrypt-uri'] ? ' %s' : '%v') +
          ' %s' +
          (o.config != null ? ' %s' : '')
        );
      },
    },
    {
      // a=extmap-allow-mixed
      name: 'extmapAllowMixed',
      reg: /^(extmap-allow-mixed)/,
      format: '%s',
    },
    {
      // a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
      push: 'crypto',
      reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
      names: ['id', 'suite', 'config', 'sessionConfig'],
      format: function (o: {
        id: number | '*';
        suite: string;
        config: string;
        sessionConfig?: string;
      }) {
        return o.sessionConfig != null
          ? 'crypto:%d %s %s %s'
          : 'crypto:%d %s %s';
      },
    },
    {
      // a=setup:actpass
      name: 'setup',
      reg: /^setup:(\w*)/,
      format: 'setup:%s',
    },
    {
      // a=connection:new
      name: 'connectionType',
      reg: /^connection:(new|existing)/,
      format: 'connection:%s',
    },
    {
      // a=mid:1
      name: 'mid',
      reg: /^mid:([^\s]*)/,
      format: 'mid:%s',
    },
    {
      // a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
      push: 'msid',
      reg: /^msid:([\w-]+)(?: ([\w-]+))?/,
      names: ['id', 'appdata'],
      format: 'msid:%s %s',
    },
    {
      // a=ptime:20
      name: 'ptime',
      reg: /^ptime:(\d*(?:\.\d*)*)/,
      format: 'ptime:%d',
    },
    {
      // a=maxptime:60
      name: 'maxptime',
      reg: /^maxptime:(\d*(?:\.\d*)*)/,
      format: 'maxptime:%d',
    },
    {
      // a=sendrecv
      name: 'direction',
      reg: /^(sendrecv|recvonly|sendonly|inactive)/,
      format: '%s',
    },
    {
      // a=ice-lite
      name: 'icelite',
      reg: /^(ice-lite)/,
      format: '%s',
    },
    {
      // a=ice-ufrag:F7gI
      name: 'iceUfrag',
      reg: /^ice-ufrag:(\S*)/,
      format: 'ice-ufrag:%s',
    },
    {
      // a=ice-pwd:x9cml/YzichV2+XlhiMu8g
      name: 'icePwd',
      reg: /^ice-pwd:(\S*)/,
      format: 'ice-pwd:%s',
    },
    {
      // a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
      name: 'fingerprint',
      reg: /^fingerprint:(\S*) (\S*)/,
      names: ['type', 'hash'],
      format: 'fingerprint:%s %s',
    },
    {
      // a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
      // a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0 network-id 3 network-cost 10
      // a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0 network-id 3 network-cost 10
      // a=candidate:229815620 1 tcp 1518280447 192.168.150.19 60017 typ host tcptype active generation 0 network-id 3 network-cost 10
      // a=candidate:3289912957 2 tcp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 tcptype passive generation 0 network-id 3 network-cost 10
      push: 'candidates',
      reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?(?: network-id (\d*))?(?: network-cost (\d*))?/,
      names: [
        'foundation',
        'component',
        'transport',
        'priority',
        'ip',
        'port',
        'type',
        'raddr',
        'rport',
        'tcptype',
        'generation',
        'network-id',
        'network-cost',
      ],
      format: function (o: {
        foundation: string;
        component: number;
        transport: string;
        priority: number;
        ip: string;
        port: number;
        type: string;
        raddr?: string;
        rport?: number;
        tcptype?: string;
        generation?: number;
        'network-id'?: number;
        'network-cost'?: number;
      }) {
        let str = 'candidate:%s %d %s %d %s %d typ %s';

        str += o.raddr != null ? ' raddr %s rport %d' : '%v%v';

        // NB: candidate has three optional chunks, so %void middles one if it's missing
        str += o.tcptype != null ? ' tcptype %s' : '%v';

        if (o.generation != null) {
          str += ' generation %d';
        }

        str += o['network-id'] != null ? ' network-id %d' : '%v';
        str += o['network-cost'] != null ? ' network-cost %d' : '%v';

        return str;
      },
    },
    {
      // a=end-of-candidates (keep after the candidates line for readability)
      name: 'endOfCandidates',
      reg: /^(end-of-candidates)/,
      format: '%s',
    },
    {
      // a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
      name: 'remoteCandidates',
      reg: /^remote-candidates:(.*)/,
      format: 'remote-candidates:%s',
    },
    {
      // a=ice-options:google-ice
      name: 'iceOptions',
      reg: /^ice-options:(\S*)/,
      format: 'ice-options:%s',
    },
    {
      // a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
      push: 'ssrcs',
      reg: /^ssrc:(\d*) ([\w_-]*)(?::(.*))?/,
      names: ['id', 'attribute', 'value'],
      format: function (o: { id: number; attribute?: string; value?: string }) {
        let str = 'ssrc:%d';

        if (o.attribute != null) {
          str += ' %s';

          if (o.value != null) {
            str += ':%s';
          }
        }

        return str;
      },
    },
    {
      // a=ssrc-group:FEC 1 2
      // a=ssrc-group:FEC-FR 3004364195 1080772241
      push: 'ssrcGroups',
      // token-char = %x21 / %x23-27 / %x2A-2B / %x2D-2E / %x30-39 / %x41-5A / %x5E-7E
      reg: /^ssrc-group:([\x21\x23\x24\x25\x26\x27\x2A\x2B\x2D\x2E\w]*) (.*)/,
      names: ['semantics', 'ssrcs'],
      format: 'ssrc-group:%s %s',
    },
    {
      // a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
      name: 'msidSemantic',
      reg: /^msid-semantic:\s?(\w*) (\S*)/,
      names: ['semantic', 'token'],
      format: 'msid-semantic: %s %s', // space after ':' is not accidental
    },
    {
      // a=group:BUNDLE audio video
      push: 'groups',
      reg: /^group:(\w*) (.*)/,
      names: ['type', 'mids'],
      format: 'group:%s %s',
    },
    {
      // a=rtcp-mux
      name: 'rtcpMux',
      reg: /^(rtcp-mux)/,
      format: '%s',
    },
    {
      // a=rtcp-rsize
      name: 'rtcpRsize',
      reg: /^(rtcp-rsize)/,
      format: '%s',
    },
    {
      // a=sctpmap:5000 webrtc-datachannel 1024
      name: 'sctpmap',
      reg: /^sctpmap:([\w_/]*) (\S*)(?: (\S*))?/,
      names: ['sctpmapNumber', 'app', 'maxMessageSize'],
      format: function (o: {
        sctpmapNumber: number;
        app: string;
        maxMessageSize?: string;
      }) {
        return o.maxMessageSize != null ? 'sctpmap:%d %s %d' : 'sctpmap:%d %s';
      },
    },
    {
      // a=x-google-flag:conference
      name: 'xGoogleFlag',
      reg: /^x-google-flag:([^\s]*)/,
      format: 'x-google-flag:%s',
    },
    {
      // a=rid:1 send max-width=1280;max-height=720;max-fps=30;depend=0
      push: 'rids',
      reg: /^rid:([\w]+) (\w+)(?: ([\S| ]*))?/,
      names: ['id', 'direction', 'params'],
      format: function (o: {
        id: string;
        direction: 'send' | 'recv';
        params?: string;
      }) {
        return o.params ? 'rid:%d %s %s' : 'rid:%d %s';
      },
    },
    {
      // a=imageattr:97 send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320] recv [x=330,y=250]
      // a=imageattr:* send [x=800,y=640] recv *
      // a=imageattr:100 recv [x=320,y=240]
      push: 'imageattrs',
      reg: new RegExp(
        // a=imageattr:97
        '^imageattr:(\\d+|\\*)' +
          // send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320]
          '[\\s\\t]+(send|recv)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*)' +
          // recv [x=330,y=250]
          '(?:[\\s\\t]+(recv|send)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*))?'
      ),
      names: ['pt', 'dir1', 'attrs1', 'dir2', 'attrs2'],
      format: function (o: {
        pt: number | '*';
        dir1: 'send' | 'recv';
        attrs1: string;
        dir2?: 'send' | 'recv';
        attrs2?: string;
      }) {
        return 'imageattr:%s %s %s' + (o.dir2 ? ' %s %s' : '');
      },
    },
    {
      // a=simulcast:send 1,2,3;~4,~5 recv 6;~7,~8
      // a=simulcast:recv 1;4,5 send 6;7
      name: 'simulcast',
      reg: new RegExp(
        // a=simulcast:
        '^simulcast:' +
          // send 1,2,3;~4,~5
          '(send|recv) ([a-zA-Z0-9\\-_~;,]+)' +
          // space + recv 6;~7,~8
          '(?:\\s?(send|recv) ([a-zA-Z0-9\\-_~;,]+))?' +
          // end
          '$'
      ),
      names: ['dir1', 'list1', 'dir2', 'list2'],
      format: function (o: {
        dir1: 'send' | 'recv';
        list1: string;
        dir2?: 'send' | 'recv';
        list2?: string;
      }) {
        return 'simulcast:%s %s' + (o.dir2 ? ' %s %s' : '');
      },
    },
    {
      // old simulcast draft 03 (implemented by Firefox)
      //   https://tools.ietf.org/html/draft-ietf-mmusic-sdp-simulcast-03
      // a=simulcast: recv pt=97;98 send pt=97
      // a=simulcast: send rid=5;6;7 paused=6,7
      name: 'simulcast_03',
      reg: /^simulcast:[\s\t]+([\S+\s\t]+)$/,
      names: ['value'],
      format: 'simulcast: %s',
    },
    {
      // a=framerate:25
      // a=framerate:29.97
      name: 'framerate',
      reg: /^framerate:(\d+(?:$|\.\d+))/,
      format: 'framerate:%s',
    },
    {
      // RFC4570
      // a=source-filter: incl IN IP4 239.5.2.31 10.1.15.5
      name: 'sourceFilter',
      reg: /^source-filter: *(excl|incl) (\S*) (IP4|IP6|\*) (\S*) (.*)/,
      names: [
        'filterMode',
        'netType',
        'addressTypes',
        'destAddress',
        'srcList',
      ],
      format: 'source-filter: %s %s %s %s %s',
    },
    {
      // a=bundle-only
      name: 'bundleOnly',
      reg: /^(bundle-only)/,
      format: '%s',
    },
    {
      // a=label:1
      name: 'label',
      reg: /^label:(.+)/,
      format: 'label:%s',
    },
    {
      // RFC version 26 for SCTP over DTLS
      // https://datatracker.ietf.org/doc/html/rfc8841#name-sdp-sctp-port-attribute
      name: 'sctpPort',
      reg: /^sctp-port:(\d+)$/,
      format: 'sctp-port:%s',
    },
    {
      // RFC version 26 for SCTP over DTLS
      // https://datatracker.ietf.org/doc/html/rfc8841#name-sdp-max-message-size-attrib
      name: 'maxMessageSize',
      reg: /^max-message-size:(\d+)$/,
      format: 'max-message-size:%s',
    },
    {
      // RFC7273
      // a=ts-refclk:ptp=IEEE1588-2008:39-A7-94-FF-FE-07-CB-D0:37
      push: 'tsRefClocks',
      reg: /^ts-refclk:([^\s=]*)(?:=(\S*))?/,
      names: ['clksrc', 'clksrcExt'],
      format: function (o: { clksrc: string; clksrcExt?: string }) {
        return 'ts-refclk:%s' + (o.clksrcExt != null ? '=%s' : '');
      },
    },
    {
      // RFC7273
      // a=mediaclk:direct=963214424
      name: 'mediaClk',
      reg: /^mediaclk:(?:id=(\S*))? *([^\s=]*)(?:=(\S*))?(?: *rate=(\d+)\/(\d+))?/,
      names: [
        'id',
        'mediaClockName',
        'mediaClockValue',
        'rateNumerator',
        'rateDenominator',
      ],
      format: function (o: {
        id?: string;
        mediaClockName: string;
        mediaClockValue?: string;
        rateNumerator?: string;
        rateDenominator?: string;
      }) {
        let str = 'mediaclk:';

        str += o.id != null ? 'id=%s %s' : '%v%s';
        str += o.mediaClockValue != null ? '=%s' : '';
        str += o.rateNumerator != null ? ' rate=%s' : '';
        str += o.rateDenominator != null ? '/%s' : '';

        return str;
      },
    },
    {
      // a=keywds:keywords
      name: 'keywords',
      reg: /^keywds:(.+)$/,
      format: 'keywds:%s',
    },
    {
      // a=content:main
      name: 'content',
      reg: /^content:(.+)/,
      format: 'content:%s',
    },
    // BFCP https://tools.ietf.org/html/rfc4583
    {
      // a=floorctrl:c-s
      name: 'bfcpFloorCtrl',
      reg: /^floorctrl:(c-only|s-only|c-s)/,
      format: 'floorctrl:%s',
    },
    {
      // a=confid:1
      name: 'bfcpConfId',
      reg: /^confid:(\d+)/,
      format: 'confid:%s',
    },
    {
      // a=userid:1
      name: 'bfcpUserId',
      reg: /^userid:(\d+)/,
      format: 'userid:%s',
    },
    {
      // a=floorid:1
      name: 'bfcpFloorId',
      reg: /^floorid:(.+) (?:m-stream|mstrm):(.+)/,
      names: ['id', 'mStream'],
      format: 'floorid:%s mstrm:%s',
    },
    {
      // any a= that we don't understand is kept verbatim on media.invalid
      push: 'invalid',
      reg: /(.*)/,
      names: ['value'],
      format: '%s',
    },
  ],
};
