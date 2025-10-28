/**
 * @see https://tools.ietf.org/html/rfc4566
 * @see https://www.iana.org/assignments/sdp-parameters/sdp-parameters.xhtml
 */

/**
 * Session descriptor attributes that exist only at the session level (before an `m=`
 * block).
 *
 * @see https://tools.ietf.org/html/rfc4566#section-9
 */
export interface SessionDescription
  extends SharedDescriptionFields,
    SessionAttributes {
  /**
   * `v=` attribute.
   */
  version: number;
  /**
   * `o=` attribute.
   */
  origin: {
    username: string;
    sessionId: string | number;
    sessionVersion: number;
    netType: string;
    ipVer: number;
    address: string;
  };
  /**
   * `s=` attribute.
   */
  name: string;
  /**
   *  `t=` attribute.
   */
  timing: {
    start: number;
    stop: number;
  };
  /**
   * `u=` attribute.
   */
  uri?: string;
  /**
   * `e=` attribute.
   */
  email?: string;
  /**
   * `p=` attribute.
   */
  phone?: string;
  /**
   * `z=` attribute.
   */
  timezones?: string;
  /**
   * `r=` attribute.
   */
  repeats?: string;
  /**
   * `m=` attribute.
   */
  media: MediaDescription[];
}

/**
 * Attributes that only exist at the session level (before an `m=` block).
 *
 * @see https://www.iana.org/assignments/sdp-parameters/sdp-parameters.xhtml#sdp-parameters-7
 */
export interface SessionAttributes extends SharedAttributes {
  /**
   * `a=ice-lite` attribute.
   */
  icelite?: 'ice-lite';
  /**
   * `a=msid-semantic` attribute.
   *
   * @example
   * ```
   * a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
   * ```
   */
  msidSemantic?: {
    semantic: string;
    token: string;
  };
  /**
   * `a=group` attribute.
   *
   * @example
   * ```ts
   * a=group:BUNDLE audio video
   * ```
   */
  groups?: {
    type: string;
    mids: string;
  }[];
  /**
   * `a=keywds` attribute.
   */
  keywords?: string;
}

/**
 * Session descriptor attributes that exist only at the media level (in each
 * `m=` block).
 */
export interface MediaDescription
  extends SharedDescriptionFields,
    MediaAttributes {
  /**
   * Type of media.
   */
  type: string;
  /**
   * Port.
   */
  port: number;
  /**
   * Protocol.
   */
  protocol: string;
  /**
   * Codec payloads.
   */
  payloads?: string;
}

/**
 * Attributes that only exist at the media level (within an `m=` block).
 *
 * @see https://www.iana.org/assignments/sdp-parameters/sdp-parameters.xhtml#sdp-parameters-9
 */
export interface MediaAttributes extends SharedAttributes {
  /**
   * `a=rtpmap` attribute.
   *
   * @example
   * `a=rtpmap:110 opus/48000/2`
   */
  rtp: {
    payload: number;
    codec: string;
    rate?: number;
    encoding?: number;
  }[];
  /**
   * `a=fmtp` attribute.
   *
   * @example
   * ```
   * a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
   * a=fmtp:111 minptime=10; useinbandfec=1
   * ```
   */
  fmtp: {
    payload: number;
    config: string;
  }[];
  /**
   * `a=rtcp` attribute.
   *
   * @example
   * ```
   * a=rtcp:65179 IN IP4 193.84.77.194
   * ```
   */
  rtcp?: {
    port: number;
    netType?: string;
    ipVer?: number;
    address?: string;
  };
  /**
   * `a=rtcp-fb` attribute.
   *
   * @example
   * ```
   * a=rtcp-fb:98 nack rpsi
   * a=rtcp-fb:* pli
   * ```
   */
  rtcpFb?: {
    payload: number | string;
    type: string;
    subtype?: string;
  }[];
  /**
   * `a=rtcp-fb` attribute.
   *
   * @example
   * ```
   * a=rtcp-fb:98 trr-int 100
   * ```
   */
  rtcpFbTrrInt?: {
    payload: number | string;
    value: number;
  }[];
  /**
   * `a=mid` attribute.
   *
   * @example
   * ```
   * a=mid:1
   * a=mid:foo
   * ```
   */
  mid?: string;
  /**
   * `a=msid` attribute.
   *
   * @example
   * ```
   * a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
   * ```
   */
  msid?: { id: string; appdata?: string }[];
  /**
   * `a=ptime` attribute.
   *
   * @example
   * ```
   * a=ptime:20
   * ```
   */
  ptime?: number;
  /**
   * `a=maxptime` attribute.
   *
   * @example
   * ```
   * a=maxptime:60
   * ```
   */
  maxptime?: number;
  /**
   * `a=crypto` attribute.
   *
   * @example
   * ```
   * a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
   * ```
   */
  crypto?: {
    id: number;
    suite: string;
    config: string;
    sessionConfig?: string;
  }[];
  /**
   * `a=bundle-only`
   */
  bundleOnly?: 'bundle-only';
  /**
   * `a=candidate` attribute.
   *
   * @example
   * ```
   * a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
   * a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0 network-id 3 network-cost 10
   * a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0 network-id 3 network-cost 10
   * a=candidate:229815620 1 tcp 1518280447 192.168.150.19 60017 typ host tcptype active generation 0 network-id 3 network-cost 10
   * a=candidate:3289912957 2 tcp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 tcptype passive generation 0 network-id 3 network-cost 10
   * ```
   */
  candidates?: {
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
  }[];
  /**
   * `a=end-of-candidates` attribute.
   */
  endOfCandidates?: 'end-of-candidates';
  /**
   * `a=remote-candidates` attribute.
   *
   * @example
   * ```
   * a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401
   * ```
   */
  remoteCandidates?: string;
  /**
   * `a=ssrc` attribute.
   *
   * @example
   * ```
   * a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
   * ```
   */
  ssrcs?: {
    id: number;
    attribute: string;
    value?: string;
  }[];
  /**
   * `a=ssrc-group` attribute.
   *
   * @example
   * ```
   * a=ssrc-group:FEC 1 2
   * a=ssrc-group:FEC-FR 3004364195 1080772241
   * ```
   */
  ssrcGroups?: {
    semantics: string;
    ssrcs: string;
  }[];
  /**
   * `a=rtcp-mux` attribute.
   */
  rtcpMux?: 'rtcp-mux';
  /**
   * `a=rtcp-rsize` attribute.
   */
  rtcpRsize?: 'rtcp-rsize';
  /**
   * `a=sctpmap` attribute.
   *
   * @example
   * ```
   * a=sctpmap:5000 webrtc-datachannel 1024
   * ```
   */
  sctpmap?: {
    sctpmapNumber: number;
    app: string;
    maxMessageSize?: number;
  };
  /**
   * `a=x-google-flag` attribute.
   *
   * @deprecated
   * @example
   * ```
   * a=x-google-flag:conference
   * ```
   */
  xGoogleFlag?: 'conference';
  /**
   * `a=rid` attribute.
   *
   * @example
   * ```
   * a=rid:1 send max-width=1280;max-height=720;max-fps=30;depend=0
   * ```
   */
  rids?: {
    id: number | string;
    direction: string;
    params?: string;
  }[];
  /**
   * `a=imageattr` attribute.
   *
   * @example
   * ```
   * a=imageattr:97 send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320] recv [x=330,y=250]
   * a=imageattr:* send [x=800,y=640] recv *
   * a=imageattr:100 recv [x=320,y=240]
   * ```
   */
  imageattrs?: {
    pt: number | string;
    dir1: 'send' | 'recv';
    attrs1: string;
    dir2?: 'send' | 'recv';
    attrs2?: string;
  }[];
  /**
   * `a=simulcast` attribute.
   *
   * @example
   * ```
   * a=simulcast:send 1,2,3;~4,~5 recv 6;~7,~8
   * a=simulcast:recv 1;4,5 send 6;7
   * ```
   */
  simulcast?: {
    dir1: 'send' | 'recv';
    list1: string;
    dir2?: 'send' | 'recv';
    list2?: string;
  };
  /**
   * `a=simulcast` attribute.
   *
   * @deprecated
   * @see https://tools.ietf.org/html/draft-ietf-mmusic-sdp-simulcast-03
   * @example
   * ```
   * a=simulcast: recv pt=97;98 send pt=97
   * a=simulcast: send rid=5;6;7 paused=6,7
   * ```
   */
  simulcast_03?: { value: string };
  /**
   * `a=framerate` attribute.
   *
   * @example
   * ```
   * a=framerate:25
   * a=framerate:29.97
   * ```
   */
  framerate?: number | string;
  /**
   * `a=label` attribute.
   *
   * @example
   * ```
   * a=label:1
   * ```
   */
  label?: string;
  /**
   * `a=sctp-port` attribute.
   *
   * @see https://datatracker.ietf.org/doc/html/rfc8841#name-sdp-sctp-port-attribute
   */
  sctpPort?: number;
  /**
   * `a=max-message-size` attribute.
   *
   * @see https://datatracker.ietf.org/doc/html/rfc8841#name-sdp-max-message-size-attrib
   */
  maxMessageSize?: number;
  /**
   * `a=content` attribute.
   */
  content?: string;
  /**
   * `a=floorctrl` attribute.
   *
   * @example
   * ```
   * a=floorctrl:c-s
   * ```
   */
  bfcpFloorCtrl?: string;
  /**
   * `a=config` attribute.
   *
   * @example
   * ```
   * a=confid:1
   * ```
   */
  bfcpConfId?: string;
  /**
   * `a=userid` attribute.
   *
   * @example
   * ```
   * a=userid:1
   * ```
   */
  bfcpUserId?: string;
  /**
   * `a=floorid` attribute.
   *
   * @example
   * ```
   * a=floorid:1
   * ```
   */
  bfcpFloorId?: {
    id: string;
    mStream: string;
  };
}

/**
 * Session descriptor attributes that exist at both the session level and media
 * level.
 *
 * @see https://tools.ietf.org/html/rfc4566#section-9
 */
export interface SharedDescriptionFields {
  /**
   * `i=` attribute.
   */
  description?: string;
  /**
   * `c=` attribute.
   *
   * @example
   * ```
   * c=IN IP4 10.47.197.26
   * ```
   */
  connection?: {
    version: number;
    ip: string;
  };
  /**
   * `b=` attribute.
   *
   * @example
   * ```
   * b=AS:4000
   * ```
   */
  bandwidth?: {
    type: 'TIAS' | 'AS' | 'CT' | 'RR' | 'RS';
    limit: number;
  }[];
}

/**
 * These attributes can exist on both the session level and the media level.
 *
 * https://www.iana.org/assignments/sdp-parameters/sdp-parameters.xhtml#sdp-parameters-8
 */
export interface SharedAttributes {
  /**
   * `a=sendrecv`, `a=recvonly`, `a=sendonly` and `a=inactive` attributes.
   */
  direction?: 'sendrecv' | 'recvonly' | 'sendonly' | 'inactive';
  /**
   * `a=control` attribute.
   *
   * @example
   * ```
   * a=control:streamid=0
   * ```
   */
  control?: string;
  /**
   * `a=ext` attribute.
   *
   * @example
   * ```
   * a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
   * a=extmap:1/recvonly URI-gps-string
   * a=extmap:3 urn:ietf:params:rtp-hdrext:encrypt urn:ietf:params:rtp-hdrext:smpte-tc 25@600/24
   * ```
   */
  ext?: {
    value: number;
    direction?: string;
    'encrypt-uri'?: string;
    uri: string;
    config?: string;
  }[];
  /**
   * `a=setup` attribute.
   *
   * @example
   * ```
   * a=setup:actpass
   * ```
   */
  setup?: string;
  /**
   * `a=connection` attribute.
   *
   * @example
   * ```
   * a=connection:new
   * ```
   */
  connectionType?: 'new' | 'existing';
  /**
   * `a=ice-ufrag` attribute.
   *
   * @example
   * ```
   * a=ice-ufrag:F7gI
   * ```
   */
  iceUfrag?: string;
  /**
   * `a=ice-pwd` attribute.
   *
   * @example
   * ```
   * a=ice-pwd:x9cml/YzichV2+XlhiMu8g
   * ```
   */
  icePwd?: string;
  /**
   * `a=fingerprint` attribute.
   *
   * @example
   * ```
   * a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
   * ```
   */
  fingerprint?: {
    type: string;
    hash: string;
  };
  /**
   * `a=source-filter` attribute.
   *
   * @example
   * ```
   * a=source-filter: incl IN IP4 239.5.2.31 10.1.15.5
   * ```
   */
  sourceFilter?: {
    filterMode: 'excl' | 'incl';
    netType: string;
    addressTypes: string;
    destAddress: string;
    srcList: string;
  };
  /**
   * `a=ts-refclk` attribute.
   *
   * @example
   * ```
   * a=ts-refclk:ptp=IEEE1588-2008:39-A7-94-FF-FE-07-CB-D0:37
   * ```
   */
  tsRefClocks?: {
    clksrc: string;
    clksrcExt?: string;
  }[];
  /**
   * `a=mediaclk` attribute.
   *
   * @example
   * ```
   * a=mediaclk:direct=963214424
   * ```
   */
  mediaClk?: {
    id?: string;
    mediaClockName?: string;
    mediaClockValue?: string;
    rateNumerator?: string;
    rateDenominator?: string;
  };
  /**
   * `a=extmap-allow-mixed` attribute.
   */
  extmapAllowMixed?: 'extmap-allow-mixed';
  /**
   * `a=ice-options` attribute.
   *
   * @example
   * ```
   * a=ice-options:renomination
   * ```
   */
  iceOptions?: string;
  /**
   * Inalid or unsupported attributes. They are stored as strings.
   */
  invalid?: { value: string }[];
}

/**
 * A parameter within an SDP attribute.
 */
export type ParamMap = {
  [paramName: string]: number | string | undefined;
};

/**
 * Remote ICE candidate.
 */
export type RemoteCandidate = {
  component: number;
  ip: string;
  port: number;
};

/**
 * Image attributes.
 */
export type ImageAttributes = {
  component: number;
  ip: string;
  port: number;
};

/**
 * Simulcast stream.
 */
export type SimulcastStream = {
  /**
   * Simulcast identifier.
   */
  scid: number | string;
  /**
   * Whether the simulcast format is paused.
   */
  paused: boolean;
}[];
