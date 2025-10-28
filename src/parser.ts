import { grammar } from './grammar';
import type { GrammarAttributeValue } from './grammar';
import type {
  SessionDescription,
  MediaDescription,
  MediaAttributes,
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
 *   'o=- 20518 0 IN IP4 203.0.113.1\r\n' +
 *   's= \r\n' +
 *   't=0 0\r\n' +
 *   'c=IN IP4 203.0.113.1\r\n' +
 *   'a=ice-ufrag:F7gI\r\n' +
 *   'a=ice-pwd:x9cml/YzichV2+XlhiMu8g\r\n' +
 *   'a=fingerprint:sha-1 42:89:c5:c6:55:9d:6e:c8:e8:83:55:2a:39:f9:b6:eb:e9:a3:a9:e7\r\n' +
 *   'm=audio 54400 RTP/SAVPF 0 96\r\n' +
 *   'a=rtpmap:0 PCMU/8000\r\n' +
 *   'a=rtpmap:96 opus/48000\r\n' +
 *   'a=ptime:20\r\n' +
 *   'a=sendrecv\r\n' +
 *   'a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host\r\n' +
 *   'a=candidate:1 2 UDP 2113667326 203.0.113.1 54401 typ host\r\n' +
 *   'm=video 55400 RTP/SAVPF 97 98\r\n' +
 *   'a=rtpmap:97 H264/90000\r\n' +
 *   'a=fmtp:97 profile-level-id=4d0028;packetization-mode=1\r\n' +
 *   'a=rtpmap:98 VP8/90000\r\n' +
 *   'a=sendrecv\r\n' +
 *   'a=candidate:0 1 UDP 2113667327 203.0.113.1 55400 typ host\r\n' +
 *   'a=candidate:1 2 UDP 2113667326 203.0.113.1 55401 typ host\r\n'
 *
 * const session = parse(sdp);
 * // =>
 * {
 *   version: 0,
 *   origin: {
 *     username: '-',
 *     sessionId: 20518,
 *     sessionVersion: 0,
 *     netType: 'IN',
 *     ipVer: 4,
 *     address: '203.0.113.1'
 *   },
 *   name: ' ',
 *   timing: {
 *     start: 0,
 *     stop: 0
 *   },
 *   connection: {
 *     version: 4,
 *     ip: '203.0.113.1'
 *   },
 *   iceUfrag: 'F7gI',
 *   icePwd: 'x9cml/YzichV2+XlhiMu8g',
 *   fingerprint: {
 *     type: 'sha-1',
 *     hash: '42:89:c5:c6:55:9d:6e:c8:e8:83:55:2a:39:f9:b6:eb:e9:a3:a9:e7'
 *   },
 *   media: [
 *     {
 *       rtp: [
 *         {
 *           payload: 0,
 *           codec: 'PCMU',
 *           rate: 8000
 *         },
 *         {
 *           payload: 96,
 *           codec: 'opus',
 *           rate: 48000
 *         }
 *       ],
 *       fmtp: [],
 *       type: 'audio',
 *       port: 54400,
 *       protocol: 'RTP/SAVPF',
 *       payloads: '0 96',
 *       ptime: 20,
 *       direction: 'sendrecv',
 *       candidates: [
 *         {
 *           foundation: 0,
 *           component: 1,
 *           transport: 'UDP',
 *           priority: 2113667327,
 *           ip: '203.0.113.1',
 *           port: 54400,
 *           type: 'host'
 *         },
 *         {
 *           foundation: 1,
 *           component: 2,
 *           transport: 'UDP',
 *           priority: 2113667326,
 *           ip: '203.0.113.1',
 *           port: 54401,
 *           type: 'host'
 *         }
 *       ]
 *     },
 *     {
 *       rtp: [
 *         {
 *           payload: 97,
 *           codec: 'H264',
 *           rate: 90000
 *         },
 *         {
 *           payload: 98,
 *           codec: 'VP8',
 *           rate: 90000
 *         }
 *       ],
 *       fmtp: [
 *         {
 *           payload: 97,
 *           config: 'profile-level-id=4d0028;packetization-mode=1'
 *         }
 *       ],
 *       type: 'video',
 *       port: 55400,
 *       protocol: 'RTP/SAVPF',
 *       payloads: '97 98',
 *       direction: 'sendrecv',
 *       candidates: [
 *         {
 *           foundation: 0,
 *           component: 1,
 *           transport: 'UDP',
 *           priority: 2113667327,
 *           ip: '203.0.113.1',
 *           port: 55400,
 *           type: 'host'
 *         },
 *         {
 *           foundation: 1,
 *           component: 2,
 *           transport: 'UDP',
 *           priority: 2113667326,
 *           ip: '203.0.113.1',
 *           port: 55401,
 *           type: 'host'
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * In this example, only slightly dodgy string coercion case here is for
 * {@link MediaAttributes.candidates `candidates[i].foundation`}, which can be
 * a string, but in this case can be equally parsed as an integer.
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
 * Parses {@link MediaAttributes.fmtp `fmtp.config`} and others such as
 * {@link MediaAttributes.rids `rid.params`} and returns an object with all the
 * params in a key/value fashion.
 *
 * @example
 * ```ts
 * import { parseParams } from 'sdp-transform';
 *
 * // Parse `fmtp.config`:
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
 * Parses {@link MediaAttributes.remoteCandidates `media.remoteCandidates`}
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

/**
 * Parses [Generic Image Attributes](https://tools.ietf.org/html/rfc6236). Must
 * be provided with the `attrs1` or `attrs2` string of a
 * {@link MediaAttributes.imageattrs `media.imageattrs`} entry.
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
 * Parses [simulcast](https://datatracker.ietf.org/doc/rfc8853/) streams/formats.
 * Must be provided with the `list1` or `list2` string of the
 * {@link MediaAttributes.simulcast `media.simulcast`} field.
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
