import { grammar } from './grammar';
import type { Grammar } from './grammar';
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

export type WriteOptions = {
  outerOrder?: string[];
  innerOrder?: string[];
};

export function write(
  session: SessionDescription,
  options: WriteOptions = {}
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

  const outerOrder = options.outerOrder ?? DefaultOuterOrder;
  const innerOrder = options.innerOrder ?? DefaultInnerOrder;
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
  obj: Grammar[keyof Grammar][number],
  location: SessionDescription | MediaDescription
): string {
  const str =
    obj.format instanceof Function
      ? obj.format(
          obj.push
            ? location
            : location[
                obj.name as keyof (SessionDescription | MediaDescription)
              ]
        )
      : obj.format;

  const args = [`${type}=${str}`];

  if (obj.names) {
    for (const name of obj.names) {
      if (obj.name) {
        args.push(
          (
            location[
              obj.name as keyof (SessionDescription | MediaDescription)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ] as any
          )[name]
        );
      } else {
        // for mLine and push attributes
        args.push(
          location[
            name as keyof (SessionDescription | MediaDescription)
          ] as string
        );
      }
    }
  } else {
    args.push(
      location[
        obj.name as keyof (SessionDescription | MediaDescription)
      ] as string
    );
  }

  return format(...args);
}
