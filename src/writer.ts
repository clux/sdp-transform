import { grammar } from './grammar';
import type { GrammarAttributeValue } from './grammar';
import type { SessionDescription, MediaDescription } from './types';

// customized util.format - discards excess arguments and can void middle ones
const FormatRegExp = /%[sdv%]/g;

// RFC specified order
// TODO: extend this with all the rest
const DefaultOuterOrder = [
  'v',
  'o',
  's',
  'i',
  'u',
  'e',
  'p',
  'c',
  'b',
  't',
  'r',
  'z',
  'a',
];

const DefaultInnerOrder = ['i', 'c', 'b', 'a'];

/**
 * Options for {@link write write()}.
 *
 * @hidden
 */
export type WriteOptions = {
  outerOrder?: string[];
  innerOrder?: string[];
};

/**
 * Serializes the given session description object into a SDP string.
 *
 * @example
 * ```ts
 * import { write } from 'sdp-transform';
 *
 * write(session)
 * // =>
 * 'v=0\r\n' +
 * 'o=- 20518 0 IN IP4 203.0.113.1\r\n' +
 * 's= \r\n' +
 * 'c=IN IP4 203.0.113.1\r\n' +
 * 't=0 0\r\n' +
 * 'a=ice-ufrag:F7gI\r\n' +
 * 'a=ice-pwd:x9cml/YzichV2+XlhiMu8g\r\n' +
 * 'a=fingerprint:sha-1 42:89:c5:c6:55:9d:6e:c8:e8:83:55:2a:39:f9:b6:eb:e9:a3:a9:e7\r\n' +
 * 'm=audio 54400 RTP/SAVPF 0 96\r\n' +
 * 'a=rtpmap:0 PCMU/8000\r\n' +
 * 'a=rtpmap:96 opus/48000\r\n' +
 * 'a=ptime:20\r\n' +
 * 'a=sendrecv\r\n' +
 * 'a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host\r\n' +
 * 'a=candidate:1 2 UDP 2113667326 203.0.113.1 54401 typ host\r\n' +
 * 'm=video 55400 RTP/SAVPF 97 98\r\n' +
 * 'a=rtpmap:97 H264/90000\r\n' +
 * 'a=rtpmap:98 VP8/90000\r\n' +
 * 'a=fmtp:97 profile-level-id=4d0028;packetization-mode=1\r\n' +
 * 'a=sendrecv\r\n' +
 * 'a=candidate:0 1 UDP 2113667327 203.0.113.1 55400 typ host\r\n' +
 * 'a=candidate:1 2 UDP 2113667326 203.0.113.1 55401 typ host\r\n'
 * ```
 *
 * When parsing and then writing the same SDP, the only thing different from
 * the original input is we follow the order specified by the SDP RFC, and we
 * will always do so.
 */
export function write(
  session: SessionDescription,
  /**
   * @hidden
   */
  options?: WriteOptions
): string {
  // ensure certain properties exist

  if (session.version == null) {
    // 'v=0' must be there (only defined version atm)
    session.version = 0;
  }

  if (session.name == null) {
    // 's= ' must be there if no meaningful name set
    session.name = ' ';
  }

  for (const media of session.media) {
    if (media.payloads == null) {
      media.payloads = '';
    }
  }

  const outerOrder = options?.outerOrder ?? DefaultOuterOrder;
  const innerOrder = options?.innerOrder ?? DefaultInnerOrder;
  const sdp: string[] = [];

  // loop through outerOrder for matching properties on session
  for (const type of outerOrder) {
    for (const obj of grammar[type] ?? []) {
      if (session[obj.name as keyof SessionDescription] != null) {
        sdp.push(makeLine(type, obj, session));
      } else if (
        session[obj.push as keyof SessionDescription] &&
        Array.isArray(session[obj.push as keyof SessionDescription])
      ) {
        for (const el of session[
          obj.push as keyof SessionDescription
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any[]) {
          sdp.push(makeLine(type, obj, el));
        }
      }
    }
  }

  // then for each media line, follow the innerOrder
  for (const media of session.media) {
    sdp.push(makeLine('m', grammar['m']![0]!, media));

    for (const type of innerOrder) {
      for (const obj of grammar[type] ?? []) {
        if (media[obj.name as keyof MediaDescription] != null) {
          sdp.push(makeLine(type, obj, media));
        } else if (
          media[obj.push as keyof MediaDescription] &&
          Array.isArray(media[obj.push as keyof MediaDescription])
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const el of media[obj.push as keyof MediaDescription] as any[]) {
            sdp.push(makeLine(type, obj, el));
          }
        }
      }
    }
  }

  return `${sdp.join('\r\n')}\r\n`;
}

function format(...args: string[]): string {
  const formatStr = args[0]!;
  const len = args.length;

  let i = 1;

  return formatStr.replace(FormatRegExp, function (x) {
    if (i >= len) {
      // missing argument
      return x;
    }

    const arg = args[i];

    i++;

    switch (x) {
      case '%%': {
        return '%';
      }

      case '%s': {
        return String(arg);
      }

      case '%d': {
        return arg!;
      }

      case '%v': {
        return '';
      }

      default: {
        return '';
      }
    }
  });

  // NB: we discard excess arguments - they are typically undefined from makeLine
}

function makeLine(
  type: string,
  obj: GrammarAttributeValue,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  location: any
): string {
  const str =
    obj.format instanceof Function
      ? obj.format(obj.push ? location : location[obj.name!])
      : obj.format;

  const args = [`${type}=${str}`];

  if (obj.names) {
    for (const name of obj.names) {
      if (obj.name) {
        args.push(location[obj.name][name]);
      } else {
        // for mLine and push attributes
        args.push(location[name]);
      }
    }
  } else {
    args.push(location[obj.name!]);
  }

  return format(...args);
}
