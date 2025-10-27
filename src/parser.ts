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

export function parseParams(str: string): ParamMap {
  return str.split(/;\s?/).reduce(paramReducer, {});
}

export function parsePayloads(str: string): number[] {
  return str.toString().split(' ').map(Number);
}

export function parseRemoteCandidates(str: string): RemoteCandidate[] {
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

export function parseImageAttributes(params: string): ImageAttributes[] {
  return params.split(' ').map(function (item) {
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

export function parseSimulcast(str: string): SimulcastStream[] {
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
