1.5.3 / 2015-11-25
==================
 * Parse tcp ice-candidates with raddr + rport correctly - #37 via @damencho

1.5.2 / 2015-11-17
==================
  * Parse tcp ice-candidates lines correctly - #35 via @virtuacoplenny

1.5.1 / 2015-11-15
==================
  * Added `.npmignore`

1.5.0 / 2015-09-05
==================
  * Suport AirTunes a=rtpmap lines without clockrate #30 - via @DuBistKomisch

1.4.1 / 2015-08-14
==================
  * Proper handling of whitespaces in a=fmtp: lines #29 - via @bgrozev
  * `parseFmtpConfig` helper also handles whitespaces properly

1.4.0 / 2015-03-18
==================
  * Add support for `a=rtcp-rsize`

1.3.0 / 2015-03-16
==================
  * Add support for `a=end-of-candidates` trickle ice attribute

1.2.1 / 2015-03-15
==================
  * Add parsing for a=ssrc-group

1.2.0 / 2015-03-05
==================
  * a=msid attributes support and msid-semantic improvements
  * writer now ignores `undefined` or `null` values

1.1.0 / 2014-10-20
==================
  * Add support for parsing session level `a=ice-lite`

1.0.0 / 2014-09-30
==================
  * Be more lenient with nelines. Allow \r\n, \r or \n.

0.6.1 / 2014-07-25
==================
  * Documentation and test coverage release

0.6.0 / 2014-02-18
==================
  * invalid a= lines are now parsed verbatim in `media[i].invalid` (#19)
  * everything in `media[i].invalid` is written out verbatim (#19)
  * add basic RTSP support (a=control lines) (#20)

0.5.3 / 2014-01-17
==================
  * ICE candidates now parsed fully (no longer ignoring optional attrs) (#13)

0.5.2 / 2014-01-17
==================
  * Remove `util` dependency to help browserify users
  * Better parsing of `a=extmap`, `a=crypto` and `a=rtcp-fb` lines
  * `sdp-verify` bin file included to help discover effects of `write ∘ parse`

0.5.1 / 2014-01-16
==================
  * Correctly parse a=rtpmap with telephone-event codec #16
  * Correctly parse a=rtcp lines that conditionally include the IP #16

0.5.0 / 2014-01-14
==================
  * Enforce spec mandated \r\n line endings over \n (#15)
  * Parsing of opus rtpmap wrong because encoding parameters were discarded (#12)

0.4.1 / 2013-12-19
==================
  * Changed 'sendrecv' key on media streams to be called 'direction' to match SDP related RFCs (thanks to @saghul)

0.3.3 / 2013-12-10
==================
  * Fixed a bug that caused time description lines ("t=" and "z=") to be in the wrong place

0.3.2 / 2013-10-21
==================
  * Fixed a bug where large sessionId values where being rounded (#8)
  * Optionally specify the `outerOrder` and `innerOrder` for the writer (allows working around Chrome not following the RFC specified order in #7)

0.3.1 / 2013-10-19
==================
  * Fixed a bug that meant the writer didn't write the last newline (#6)

0.3.0 / 2013-10-18
==================
  * Changed ext grammar to parse id and direction as one (fixes writing bug)
  * Allow mid to be a string (fixes bug)
  * Add support for maxptime value
  * Add support for ice-options
  * Add support for grouping frameworks
  * Add support for msid-semantic
  * Add support for ssrc
  * Add support for rtcp-mux
  * Writer improvements: add support for session level push attributes

0.2.1 / 2013-07-31
==================
  * Support release thanks to @legastero, following was pulled from his fork:
  * Add support for rtcp-fb attributes.
  * Add support for header extension (extmap) attributes.
  * Add support for crypto attributes.
  * Add remote-candidates attribute support and parser.

0.2.0 / 2013-07-27
==================
  * parse most normal lines sensibly
  * factored out grammar properly
  * added a writer that uses common grammar
  * stop preprocessing parse object explicitly (so that parser ∘ writer == Id)
    these parser helpers are instead exposed (may in the future be extended)

0.1.0 / 2013-07-21
==================
  * rewrite parsing mechanism
  * parse origin lines more efficiently
  * parsing output now significantly different

0.0.2 / 2012-07-18
==================
  * ice properties parsed

0.0.1 / 2012-07-17
==================
  * Original release
