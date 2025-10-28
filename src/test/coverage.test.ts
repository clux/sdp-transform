import * as fs from 'node:fs';
import { parse } from '../index';

const SdpFiles = [
  { file: 'normal.sdp', invalid: false },
  { file: 'hacky.sdp', invalid: false },
  { file: 'icelite.sdp', invalid: false },
  { file: 'jssip.sdp', invalid: false },
  { file: 'jsep.sdp', invalid: false },
  { file: 'alac.sdp', invalid: true },
  { file: 'onvif.sdp', invalid: false },
  { file: 'ssrc.sdp', invalid: false },
  { file: 'simulcast.sdp', invalid: false },
  { file: 'st2022-6.sdp', invalid: false },
  { file: 'st2110-20.sdp', invalid: false },
  { file: 'sctp-dtls-26.sdp', invalid: false },
  { file: 'extmap-encrypt.sdp', invalid: false },
  { file: 'dante-aes67.sdp', invalid: false },
  { file: 'bfcp.sdp', invalid: false },
  { file: 'tcp-active.sdp', invalid: false },
  { file: 'tcp-passive.sdp', invalid: false },
  { file: 'mediaclk-avbtp.sdp', invalid: false },
  { file: 'mediaclk-ptp-v2-w-rate.sdp', invalid: false },
  { file: 'mediaclk-ptp-v2.sdp', invalid: false },
  { file: 'mediaclk-rtp.sdp', invalid: false },
  { file: 'ts-refclk-media.sdp', invalid: false },
  { file: 'ts-refclk-sess.sdp', invalid: false },
  { file: 'rtcp-fb.sdp', invalid: false },
];

for (const { file, invalid } of SdpFiles) {
  test(file, () => {
    const sdp = fs.readFileSync(__dirname + `/${file}`, 'utf8');
    const session = parse(sdp);

    for (const media of session.media) {
      if (invalid) {
        expect(Array.isArray(media.invalid)).toBeTruthy();
      } else {
        expect(media.invalid).toBeUndefined();
      }
    }
  });
}
