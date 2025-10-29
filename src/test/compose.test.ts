import * as fs from 'node:fs';
import { parse, write } from '../index';

const SdpFiles = [
  'normal.sdp',
  'hacky.sdp',
  'icelite.sdp',
  'invalid.sdp',
  'jssip.sdp',
  'jsep.sdp',
  'alac.sdp',
  'onvif.sdp',
  'ssrc.sdp',
  'simulcast.sdp',
  'st2022-6.sdp',
  'st2110-20.sdp',
  'sctp-dtls-26.sdp',
  'extmap-encrypt.sdp',
  'dante-aes67.sdp',
  'bfcp.sdp',
  'tcp-active.sdp',
  'tcp-passive.sdp',
  'mediaclk-avbtp.sdp',
  'mediaclk-ptp-v2-w-rate.sdp',
  'mediaclk-ptp-v2.sdp',
  'mediaclk-rtp.sdp',
  'ts-refclk-media.sdp',
  'ts-refclk-sess.sdp',
  'rtcp-fb.sdp',
];

for (const file of SdpFiles) {
  test(file, () => {
    const sdp1 = fs.readFileSync(__dirname + `/${file}`, 'utf8');
    const session1 = parse(sdp1);
    const sdp2 = write(session1);
    const session2 = parse(sdp2);

    expect(session1).toEqual(session2);

    // This only tests that (parse ∘ write) == Id on the image of the parse.
    // It also doesn't test if (write ∘ parse) is the identity: which it isnt.
    // Properties may get reordered slightly (up to RFC legality).
    // However: (write ∘ parse) should be the identity on the image of write
    // because our own ordering is deterministic.
    expect(sdp2).toBe(write(session2));
  });
}
